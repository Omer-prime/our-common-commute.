import nodemailer from "nodemailer";
import { config } from "../config.js";

export async function sendMail(to: string, subject: string, text: string) {
  if (config.mail.mode === "console") {
    console.log("\n=== MAIL (console mode) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log(text);
    console.log("==========================\n");
    return;
  }

  const secure = config.mail.port === 465; // ✅ derived from port (465 = secure, 587 = not secure)

  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure, // ✅ true for 465, false for 587
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },

    // Helps avoid long hangs + clearer failures
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,

    // If using 587, force STARTTLS upgrade
    requireTLS: !secure,

    tls: {
      minVersion: "TLSv1.2",
      // Only if you get cert errors in dev, otherwise keep it true
      // rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: config.mail.from,
    to,
    subject,
    text,
  });
}
