// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { requireAuth as requireAuthBase } from "./requireAuth.js";

export const requireAuth = requireAuthBase;

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role || req.user?.role;
    if (!role) return res.status(401).json({ error: "UNAUTHORIZED" });
    if (!roles.includes(role)) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}

export const requireDriver = requireRole(Role.DRIVER);
export const requireRider = requireRole(Role.RIDER);
export const requireAdmin = requireRole(Role.ADMIN);
