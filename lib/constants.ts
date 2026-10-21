
export const SESSION_COOKIE = "pp_session";
export const PENDING_COOKIE = "pp_verify";

export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days
export const PENDING_MAX_AGE_S = 60 * 30; // 30 minutes

export const JWT_ISSUER = "9ja-parrot-picks";
export const JWT_AUD_SESSION = "session";
export const JWT_AUD_VERIFY = "email-verification";

export const OTP = {
  LENGTH: 6,
  TTL_MS: 10 * 60 * 1000, 
  RESEND_COOLDOWN_S: 60, 
  MAX_RESENDS: 4, 
  MAX_ATTEMPTS: 5, 
} as const;
