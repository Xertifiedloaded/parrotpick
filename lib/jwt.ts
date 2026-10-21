// Edge-safe (jose only). Used by both route handlers and middleware.ts.
import { SignJWT, jwtVerify } from "jose";
import { JWT_AUD_SESSION, JWT_AUD_VERIFY, JWT_ISSUER, PENDING_MAX_AGE_S, SESSION_MAX_AGE_S } from "@/lib/constants";

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

function sign(userId: string, audience: string, ttlSeconds: number) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key());
}

async function verify(token: string, audience: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: JWT_ISSUER,
      audience,
      algorithms: ["HS256"],
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// Separate audiences so a verification token can never be used as a session.
export const signSessionToken = (userId: string) => sign(userId, JWT_AUD_SESSION, SESSION_MAX_AGE_S);
export const signPendingToken = (userId: string) => sign(userId, JWT_AUD_VERIFY, PENDING_MAX_AGE_S);

export const verifySessionToken = (token: string) => verify(token, JWT_AUD_SESSION);
export const verifyPendingToken = (token: string) => verify(token, JWT_AUD_VERIFY);
