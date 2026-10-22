import type { NextRequest } from "next/server";
import { PENDING_COOKIE, SESSION_COOKIE } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { verifyPendingToken, verifySessionToken } from "@/lib/jwt";

export async function getSessionUserId(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function getPendingUserId(req: NextRequest) {
  const token = req.cookies.get(PENDING_COOKIE)?.value;
  return token ? verifyPendingToken(token) : null;
}

export async function requireSession(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");
  return userId;
}

export async function requirePendingVerification(req: NextRequest) {
  const userId = await getPendingUserId(req);
  if (!userId) {
    throw new AppError(401, "VERIFICATION_SESSION_MISSING", "Your verification session has expired. Please sign up or log in again.");
  }
  return userId;
}
