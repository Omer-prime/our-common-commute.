import crypto from "crypto";

const PBKDF2_ITERS = 210_000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERS, 32, "sha256")
    .toString("hex");
  return `pbkdf2$${PBKDF2_ITERS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iters = Number(parts[1]);
  const salt = parts[2];
  const hash = parts[3];

  const check = crypto
    .pbkdf2Sync(password, salt, iters, 32, "sha256")
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}
