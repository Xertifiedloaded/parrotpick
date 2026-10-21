import { connection, type NextRequest } from "next/server";
import { profileController } from "@/server/controllers/profile.controller";

export async function POST(req: NextRequest) {
  await connection();
  return profileController.uploadPhoto(req);
}

export async function DELETE(req: NextRequest) {
  await connection();
  return profileController.deletePhoto(req);
}