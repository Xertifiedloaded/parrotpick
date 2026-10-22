import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export const resetTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/, "This reset link is invalid or has expired.");

export const resetPasswordSchema = z.object({
  token: resetTokenSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;