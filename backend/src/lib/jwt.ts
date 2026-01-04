import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type AccessPayload = {
  sub: string;
  role: "DRIVER" | "RIDER" | "ADMIN";
  typ: "access";
};

export type RefreshPayload = {
  sub: string;
  typ: "refresh";
  jti: string;
};

export type ResetPayload = {
  sub: string;
  typ: "reset";
  otpId: string;
};

export function signAccessToken(userId: string, role: AccessPayload["role"]) {
  const payload: AccessPayload = { sub: userId, role, typ: "access" };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: `${config.jwt.accessTtlMin}m`
  });
}

export function signRefreshToken(userId: string, jti: string) {
  const payload: RefreshPayload = { sub: userId, typ: "refresh", jti };
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshTtlDays}d`
  });
}

export function signResetToken(userId: string, otpId: string) {
  const payload: ResetPayload = { sub: userId, typ: "reset", otpId };
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: "10m" });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, config.jwt.accessSecret) as AccessPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshPayload;
}

export function verifyReset(token: string) {
  return jwt.verify(token, config.jwt.accessSecret) as ResetPayload;
}
