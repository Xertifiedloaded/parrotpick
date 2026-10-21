
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    firstname: z.string().trim().min(1).max(50).optional(),
    surname: z.string().trim().min(1).max(50).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain only letters, numbers, and underscores.",
      )
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.firstname !== undefined ||
      data.surname !== undefined ||
      data.username !== undefined,
    { message: "Provide at least one field to update." },
  );

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;

export const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

export const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
