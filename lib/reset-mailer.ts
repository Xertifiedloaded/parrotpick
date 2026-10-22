import { PASSWORD_RESET } from "@/lib/reset-constants";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export async function sendPasswordResetEmail(to: string, firstname: string, resetLink: string) {
  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_RESET_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: to,
        to_name: firstname,
        reset_link: resetLink,
        expires_in: `${PASSWORD_RESET.TTL_MINUTES} minutes`,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`EmailJS responded with ${res.status}: ${await res.text()}`);
  }
}