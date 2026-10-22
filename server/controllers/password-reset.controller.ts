import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
import { ok, parseBody } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { passwordResetService } from "@/server/services/password-reset.service";
import { forgotPasswordSchema, resetPasswordSchema, resetTokenSchema } from "@/server/validators/password-reset.validator";

const MIN = 60 * 1000;

export const passwordResetController = {
  async forgotPassword(req: NextRequest) {
    rateLimit(`forgot:ip:${clientIp(req)}`, 10, 15 * MIN);

    const { email } = await parseBody(req, forgotPasswordSchema);
    rateLimit(`forgot:email:${email}`, 5, 60 * MIN);

    await passwordResetService.requestReset(email);

    return ok(null, "If an account exists for that email, a password reset link has been sent.");
  },

  async verifyResetToken(req: NextRequest) {
    rateLimit(`reset-verify:ip:${clientIp(req)}`, 30, 15 * MIN);

    const parsed = resetTokenSchema.safeParse(req.nextUrl.searchParams.get("token") ?? "");
    if (!parsed.success) {
      throw new AppError(400, "INVALID_RESET_LINK", "This reset link is invalid or has expired.");
    }

    return ok(await passwordResetService.verifyToken(parsed.data));
  },

  async resetPassword(req: NextRequest) {
    rateLimit(`reset:ip:${clientIp(req)}`, 10, 15 * MIN);

    const { token, password } = await parseBody(req, resetPasswordSchema);
    await passwordResetService.resetPassword(token, password);

    return ok(null, "Password reset successfully. You can now log in.");
  },
};