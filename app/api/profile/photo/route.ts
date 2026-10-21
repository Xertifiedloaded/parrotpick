import { type NextRequest } from "next/server";
import { profileController } from "@/server/controllers/profile.controller";

export async function POST(req: NextRequest) {

  return profileController.uploadPhoto(req);
}

export async function DELETE(req: NextRequest) {

  return profileController.deletePhoto(req);
}