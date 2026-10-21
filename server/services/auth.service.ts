import { randomInt } from "crypto";
import type { User } from "@prisma/client";
import { OTP } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { sendVerificationEmail } from "@/lib/mailer";
import { codesMatch, generateCode, hashCode } from "@/lib/otp";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/server/repositories/user.repository";
import { verificationRepository } from "@/server/repositories/verification.repository";
import type { LoginInput, SignupInput } from "@/server/validators/auth.validator";

export function toPublicUser(user: User) {
  return {
    id: user.id,
    surname: user.surname,
    firstname: user.firstname,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function generateUsername(surname: string) {
  const base = surname.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "player";

  for (let i = 0; i < 10; i++) {
    const candidate = `${base}_${randomInt(1000, 10000)}`;
    if (!(await userRepository.findByUsername(candidate))) return candidate;
  }
  // The unique index still protects against a race; the handler maps P2002 to 409.
  return `${base}_${randomInt(100000, 1000000)}`;
}

class AuthService {
  /**
   * Creates the account (unverified) and emails a code.
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

    const passwordHash = await hashPassword(input.password);

    const user = existing
      ? await userRepository.update(existing.id, {
          surname: input.surname,
          firstname: input.firstname,
          passwordHash,
        })
      : await userRepository.create({
          surname: input.surname,
          firstname: input.firstname,
          email: input.email,
          username: await generateUsername(input.surname),
          passwordHash,
        });

    await this.sendCode(user);
    return user;
  }

  /**
   * Validates credentials. When the email is not verified yet, makes sure there
   * is an active code and reports needsVerification so the caller can redirect.
   */
  async login(input: LoginInput) {
    const user = input.identifier.includes("@")
      ? await userRepository.findByEmail(input.identifier)
      : await userRepository.findByUsername(input.identifier);

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
        await this.sendCode(user);
      }
      return { user, needsVerification: true as const };
    }

    return { user, needsVerification: false as const };
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
        throw new AppError(
          429,
          "RESEND_COOLDOWN",
          `Please wait ${wait}s before requesting another code.`,
          { retryAfter: wait }
        );
      }
    }

    let resendCount = 0;
    if (active) {
      if (active.resendCount >= OTP.MAX_RESENDS) {
        throw new AppError(
          429,
          "RESEND_LIMIT_REACHED",
          "You have used all your code requests. Contact customer support."
        );
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

    const secondsUntilResend = record
      ? Math.max(0, Math.ceil(OTP.RESEND_COOLDOWN_S - (now - record.lastSentAt.getTime()) / 1000))
      : 0;

    return {
      verified: false as const,
      email: maskEmail(user.email),
      secondsUntilResend,
      resendsLeft: active ? Math.max(0, OTP.MAX_RESENDS - active.resendCount) : OTP.MAX_RESENDS,
      codeExpired: !active,
    };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await userRepository.findById(userId);
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
      throw new AppError(
        429,
        "TOO_MANY_ATTEMPTS",
        "Too many incorrect attempts. Request a new code."
      );
    }

    if (!codesMatch(hashCode(userId, code), record.codeHash)) {
      const left = OTP.MAX_ATTEMPTS - updated.attempts;
      throw new AppError(
        400,
        "INVALID_CODE",
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Incorrect code. Request a new one."
      );
    }

    await verificationRepository.complete(userId);
    return (await userRepository.findById(userId))!;
  }

  async getUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");
    return user;
  }
}

export const authService = new AuthService();
