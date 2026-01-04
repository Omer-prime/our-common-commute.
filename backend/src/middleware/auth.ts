// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../lib/jwt.js";

export type Role = "DRIVER" | "RIDER" | "ADMIN";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
      // optional backward-compat if some old code uses req.user
      user?: { id: string; role: Role };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith("Bearer ")) return res.status(401).json({ error: "UNAUTHORIZED" });

  const token = hdr.slice("Bearer ".length);
  try {
    const payload = verifyAccess(token);
    if (payload.typ !== "access") return res.status(401).json({ error: "UNAUTHORIZED" });

    // payload.sub = userId, payload.role = role
    req.auth = { userId: payload.sub, role: payload.role as Role };
    req.user = { id: payload.sub, role: payload.role as Role }; // optional compatibility
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "UNAUTHORIZED" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}

export const requireDriver = requireRole("DRIVER");
export const requireRider = requireRole("RIDER");
export const requireAdmin = requireRole("ADMIN");
