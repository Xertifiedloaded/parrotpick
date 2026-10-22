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
  return `${base}_${randomInt(100000, 1000000)}`;
}

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferralCode(length = 8) {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += REFERRAL_ALPHABET[bytes[i] % REFERRAL_ALPHABET.length];
  }
  return code;
}

async function generateUniqueReferralCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    if (!(await userRepository.findByReferralCode(code))) return code;
  }
  return generateReferralCode(10); 
}


async function resolveReferrerId(code?: string) {
  if (!code) return null;

  const referrer = await userRepository.findByReferralCode(code);
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

  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);

    if (existing?.emailVerifiedAt) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.", {
        fields: { email: "An account with this email already exists." },
      });
    }

    const referrerId = await resolveReferrerId(input.referralCode);

    const passwordHash = await hashPassword(input.password);

    const referralData = referrerId
      ? {
        referredById: referrerId,
        referralReceived: { create: { referrerId } }, 
      }
      : {};

    let created: User;

    if (existing) {
      created = await userRepository.update(existing.id, {
        surname: input.surname,
        firstname: input.firstname,
        passwordHash,
        profile: { upsert: { create: {}, update: {} } },
        ...(existing.referredById ? {} : referralData),
      });
    } else {

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

    return (await userRepository.findByIdWithProfile(created.id)) ?? created;
  }


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
          if (!(err instanceof AppError && err.status === 429)) throw err;
        }
      }
      return { user, needsVerification: true as const };
    }

    const full = (await userRepository.findByIdWithProfile(user.id)) ?? user;
    return { user: full as UserWithProfile, needsVerification: false as const };
  }

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
