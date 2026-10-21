import emailjs from "@emailjs/nodejs";
import { OTP } from "@/lib/constants";

export async function sendVerificationEmail(to: string, firstname: string, code: string) {
  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;

  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EmailJS is not configured.");
    }
    console.log(`\n[mail:dev] Verification code for ${to}: ${code}\n`);
    return;
  }

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: to,
      to_name: firstname,
      code,
      minutes: String(OTP.TTL_MS / 60000),
    },
    {
      publicKey: EMAILJS_PUBLIC_KEY,
      privateKey: EMAILJS_PRIVATE_KEY,
    },
  );
}
