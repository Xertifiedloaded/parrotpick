import { connection } from "next/server";
import { handle } from "@/lib/http";
import { authController } from "@/server/controllers/auth.controller";

export const POST = handle(async (req) => {
  await connection();
  return authController.login(req);
});