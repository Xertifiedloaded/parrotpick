import { handle } from "@/lib/http";
import { passwordResetController } from "@/server/controllers/password-reset.controller";

export const POST = handle(async (req) => {
  return passwordResetController.forgotPassword(req);
});