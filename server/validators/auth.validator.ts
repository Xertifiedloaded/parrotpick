import { z } from "zod";

export const signupSchema = z.object({
  surname: z.string().trim().min(1, "Surname is required.").max(50, "Surname is too long."),
  firstname: z.string().trim().min(1, "Firstname is required.").max(50, "Firstname is too long."),
  email: z.string().trim().toLowerCase().max(254, "Email is too long.").email("Enter a valid email address."),
  // bcrypt only uses the first 72 bytes, so cap it
  password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password must be 72 characters or fewer."),
  // Optional. Blank or missing becomes undefined; otherwise it must match the
  // generator's alphabet (no I, O, 0, 1) and length (8, or 10 for the fallback code).
  referralCode: z.preprocess(
    (v) => {
      if (typeof v !== "string") return undefined;
      const code = v.trim().toUpperCase();
      return code === "" ? undefined : code;
    },
    z
      .string()
      .regex(/^[A-HJ-NP-Z2-9]{8}$|^[A-HJ-NP-Z2-9]{10}$/, "Invalid referral code.")
      .optional(),
  ),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or username.")
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
