import { createHash, randomBytes } from "crypto";
import { AppError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/reset-mailer";
import { PASSWORD_RESET } from "@/lib/reset-constants";
import { passwordResetRepository } from "@/server/repositories/password-reset.repository";
import { userRepository } from "@/server/repositories/user.repository";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetLink(token: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/auth/reset-password?token=${token}`;
}

function invalidLink() {
  return new AppError(400, "INVALID_RESET_LINK", "This reset link is invalid or has expired.");
}

class PasswordResetService {
  async requestReset(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash) return;

    const now = new Date();
    const existing = await passwordResetRepository.findByUserId(user.id);
    if (existing) {
      const elapsed = (now.getTime() - existing.lastSentAt.getTime()) / 1000;
      if (elapsed < PASSWORD_RESET.RESEND_COOLDOWN_S) return;
    }

    const token = randomBytes(32).toString("hex");

    await passwordResetRepository.upsert(user.id, {
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + PASSWORD_RESET.TTL_MS),
      lastSentAt: now,
    });

    try {
      await sendPasswordResetEmail(user.email, user.firstname, buildResetLink(token));
    } catch (err) {
      console.error("[mail] Failed to send password reset email:", err);
    }
  }

  async verifyToken(token: string) {
    const record = await passwordResetRepository.findByTokenHash(hashToken(token));
    if (!record || record.expiresAt <= new Date()) throw invalidLink();
    return { valid: true as const };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashToken(token);

    const record = await passwordResetRepository.findByTokenHash(tokenHash);
    if (!record || record.expiresAt <= new Date()) throw invalidLink();

    const consumed = await passwordResetRepository.consume(tokenHash);
    if (consumed.count === 0) throw invalidLink();

    const user = await userRepository.findById(record.userId);
    if (!user) throw invalidLink();

    const passwordHash = await hashPassword(password);

    await userRepository.update(user.id, {
      passwordHash,
      ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
    });

    await passwordResetRepository.deleteByUserId(user.id);
  }
}

export const passwordResetService = new PasswordResetService();