// backend/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyAccess } from "../lib/jwt.js";
import { Role } from "@prisma/client";

type JwtPayload = {
  sub: string;
  role: Role;
  typ?: string;
};

declare global {
  namespace Express {
    interface Request {
      // ✅ support both styles used in your codebase
      user?: { id: string; role: Role };
      auth?: { userId: string; role: Role };
    }
  }
}

/**
 * ✅ Backward-compatible:
 * - requireAuth(req,res,next)   (old usage)
 * - requireAuth()              (new usage)
 * - requireAuth([Role.DRIVER]) (role restricted)
 */
export function requireAuth(): RequestHandler;
export function requireAuth(allowedRoles: Role[]): RequestHandler;
export function requireAuth(req: Request, res: Response, next: NextFunction): void;
export function requireAuth(a?: any, b?: any, c?: any): any {
  // If called like requireAuth(req,res,next) -> run default auth middleware
  if (a && b && typeof c === "function") {
    return makeHandler()(a as Request, b as Response, c as NextFunction);
  }

  // If called like requireAuth([Role.DRIVER]) or requireAuth()
  return makeHandler(a as Role[] | undefined);
}

function makeHandler(allowedRoles?: Role[]): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

    try {
      const payload = verifyAccess(token) as JwtPayload;

      if (payload?.typ && payload.typ !== "access") {
        return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
      }

      // ✅ set both, so all your routes work
      req.user = { id: payload.sub, role: payload.role };
      req.auth = { userId: payload.sub, role: payload.role };

      if (allowedRoles?.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      return next();
    } catch {
      return res.status(401).json({ error: "INVALID_ACCESS_TOKEN" });
    }
  };
}
