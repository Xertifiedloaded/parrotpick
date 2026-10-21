import { connection, type NextRequest } from "next/server";
import { profileController } from "@/server/controllers/profile.controller";

export async function GET(req: NextRequest) {
  await connection();
  return profileController.get(req);
}

export async function PATCH(req: NextRequest) {
  await connection();
  return profileController.update(req);
}