import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { config } from "../config.js";

let cachedTransporter: Transporter | null = null;

function buildFrom() {
  const fromEmail = config.mail.from;
  const fromName = (config.mail as any).fromName || process.env.SMTP_FROM_NAME || process.env.MAIL_FROM_NAME;

  if (!fromName) return fromEmail;
  // "Name" <email@domain.com>
  return `"${String(fromName).replace(/"/g, "")}" <${fromEmail}>`;
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // If smtp mode is enabled but required fields missing, don't crash the request
  if (!config.mail.host || !config.mail.port || !config.mail.user || !config.mail.pass) {
    throw new Error("SMTP_CONFIG_INCOMPLETE");
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.mail.host,
    port: Number(config.mail.port),
    secure: Boolean(config.mail.secure), // true for 465, false for 587
    auth: { user: config.mail.user, pass: config.mail.pass },
    requireTLS: Number(config.mail.port) === 587,
    tls: { minVersion: "TLSv1.2" },
  });

  return cachedTransporter;
}

export async function sendMail(to: string, subject: string, text: string) {
  // Console mode
  if (config.mail.mode === "console") {
    console.log("\n=== MAIL (console mode) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log(text);
    console.log("==========================\n");
    return { ok: true, mode: "console" as const };
  }

  // SMTP mode
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${config.mail.fromName}" <${config.mail.from}>`,
      to,
      subject,
      text,
    });
    return { ok: true, mode: "smtp" as const };
  } catch (err: any) {
    // Never crash signup because email failed
    console.error("❌ SMTP send failed:", err?.message || err);
    return { ok: false, mode: "smtp" as const, error: err?.message || "SMTP_FAILED" };
  }
}
