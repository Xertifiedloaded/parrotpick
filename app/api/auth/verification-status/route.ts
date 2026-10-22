

import { handle } from "@/lib/http";
import { authController } from "@/server/controllers/auth.controller";

export const GET = handle(async (request) => {
  return authController.verificationStatus(request);
});
