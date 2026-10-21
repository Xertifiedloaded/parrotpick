import nodemailer from "nodemailer";
import { OTP } from "@/lib/constants";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendVerificationEmail(to: string, firstname: string, code: string) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured.");
    }
    console.log(`\n[mail:dev] Verification code for ${to}: ${code}\n`);
    return;
  }

  const minutes = OTP.TTL_MS / 60000;

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM ?? "9ja Parrot Picks <no-reply@parrotpicks.com>",
    to,
    subject: "Your 9ja Parrot Picks verification code",
    text: `Hi ${firstname},\n\nYour verification code is ${code}. It expires in ${minutes} minutes.\n\nIf you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#216e28;margin:0 0 12px">Verify your email</h2>
        <p>Hi ${escapeHtml(firstname)}, use this code to complete your registration:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${code}</p>
        <p style="color:#666">It expires in ${minutes} minutes. If you didn't create an account, ignore this email.</p>
      </div>`,
  });
}
