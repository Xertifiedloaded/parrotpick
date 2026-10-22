
import { handle } from "@/lib/http";
import { authController } from "@/server/controllers/auth.controller";

export const POST = handle(async (req) => {

  return authController.login(req);
});