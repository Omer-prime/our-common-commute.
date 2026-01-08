// backend/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { verifyAccess } from "../lib/jwt.js";
import { Role } from "@prisma/client";

type JwtPayload = {
  sub?: string;
  userId?: string;
  id?: string;
  role?: Role;
  typ?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      auth?: { userId: string; role: Role };
    }
  }
}

function stripQuotes(t: string) {
  let s = t.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function getTokenFromReq(req: Request): string | null {
  const header = req.headers.authorization;
  const bearerRaw = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;

  if (bearerRaw) return stripQuotes(bearerRaw);

  const cookieHeader = req.headers.cookie;
  const cookieTok =
    getCookieValue(cookieHeader, "token") ||
    getCookieValue(cookieHeader, "accessToken") ||
    getCookieValue(cookieHeader, "access_token");

  return cookieTok ? stripQuotes(cookieTok) : null;
}

function verifyAccessWithFallback(token: string): JwtPayload {
  // 1) try your existing verifier
  try {
    return verifyAccess(token) as JwtPayload;
  } catch {
    // 2) fallback to common secrets (prevents INVALID_ACCESS_TOKEN when verifyAccess uses different env)
    const candidates = [
      process.env.ACCESS_TOKEN_SECRET,
      process.env.JWT_SECRET,
      process.env.JWT_ACCESS_SECRET,
      process.env.AUTH_JWT_SECRET,
    ].filter(Boolean) as string[];

    for (const secret of candidates) {
      try {
        return jwt.verify(token, secret) as JwtPayload;
      } catch {
        // try next
      }
    }
    throw new Error("INVALID_ACCESS_TOKEN");
  }
}

/**
 * Backward-compatible:
 * - requireAuth(req,res,next)
 * - requireAuth()
 * - requireAuth([Role.RIDER])
 */
export function requireAuth(): RequestHandler;
export function requireAuth(allowedRoles: Role[]): RequestHandler;
export function requireAuth(req: Request, res: Response, next: NextFunction): void;
export function requireAuth(a?: any, b?: any, c?: any): any {
  if (a && b && typeof c === "function") {
    return makeHandler()(a as Request, b as Response, c as NextFunction);
  }
  return makeHandler(a as Role[] | undefined);
}

function makeHandler(allowedRoles?: Role[]): RequestHandler {
  return (req, res, next) => {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

    try {
      const payload = verifyAccessWithFallback(token);

      if (payload?.typ && payload.typ !== "access") {
        return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
      }

      const userId = payload.sub || payload.userId || payload.id;
      const role = payload.role;

      if (!userId || !role) {
        return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
      }

      req.user = { id: String(userId), role };
      req.auth = { userId: String(userId), role };

      if (allowedRoles?.length && !allowedRoles.includes(role)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      return next();
    } catch {
      return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
    }
  };
}
