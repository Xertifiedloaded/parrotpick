import { randomBytes, randomInt } from "crypto";
import type { User } from "@prisma/client";
import { OTP } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { sendVerificationEmail } from "@/lib/mailer";
import { codesMatch, generateCode, hashCode } from "@/lib/otp";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/server/repositories/user.repository";
import { verificationRepository } from "@/server/repositories/verification.repository";
import type { LoginInput, SignupInput } from "@/server/validators/auth.validator";

type UserWithProfile = User & {
  profile?: { profilePicture: string | null; balance?: bigint } | null;
};

export function toPublicUser(user: UserWithProfile) {
  return {
    id: user.id,
    surname: user.surname,
    firstname: user.firstname,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    profilePicture: user.profile?.profilePicture ?? null,
    referralCode: user.referralCode,
    // BigInt can't go through JSON.stringify, so send it as a string (minor units, e.g. kobo)
    balance: (user.profile?.balance ?? BigInt(0)).toString(),
  };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function generateUsername(surname: string) {
  const base =
    surname
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) || "player";

  for (let i = 0; i < 10; i++) {
    const candidate = `${base}_${randomInt(1000, 10000)}`;
    if (!(await userRepository.findByUsername(candidate))) return candidate;
  }
  // The unique index still protects against a race; the handler maps P2002 to 409.
  return `${base}_${randomInt(100000, 1000000)}`;
}

// 32 unambiguous characters (no I, O, 0, 1). 256 % 32 === 0, so no modulo bias.
const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 8 chars ≈ 1.1e12 combinations; the unique index on User.referralCode is the safety net. */
function generateReferralCode(length = 8) {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += REFERRAL_ALPHABET[bytes[i] % REFERRAL_ALPHABET.length];
  }
  return code;
}

/** Checks for a free code before creating, so a collision never surfaces as a false 409. */
async function generateUniqueReferralCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    if (!(await userRepository.findByReferralCode(code))) return code;
  }
  return generateReferralCode(10); // longer fallback
}

/** Returns the referrer's id, or null when no code was given. Throws if the code is invalid. */
async function resolveReferrerId(code?: string) {
  if (!code) return null;

  const referrer = await userRepository.findByReferralCode(code);
  // Only verified accounts can refer, so throwaway unverified accounts can't farm referrals
  if (!referrer || !referrer.emailVerifiedAt) {
    throw new AppError(400, "INVALID_REFERRAL_CODE", "That referral code is not valid.", {
      fields: { referralCode: "That referral code is not valid." },
    });
  }
  return referrer.id;
}

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

