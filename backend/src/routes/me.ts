import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true }
  });

  res.json({ user });
});
