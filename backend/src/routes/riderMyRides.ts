import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role } from "@prisma/client";

const router = Router();

/**
 * Mounted at: app.use("/api/rider", riderMyRidesRouter)
 * Final: GET /api/rider/my-rides
 */
router.get("/my-rides", requireAuth([Role.RIDER]), async (req, res) => {
  const riderId = req.user!.id; // set by requireAuth
  const now = new Date();

  const [activeTrip, upcoming, history] = await Promise.all([
    prisma.trip.findFirst({
      where: {
        riderId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: { updatedAt: "desc" },
      include: { driver: { select: { id: true, fullName: true } } },
    }),

    prisma.trip.findMany({
      where: {
        riderId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        scheduledFor: { gt: now },
      },
      orderBy: { scheduledFor: "asc" },
      take: 50,
      include: { driver: { select: { id: true, fullName: true } } },
    }),

    prisma.trip.findMany({
      where: {
        riderId,
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { driver: { select: { id: true, fullName: true } } },
    }),
  ]);

  return res.json({ ok: true, activeTrip, upcoming, history });
});

export default router;
