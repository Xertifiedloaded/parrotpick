import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { OTP } from "@/lib/constants";

function secret() {
  const s = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("OTP_SECRET or JWT_SECRET (32+ chars) is required.");
  return s;
}

export function generateCode() {
  return String(randomInt(0, 10 ** OTP.LENGTH)).padStart(OTP.LENGTH, "0");
}

export function hashCode(userId: string, code: string) {
  return createHmac("sha256", secret()).update(`${userId}:${code}`).digest("hex");
}

export function codesMatch(a: string, b: string) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
