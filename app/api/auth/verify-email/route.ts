

import { handle } from "@/lib/http";
import { authController } from "@/server/controllers/auth.controller";

export const POST = handle(async (request) => {
  return authController.verifyEmail(request);
});
