import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { AppError } from "@/lib/errors";
import type { UpdateProfileInput } from "@/server/validators/profile.validator";

type ProfileUser = Prisma.UserGetPayload<{ include: { profile: true } }>;

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

/** Verifies the real file signature instead of trusting the client MIME header. */
function isSupportedImage(bytes: Buffer): boolean {
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isPng =
    bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE);

  const isWebp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

function publicProfile(user: ProfileUser) {
  const profile = user.profile;

  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    profilePicture: profile?.profilePicture ?? null,
    referralCode: user.referralCode,
    balance: (profile?.balance ?? BigInt(0)).toString(),

    bio: profile?.bio ?? null,
    phone: profile?.phone ?? null,
    country: profile?.country ?? null,
    state: profile?.state ?? null,
    city: profile?.city ?? null,
    address: profile?.address ?? null,
    dateOfBirth: profile?.dateOfBirth
      ? profile.dateOfBirth.toISOString().slice(0, 10)
      : null,
    notificationsEnabled: profile?.notificationsEnabled ?? true,
  };
}

async function getUser(userId: string): Promise<ProfileUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Account not found.");
  }

  return user;
}

async function destroyImage(publicId: string, label: string) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error(`[cloudinary] ${label} failed:`, error);
  }
}

export const profileService = {
  async getProfile(userId: string) {
    return publicProfile(await getUser(userId));
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const {
      firstname,
      surname,
      username,
      bio,
      phone,
      country,
      state,
      city,
      address,
      dateOfBirth,
      notificationsEnabled,
    } = input;

    // Fields that live on the User model.
    const data: Prisma.UserUpdateInput = {};
    if (firstname !== undefined) data.firstname = firstname;
    if (surname !== undefined) data.surname = surname;
    if (username !== undefined) data.username = username;

    // Fields that live on the Profile model. undefined = leave unchanged, null = clear.
    const profileData: Prisma.ProfileCreateWithoutUserInput = {};
    if (bio !== undefined) profileData.bio = bio;
    if (phone !== undefined) profileData.phone = phone;
    if (country !== undefined) profileData.country = country;
    if (state !== undefined) profileData.state = state;
    if (city !== undefined) profileData.city = city;
    if (address !== undefined) profileData.address = address;
    if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth;
    if (notificationsEnabled !== undefined) {
      profileData.notificationsEnabled = notificationsEnabled;
    }

    if (Object.keys(profileData).length > 0) {
      data.profile = { upsert: { create: profileData, update: profileData } };
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
        include: { profile: true },
      });

      return publicProfile(user);
    } catch (error) {
      // The unique index is the source of truth, so there is no check-then-write race.
      if (hasPrismaCode(error, "P2002")) {
        throw new AppError(
          409,
          "USERNAME_TAKEN",
          "That username is already in use.",
          { fields: { username: "Choose another username." } },
        );
      }

      if (hasPrismaCode(error, "P2025")) {
        throw new AppError(404, "USER_NOT_FOUND", "Account not found.");
      }

      throw error;
    }
  },

  async uploadProfilePhoto(userId: string, file: File) {
    const user = await getUser(userId);
    const bytes = Buffer.from(await file.arrayBuffer());

    if (!isSupportedImage(bytes)) {
      throw new AppError(
        400,
        "INVALID_IMAGE",
        "Upload a valid JPEG, PNG, or WebP image.",
      );
    }

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "parrot-picks/profiles",
          public_id: randomUUID(),
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) {
            return reject(new Error("Cloudinary returned no result."));
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      stream.end(bytes);
    }).catch((error) => {
      console.error("[cloudinary] Upload failed:", error);
      throw new AppError(
        502,
        "IMAGE_UPLOAD_FAILED",
        "Could not upload your profile picture. Please try again.",
      );
    });

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            upsert: {
              create: {
                profilePicture: uploaded.secure_url,
                profilePictureId: uploaded.public_id,
              },
              update: {
                profilePicture: uploaded.secure_url,
                profilePictureId: uploaded.public_id,
              },
            },
          },
        },
        include: { profile: true },
      });

      // Remove the old image only after the database update succeeds.
      const previousId = user.profile?.profilePictureId;
      if (previousId && previousId !== uploaded.public_id) {
        await destroyImage(previousId, "Old image cleanup");
      }

      return publicProfile(updated);
    } catch (error) {
      // Roll back the new upload if the database write failed.
      await destroyImage(uploaded.public_id, "Rollback cleanup");
      throw error;
    }
  },

  async deleteProfilePhoto(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { profilePictureId: true },
    });

    // Nothing to remove, and no empty Profile row gets created.
    if (!profile) return { profilePicture: null };

    // Clear the database first; Cloudinary cleanup is best-effort.
    await prisma.profile.update({
      where: { userId },
      data: { profilePicture: null, profilePictureId: null },
    });

    if (profile.profilePictureId) {
      await destroyImage(profile.profilePictureId, "Image deletion");
    }

    return { profilePicture: null };
  },
};