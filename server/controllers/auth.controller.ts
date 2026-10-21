import type { NextRequest } from "next/server";
import { clearPendingCookie, clearSessionCookie, setPendingCookie, setSessionCookie } from "@/lib/cookies";
import { AppError } from "@/lib/errors";
import { errorResponse, ok, parseBody } from "@/lib/http";
import { signPendingToken, signSessionToken } from "@/lib/jwt";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requirePendingVerification, requireSession } from "@/lib/session";
import { authService, toPublicUser } from "@/server/services/auth.service";
import { loginSchema, signupSchema, verifyEmailSchema } from "@/server/validators/auth.validator";

const MIN = 60 * 1000;

export const authController = {
  async signup(req: NextRequest) {
    rateLimit(`signup:${clientIp(req)}`, 5, 60 * MIN);

    const input = await parseBody(req, signupSchema);
    const user = await authService.signup(input);

    const res = ok({ user: toPublicUser(user), nextStep: "verify-email" }, "Account created. Check your email for the 6-digit code.", 201);
    setPendingCookie(res, await signPendingToken(user.id));
    return res;
  },

  async login(req: NextRequest) {
    rateLimit(`login:ip:${clientIp(req)}`, 20, 15 * MIN);

    const input = await parseBody(req, loginSchema);
    rateLimit(`login:id:${input.identifier}`, 10, 15 * MIN);

    const { user, needsVerification } = await authService.login(input);

    if (needsVerification) {
      const res = errorResponse(403, "EMAIL_NOT_VERIFIED", "Please verify your email to continue.", { data: { nextStep: "verify-email" } });
      setPendingCookie(res, await signPendingToken(user.id));
      return res;
    }

    const res = ok({ user: toPublicUser(user) }, "Logged in successfully.");
    setSessionCookie(res, await signSessionToken(user.id));
    return res;
  },

  async verifyEmail(req: NextRequest) {
    const userId = await requirePendingVerification(req);
    rateLimit(`verify:${userId}`, 15, 15 * MIN);

    const { code } = await parseBody(req, verifyEmailSchema);
    const user = await authService.verifyEmail(userId, code);

    const res = ok({ user: toPublicUser(user) }, "Email verified successfully.");
    setSessionCookie(res, await signSessionToken(user.id));
    clearPendingCookie(res);
    return res;
  },

  async resendCode(req: NextRequest) {
    const userId = await requirePendingVerification(req);
    rateLimit(`resend:${userId}`, 10, 60 * MIN);

    const result = await authService.resendCode(userId);
    return ok(result, "A new code has been sent to your email.");
  },

  async verificationStatus(req: NextRequest) {
    const userId = await requirePendingVerification(req);
    return ok(await authService.verificationStatus(userId));
  },

  async logout() {
    const res = ok(null, "Logged out.");
    clearSessionCookie(res);
    clearPendingCookie(res);
    return res;
  },

  async me(req: NextRequest) {
    const userId = await requireSession(req);
    try {
      const user = await authService.getUser(userId);
      return ok({ user: toPublicUser(user) });
    } catch (err) {
      // Token is valid but the user was deleted: drop the stale cookie
      if (err instanceof AppError && err.status === 401) {
        const res = errorResponse(401, err.code, err.message);
        clearSessionCookie(res);
        return res;
      }
      throw err;
    }
  },
};