class AuthService {
  /**
   * Creates the account (unverified) with its wallet profile and emails a code.
   * New users get a unique referral code and a wallet that starts at zero.
   * An optional referral code links the new user to their referrer (PENDING).
   * If an unverified account with this email already exists, its details are
   * refreshed and a new code is sent (subject to the resend cooldown and limit).
   */
  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);

    if (existing?.emailVerifiedAt) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.", {
        fields: { email: "An account with this email already exists." },
      });
    }

    // Validate the code before any expensive work (hashing, creating rows)
    const referrerId = await resolveReferrerId(input.referralCode);

    const passwordHash = await hashPassword(input.password);

    // A user can only be referred once (Referral.referredId is unique), so an
    // existing account that already has a referrer keeps it and a new code is ignored.
    const referralData = referrerId
      ? {
        referredById: referrerId,
        referralReceived: { create: { referrerId } }, // status defaults to PENDING
      }
      : {};

    let created: User;

    if (existing) {
      created = await userRepository.update(existing.id, {
        surname: input.surname,
        firstname: input.firstname,
        passwordHash,
        // Covers accounts created before the profile logic existed
        profile: { upsert: { create: {}, update: {} } },
        ...(existing.referredById ? {} : referralData),
      });
    } else {
      // Retry on a unique-index race (referral code or username); email races
      // fall through after the last attempt and are mapped to 409 by the handler.
      let attempt = 0;
      while (true) {
        try {
          created = await userRepository.create({
            surname: input.surname,
            firstname: input.firstname,
            email: input.email,
            username: await generateUsername(input.surname),
            passwordHash,
            referralCode: await generateUniqueReferralCode(),
            ...referralData,
            // Wallet / stats row, explicit zeros (amounts are in minor units, e.g. kobo)
            profile: {
              create: {
                balance: BigInt(0),
                bonusBalance: BigInt(0),
                referralCount: 0,
                referralEarnings: BigInt(0),
              },
            },
          });
          break;
        } catch (err) {
          if (!isUniqueViolation(err) || ++attempt >= 3) throw err;
        }
      }
    }

    await this.sendCode(created);

    // Reload with the profile so the response includes referralCode and balance
    return (await userRepository.findByIdWithProfile(created.id)) ?? created;
  }

  /**
   * Validates credentials. When the email is not verified yet, makes sure there
   * is an active code and reports needsVerification so the caller can redirect.
   */
  async login(input: LoginInput) {
    const identifier = input.identifier.trim().toLowerCase();

    const user = identifier.includes("@") ? await userRepository.findByEmail(identifier) : await userRepository.findByUsername(identifier);

    if (!user || !user.passwordHash) {
      await burnPasswordCheck(input.password);
      throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email/username or password.");
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email/username or password.");
    }

    if (!user.emailVerifiedAt) {
      const record = await verificationRepository.findByUserId(user.id);
      if (!record || record.expiresAt <= new Date()) {
        try {
          await this.sendCode(user);
        } catch (err) {
          // A cooldown / resend-limit must not block the redirect to the verify page:
          // that page shows the countdown and remaining attempts itself.
          if (!(err instanceof AppError && err.status === 429)) throw err;
        }
      }
      return { user, needsVerification: true as const };
    }

    // Load the profile so the response includes the avatar immediately
    const full = (await userRepository.findByIdWithProfile(user.id)) ?? user;
    return { user: full as UserWithProfile, needsVerification: false as const };
  }

  /**
   * Issues a new code. Enforces the 60s cooldown and the max number of resends.
   * A request while an active code exists counts as a resend; once the old code
   * has expired a fresh cycle starts.
   */
  async sendCode(user: User) {
    const now = new Date();
    const existing = await verificationRepository.findByUserId(user.id);
    const active = existing && existing.expiresAt > now ? existing : null;

    if (existing) {
      const elapsed = (now.getTime() - existing.lastSentAt.getTime()) / 1000;
      if (elapsed < OTP.RESEND_COOLDOWN_S) {
        const wait = Math.ceil(OTP.RESEND_COOLDOWN_S - elapsed);
        throw new AppError(429, "RESEND_COOLDOWN", `Please wait ${wait}s before requesting another code.`, { retryAfter: wait });
      }
    }

    let resendCount = 0;
    if (active) {
      if (active.resendCount >= OTP.MAX_RESENDS) {
        throw new AppError(429, "RESEND_LIMIT_REACHED", "You have used all your code requests. Contact customer support.");
      }
      resendCount = active.resendCount + 1;
    }

    const code = generateCode();

    await verificationRepository.upsert(user.id, {
      codeHash: hashCode(user.id, code),
      expiresAt: new Date(now.getTime() + OTP.TTL_MS),
      resendCount,
      lastSentAt: now,
    });

    try {
      await sendVerificationEmail(user.email, user.firstname, code);
    } catch (err) {
      console.error("[mail] Failed to send verification email:", err);
      throw new AppError(502, "EMAIL_SEND_FAILED", "We couldn't send the code. Please try again.");
    }

    return {
      resendsLeft: OTP.MAX_RESENDS - resendCount,
      secondsUntilResend: OTP.RESEND_COOLDOWN_S,
    };
  }

  async resendCode(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found.");
    if (user.emailVerifiedAt) {
      throw new AppError(409, "ALREADY_VERIFIED", "This email is already verified.");
    }
    return this.sendCode(user);
  }

  /** Powers the countdown and "times left" text on the verify page. */
  async verificationStatus(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found.");

    if (user.emailVerifiedAt) {
      return { verified: true as const, email: maskEmail(user.email) };
    }

    const record = await verificationRepository.findByUserId(userId);
    const now = Date.now();
    const active = record && record.expiresAt.getTime() > now ? record : null;

    const secondsUntilResend = record ? Math.max(0, Math.ceil(OTP.RESEND_COOLDOWN_S - (now - record.lastSentAt.getTime()) / 1000)) : 0;

    return {
      verified: false as const,
      email: maskEmail(user.email),
      secondsUntilResend,
      resendsLeft: active ? Math.max(0, OTP.MAX_RESENDS - active.resendCount) : OTP.MAX_RESENDS,
      codeExpired: !active,
    };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await userRepository.findByIdWithProfile(userId);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "Account not found.");
    if (user.emailVerifiedAt) return user;

    const record = await verificationRepository.findByUserId(userId);
    if (!record) {
      throw new AppError(400, "CODE_NOT_FOUND", "No active code. Request a new one.");
    }
    if (record.expiresAt <= new Date()) {
      throw new AppError(400, "CODE_EXPIRED", "This code has expired. Request a new one.");
    }

    // Count the attempt first (atomic), then compare.
    const updated = await verificationRepository.incrementAttempts(userId);
    if (updated.attempts > OTP.MAX_ATTEMPTS) {
      throw new AppError(429, "TOO_MANY_ATTEMPTS", "Too many incorrect attempts. Request a new code.");
    }

    if (!codesMatch(hashCode(userId, code), record.codeHash)) {
      const left = OTP.MAX_ATTEMPTS - updated.attempts;
      throw new AppError(
        400,
        "INVALID_CODE",
        left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Incorrect code. Request a new one.",
      );
    }

    await verificationRepository.complete(userId);
    return (await userRepository.findByIdWithProfile(userId))!;
  }

  async getUser(userId: string) {
    const user = await userRepository.findByIdWithProfile(userId);
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");
    return user;
  }
}

export const authService = new AuthService();
