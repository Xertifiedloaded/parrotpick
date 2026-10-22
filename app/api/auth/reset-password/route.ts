import { handle } from "@/lib/http";
import { passwordResetController } from "@/server/controllers/password-reset.controller";

export const GET = handle(async (req) => {
  return passwordResetController.verifyResetToken(req);
});

export const POST = handle(async (req) => {
  return passwordResetController.resetPassword(req);
});