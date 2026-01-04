import crypto from "crypto";
import { config } from "../config.js";

export function generateOtpCode(length = 6): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, "0");
}

export function hashOtp(code: string): string {
  // simple + secure enough when combined with server secret
  return crypto
    .createHash("sha256")
    .update(`${code}:${config.otp.secret}`)
    .digest("hex");
}
