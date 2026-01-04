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

  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: false,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass
    }
  });

  await transporter.sendMail({
    from: config.mail.from,
    to,
    subject,
    text
  });
}
