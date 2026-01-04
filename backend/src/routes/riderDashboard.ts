import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRider } from "../middleware/auth.js";

export const riderDashboardRouter = Router();

// Protect all rider dashboard routes
riderDashboardRouter.use(requireAuth, requireRider);

const ACTIVE_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "EN_ROUTE_PICKUP",
  "ARRIVED_PICKUP",
  "IN_PROGRESS",
] as const;

function tripToDto(t: any) {
  return {
    id: t.id,
    bookingId: t.bookingId ?? null,
    tripType: t.tripType,
    status: t.status,
    pickupAddress: t.pickupAddress,
    destinationAddress: t.dropoffAddress,
    fare: (t.fareCents ?? 0) / 100,
    distanceKm: t.distanceMeters ? t.distanceMeters / 1000 : 0,
    scheduledFor: t.scheduledFor ? t.scheduledFor.toISOString() : null,
    startedAt: t.startedAt ? t.startedAt.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    cancelledAt: t.cancelledAt ? t.cancelledAt.toISOString() : null,
    driver: t.driver
      ? { id: t.driver.id, fullName: t.driver.fullName, email: t.driver.email }
      : null,
  };
}

/**
 * GET /rider/dashboard/home
 * -> used by RiderHome to show: greeting + active trip + upcoming + history
 */
riderDashboardRouter.get("/home", async (req, res) => {
  const userId = req.auth!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, role: true },
  });

  const active = await prisma.trip.findFirst({
    where: { riderId: userId, status: { in: [...ACTIVE_STATUSES] as any } },
    orderBy: { updatedAt: "desc" },
    include: {
      driver: { select: { id: true, fullName: true, email: true } },
    },
  });

  const upcoming = await prisma.trip.findMany({
    where: {
      riderId: userId,
      status: { in: ["REQUESTED", "ACCEPTED", "EN_ROUTE_PICKUP", "ARRIVED_PICKUP"] as any },
      id: active?.id ? { not: active.id } : undefined,
    },
    orderBy: [
      { scheduledFor: "asc" },
      { createdAt: "desc" },
    ],
    take: 8,
    include: {
      driver: { select: { id: true, fullName: true, email: true } },
    },
  });

  const history = await prisma.trip.findMany({
    where: { riderId: userId, status: { in: ["COMPLETED", "CANCELLED"] as any } },
    orderBy: [{ completedAt: "desc" }, { cancelledAt: "desc" }, { createdAt: "desc" }],
    take: 8,
    include: {
      driver: { select: { id: true, fullName: true, email: true } },
    },
  });

  return res.json({
    ok: true,
    user,
    activeTrip: active ? tripToDto(active) : null,
    upcoming: upcoming.map(tripToDto),
    history: history.map(tripToDto),
  });
});
