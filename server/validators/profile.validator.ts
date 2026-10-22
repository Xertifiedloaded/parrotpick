import { z } from "zod";

export const MIN_AGE = 18;
const MAX_AGE = 120;

const nullableText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters.`)
    .transform((value) => (value === "" ? null : value))
    .optional();

const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;

    const compact = value.replace(/[\s\-()]/g, "");
    if (!/^\+?[0-9]{7,15}$/.test(compact)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid phone number, e.g. +2348012345678.",
      });
      return z.NEVER;
    }

    return compact;
  })
  .optional();

const dateOfBirthSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;

    const invalid = (message: string) => {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return invalid("Enter a valid date of birth.");
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      return invalid("Enter a valid date of birth.");
    }

    const today = new Date();
    if (date > today) return invalid("Date of birth cannot be in the future.");

    let age = today.getUTCFullYear() - date.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - date.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < date.getUTCDate())) {
      age -= 1;
    }

    if (age < MIN_AGE) return invalid(`You must be at least ${MIN_AGE} years old.`);
    if (age > MAX_AGE) return invalid("Enter a valid date of birth.");

    return date;
  })
  .optional();

export const updateProfileSchema = z
  .object({
    firstname: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(50, "First name cannot exceed 50 characters.")
      .optional(),
    surname: z
      .string()
      .trim()
      .min(1, "Surname is required.")
      .max(50, "Surname cannot exceed 50 characters.")
      .optional(),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username cannot exceed 30 characters.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain only letters, numbers, and underscores.",
      )
      .transform((value) => value.toLowerCase())
      .optional(),

    bio: nullableText("Bio", 300),
    phone: phoneSchema,
    country: z
      .string()
      .trim()
      .regex(/^[a-zA-Z]{2}$/, "Select a valid country.")
      .transform((value) => value.toUpperCase())
      .optional(),
    state: nullableText("State", 60),
    city: nullableText("City", 60),
    address: nullableText("Address", 200),
    dateOfBirth: dateOfBirthSchema,
    notificationsEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_PROFILE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;