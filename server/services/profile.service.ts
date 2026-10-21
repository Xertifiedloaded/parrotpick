
import { randomUUID } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { AppError } from "@/lib/errors";
import type { UpdateProfileInput } from "@/server/validators/profile.validator";

type ProfileUser = User & {
  profile: {
    profilePicture: string | null;
    profilePictureId: string | null;
    balance?: bigint;
  } | null;
};

function publicProfile(user: ProfileUser) {
  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    profilePicture: user.profile?.profilePicture ?? null,
    referralCode: user.referralCode,
    balance: (user.profile?.balance ?? BigInt(0)).toString(),
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

  return user as ProfileUser;
}

export const profileService = {
  async getProfile(userId: string) {
    return publicProfile(await getUser(userId));
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    await getUser(userId);

    if (input.username) {
      const existing = await prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      });

      if (existing && existing.id !== userId) {
        throw new AppError(
          409,
          "USERNAME_TAKEN",
          "That username is already in use.",
          {
            fields: {
              username: "Choose another username.",
            },
          },
        );
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.firstname !== undefined && {
            firstname: input.firstname,
          }),
          ...(input.surname !== undefined && {
            surname: input.surname,
          }),
          ...(input.username !== undefined && {
            username: input.username,
          }),
        },
        include: { profile: true },
      });

      return publicProfile(user as ProfileUser);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new AppError(
          409,
          "USERNAME_TAKEN",
          "That username is already in use.",
        );
      }

      throw error;
    }
  },

  async uploadProfilePhoto(userId: string, file: File) {
    const user = await getUser(userId);
    const bytes = Buffer.from(await file.arrayBuffer());

    // Validate the file signature instead of trusting the MIME header.
    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    const isPng =
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );

    const isWebp =
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";

    if (!(isJpeg || isPng || isWebp)) {
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
          if (error) {
            return reject(error);
          }

          if (!result) {
            return reject(
              new Error("Cloudinary returned no result."),
            );
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
        try {
          await cloudinary.uploader.destroy(previousId, {
            resource_type: "image",
          });
        } catch (error) {
          console.error(
            "[cloudinary] Old image cleanup failed:",
            error,
          );
        }
      }

      return publicProfile(updated as ProfileUser);
    } catch (error) {
      // Clean up the new upload if the database update fails.
      await cloudinary.uploader
        .destroy(uploaded.public_id, {
          resource_type: "image",
        })
        .catch((cleanupError) => {
          console.error(
            "[cloudinary] Rollback cleanup failed:",
            cleanupError,
          );
        });

      throw error;
    }
  },

  async deleteProfilePhoto(userId: string) {
    const user = await getUser(userId);
    const publicId = user.profile?.profilePictureId;

    await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              profilePicture: null,
              profilePictureId: null,
            },
            update: {
              profilePicture: null,
              profilePictureId: null,
            },
          },
        },
      },
    });

    // Clear the database first; Cloudinary cleanup is best-effort.
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.error(
          "[cloudinary] Image deletion failed:",
          error,
        );
      }
    }

    return { profilePicture: null };
  },
};
