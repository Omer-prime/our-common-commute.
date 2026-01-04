import crypto from "crypto";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 16) {
  // URL-safe token
  return crypto.randomBytes(bytes).toString("base64url");
}

export function makeBookingId() {
  // Example: #36451923 (8 digits)
  const n = crypto.randomInt(0, 100_000_000);
  return `#${String(n).padStart(8, "0")}`;
}
