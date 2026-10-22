
import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
import { errorResponse, ok } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { profileService } from "@/server/services/profile.service";
import { updateProfileSchema, MAX_PROFILE_PHOTO_SIZE, ALLOWED_PROFILE_PHOTO_TYPES } from "@/server/validators/profile.validator";

async function handle(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.status, error.code, error.message);
    }

    console.error("[profile] Unhandled error:", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Something went wrong. Please try again.",
    );
  }
}

export const profileController = {
  get(req: NextRequest) {
    return handle(async () => {
      const userId = await requireSession(req);
      const profile = await profileService.getProfile(userId);

      return ok({ user: profile }, "Profile retrieved successfully.");
    });
  },

  update(req: NextRequest) {
    return handle(async () => {
      const userId = await requireSession(req);
      const body: unknown = await req.json();
      const parsed = updateProfileSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          parsed.error.issues[0]?.message ?? "Invalid profile data.",
        );
      }

      const user = await profileService.updateProfile(userId, parsed.data);

      return ok({ user }, "Profile updated successfully.");
    });
  },

  uploadPhoto(req: NextRequest) {
    return handle(async () => {
      const userId = await requireSession(req);
      const formData = await req.formData();
      const file = formData.get("photo");

      if (!(file instanceof File)) {
        return errorResponse(400, "PHOTO_REQUIRED", "Select a profile picture.");
      }

      if (file.size === 0 || file.size > MAX_PROFILE_PHOTO_SIZE) {
        return errorResponse(
          400,
          "INVALID_PHOTO_SIZE",
          "The image must be greater than 0 bytes and no larger than 5 MB.",
        );
      }

      if (
        !ALLOWED_PROFILE_PHOTO_TYPES.includes(
          file.type as (typeof ALLOWED_PROFILE_PHOTO_TYPES)[number],
        )
      ) {
        return errorResponse(
          400,
          "INVALID_IMAGE_TYPE",
          "Only JPEG, PNG, and WebP images are supported.",
        );
      }

      const user = await profileService.uploadProfilePhoto(userId, file);

      return ok({ user }, "Profile picture updated successfully.");
    });
  },

  deletePhoto(req: NextRequest) {
    return handle(async () => {
      const userId = await requireSession(req);
      const result = await profileService.deleteProfilePhoto(userId);

      return ok(result, "Profile picture removed successfully.");
    });
  },
};
