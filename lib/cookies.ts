import type { NextResponse } from "next/server";
import {PENDING_COOKIE, PENDING_MAX_AGE_S,SESSION_COOKIE,SESSION_MAX_AGE_S} from "@/lib/constants";

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, { ...base, maxAge: SESSION_MAX_AGE_S });
}
export function setPendingCookie(res: NextResponse, token: string) {
  res.cookies.set(PENDING_COOKIE, token, { ...base, maxAge: PENDING_MAX_AGE_S });
}
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...base, maxAge: 0 });
}
export function clearPendingCookie(res: NextResponse) {
  res.cookies.set(PENDING_COOKIE, "", { ...base, maxAge: 0 });
}
