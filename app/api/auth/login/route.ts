import { handle } from "@/lib/http";
import { authController } from "@/server/controllers/auth.controller";

export const runtime = "nodejs";

export const POST = handle(authController.login);
