import nodemailer from "nodemailer";
import { config } from "../config.js";

export async function sendMail(to: string, subject: string, text: string) {
  if (config.mail.mode === "console") {
    console.log("\n=== MAIL (console mode) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log(text);
    console.log("==========================\n");
    return { ok: true, mode: "console" as const };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.pass },
      requireTLS: config.mail.port === 587,
      tls: { minVersion: "TLSv1.2" },
    });

    await transporter.sendMail({ from: config.mail.from, to, subject, text });
    return { ok: true, mode: "smtp" as const };
  } catch (err) {
    console.error("❌ SMTP send failed:", err);
    return { ok: false, mode: "smtp" as const };
  }
}
