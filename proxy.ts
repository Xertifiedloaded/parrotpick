import { NextRequest, NextResponse } from "next/server";
import { PENDING_COOKIE, SESSION_COOKIE } from "@/lib/constants";
import { verifyPendingToken, verifySessionToken } from "@/lib/jwt";

// Pages that need a logged-in user
const PROTECTED_PAGES = ["/predictions", "/dashboard", "/profile"];
// Pages a logged-in user has no reason to see
const AUTH_PAGES = ["/login", "/signup"];

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = sessionToken ? await verifySessionToken(sessionToken) : null;
  const headers = new Headers(req.headers);
  headers.delete("x-user-id");
  if (userId) headers.set("x-user-id", userId);
  if (pathname.startsWith("/api/")) {
    // /api/auth/* is public here; its handlers enforce their own rules
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next({ request: { headers } });
    }

    if (!userId) {
      return NextResponse.json({ success: false, code: "UNAUTHORIZED", message: "Please log in to continue." }, { status: 401 });
    }
    return NextResponse.next({ request: { headers } });
  }

  // ---- Pages ----
  if (userId && AUTH_PAGES.some((p) => matches(pathname, p))) {
    return NextResponse.redirect(new URL("/predictions", req.url));
  }

  if (matches(pathname, "/verify-email")) {
    if (userId) return NextResponse.redirect(new URL("/predictions", req.url));

    const pendingToken = req.cookies.get(PENDING_COOKIE)?.value;
    const pendingUserId = pendingToken ? await verifyPendingToken(pendingToken) : null;
    if (!pendingUserId) return NextResponse.redirect(new URL("/signup", req.url));
  }

  if (!userId && PROTECTED_PAGES.some((p) => matches(pathname, p))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
