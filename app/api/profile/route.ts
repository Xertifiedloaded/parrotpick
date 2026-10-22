import { type NextRequest } from "next/server";
import { profileController } from "@/server/controllers/profile.controller";

export async function GET(req: NextRequest) {

  return profileController.get(req);
}

export async function PATCH(req: NextRequest) {

  return profileController.update(req);
}