// backend/src/routes/driverTrips.ts
import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireDriver } from "../middleware/auth.js";

export const driverTripsRouter = Router();

/**
 * IMPORTANT:
 * This router is mounted at: app.use("/driver/trips", driverTripsRouter)
 * So DO NOT prefix paths with /driver/trips or /driver/dashboard here.
 */

// -------------------- helpers --------------------

function safeRiderSelect() {
  return { select: { id: true, fullName: true, email: true } };
}

function toRideDTO(trip: any) {
  if (!trip) return null;

  return {
    id: trip.id,
    bookingId: trip.bookingId,
    tripType: trip.tripType === "ROUND_TRIP" ? "Round trip" : "On-way",
    status: trip.status,

    pickupAddress: trip.pickupAddress,
    destinationAddress: trip.dropoffAddress,

    fare: Math.round((trip.fareCents ?? 0) / 100),
    distanceKm: trip.distanceMeters ? Math.round(trip.distanceMeters / 1000) : 0,

    rider: trip.rider ? { id: trip.rider.id, fullName: trip.rider.fullName, email: trip.rider.email } : null,

    scheduledFor: trip.scheduledFor,
    startedAt: trip.startedAt,
    completedAt: trip.completedAt,
    cancelledAt: trip.cancelledAt,
    paymentStatus: trip.paymentStatus,
  };
}

function toRequestDTO(trip: any) {
  const dto = toRideDTO(trip);
  if (!dto) return null;
  return { ...dto };
}

// -------------------- NEW: scope endpoint (fixes your frontend call) --------------------

driverTripsRouter.get("/", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const scope = String(req.query.scope ?? "");

  // requests filters
  const maxDistanceMiles = req.query.maxDistanceMiles ? Number(req.query.maxDistanceMiles) : null;
  const shortTrips = req.query.shortTrips === "1";

  if (scope === "active") {
    const t = await prisma.trip.findFirst({
      where: { driverId, status: { in: ["EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "IN_PROGRESS"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ ok: true, items: t ? [toRideDTO(t)] : [] });
  }

  if (scope === "upcoming") {
    const items = await prisma.trip.findMany({
      where: { driverId, status: { in: ["ACCEPTED", "EN_ROUTE_PICKUP"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { scheduledFor: "asc" },
      take: 50,
    });
    return res.json({ ok: true, items: items.map(toRideDTO) });
  }

  if (scope === "completed") {
    const items = await prisma.trip.findMany({
      where: { driverId, status: { in: ["COMPLETED", "CANCELLED"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return res.json({ ok: true, items: items.map(toRideDTO) });
  }

  if (scope === "requests") {
    const where: any = { status: "REQUESTED" };
    if (shortTrips) where.estDurationSeconds = { lte: 15 * 60 };
    if (maxDistanceMiles != null) where.distanceMeters = { lte: Math.round(maxDistanceMiles * 1609.34) };

    const items = await prisma.trip.findMany({
      where,
      include: { rider: safeRiderSelect() },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({ ok: true, items: items.map(toRequestDTO) });
  }

  // no scope -> help message
  return res.status(400).json({
    error: "BAD_SCOPE",
    details: "Use ?scope=active|upcoming|completed|requests",
  });
});

// -------------------- Convenience endpoints --------------------

// all rides at once
driverTripsRouter.get("/my-rides", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;

  const [activeRide, upcoming, completed] = await Promise.all([
    prisma.trip.findFirst({
      where: { driverId, status: { in: ["EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "IN_PROGRESS"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trip.findMany({
      where: { driverId, status: { in: ["ACCEPTED", "EN_ROUTE_PICKUP"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { scheduledFor: "asc" },
      take: 50,
    }),
    prisma.trip.findMany({
      where: { driverId, status: { in: ["COMPLETED", "CANCELLED"] } },
      include: { rider: safeRiderSelect() },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  return res.json({
    ok: true,
    activeRide: toRideDTO(activeRide),
    upcoming: upcoming.map(toRideDTO),
    completed: completed.map(toRideDTO),
  });
});

// requests list
driverTripsRouter.get("/requests", requireAuth, requireDriver, async (req, res) => {
  const maxDistanceMiles = req.query.maxDistanceMiles ? Number(req.query.maxDistanceMiles) : null;
  const shortTrips = req.query.shortTrips === "1";

  const where: any = { status: "REQUESTED" };
  if (shortTrips) where.estDurationSeconds = { lte: 15 * 60 };
  if (maxDistanceMiles != null) where.distanceMeters = { lte: Math.round(maxDistanceMiles * 1609.34) };

  const requests = await prisma.trip.findMany({
    where,
    include: { rider: safeRiderSelect() },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json({ ok: true, requests: requests.map(toRequestDTO) });
});

// accept request
driverTripsRouter.post("/requests/:tripId/accept", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (trip.status !== "REQUESTED") return res.status(409).json({ error: "NOT_REQUESTED" });

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { driverId, status: "ACCEPTED" },
    include: { rider: safeRiderSelect() },
  });

  await prisma.driverNotification.create({
    data: {
      userId: driverId,
      title: "Ride accepted",
      body: `You accepted booking ${updated.bookingId ?? updated.id}`,
      data: { tripId: updated.id },
    },
  });

  res.json({ ok: true, trip: toRideDTO(updated) });
});

// current trip
driverTripsRouter.get("/current", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;

  const trip = await prisma.trip.findFirst({
    where: { driverId, status: { in: ["ACCEPTED", "EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "IN_PROGRESS"] } },
    include: { rider: safeRiderSelect() },
    orderBy: { updatedAt: "desc" },
  });

  res.json({ ok: true, trip: toRideDTO(trip) });
});

// trip details + rider stats
driverTripsRouter.get("/:tripId", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId },
    include: { rider: safeRiderSelect() },
  });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const [totalTrips, avgRating, reviewsCount] = await Promise.all([
    prisma.trip.count({ where: { riderId: trip.riderId, status: "COMPLETED" } }),
    prisma.tripReview.aggregate({
      where: { revieweeId: trip.riderId },
      _avg: { rating: true },
    }),
    prisma.tripReview.count({ where: { revieweeId: trip.riderId } }),
  ]);

  res.json({
    ok: true,
    trip: toRideDTO(trip),
    rider: trip.rider,
    riderStats: {
      rating: Number(avgRating._avg.rating ?? 0).toFixed(1),
      totalTrips,
      reviews: reviewsCount,
    },
  });
});

// start
driverTripsRouter.post("/:tripId/start", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  if (!["ACCEPTED", "EN_ROUTE_PICKUP", "ARRIVED_PICKUP"].includes(trip.status)) {
    return res.status(409).json({ error: "BAD_STATUS" });
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: "IN_PROGRESS", startedAt: trip.startedAt ?? new Date() },
  });

  res.json({ ok: true, trip: updated });
});

// complete
driverTripsRouter.post("/:tripId/complete", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (trip.status !== "IN_PROGRESS") return res.status(409).json({ error: "NOT_IN_PROGRESS" });

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: "COMPLETED", completedAt: new Date(), paymentStatus: "PAID" },
  });

  res.json({ ok: true, trip: updated });
});

// cancel + feedback
driverTripsRouter.post("/:tripId/cancel", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const { reasons = [], otherReason = "" } = req.body ?? {};

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (["COMPLETED", "CANCELLED"].includes(trip.status)) return res.status(409).json({ error: "ALREADY_DONE" });

  await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.tripCancellation.create({
      data: {
        tripId,
        cancelledBy: driverId,
        reasons: Array.isArray(reasons) ? reasons : [],
        otherReason: typeof otherReason === "string" ? otherReason : "",
      },
    });
  });

  res.json({ ok: true });
});

// rate rider
driverTripsRouter.post("/:tripId/rate-rider", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;
  const { rating, text } = req.body ?? {};

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ error: "BAD_RATING" });

  const review = await prisma.tripReview.create({
    data: {
      tripId,
      reviewerId: driverId,
      revieweeId: trip.riderId,
      rating: Math.round(r),
      text: typeof text === "string" ? text : null,
    },
  });

  res.json({ ok: true, review });
});

// chat
driverTripsRouter.get("/:tripId/chat", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const messages = await prisma.tripMessage.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  res.json({ ok: true, messages });
});

driverTripsRouter.post("/:tripId/chat", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;
  const { text } = req.body ?? {};

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const msgText = String(text ?? "").trim();
  if (!msgText) return res.status(400).json({ error: "EMPTY_MESSAGE" });

  const message = await prisma.tripMessage.create({
    data: { tripId, senderId: driverId, text: msgText },
  });

  res.json({ ok: true, message });
});

// notifications
driverTripsRouter.get("/notifications/list", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;

  const items = await prisma.driverNotification.findMany({
    where: { userId: driverId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ ok: true, items });
});

// sos
driverTripsRouter.post("/:tripId/sos", requireAuth, requireDriver, async (req, res) => {
  const driverId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  await prisma.emergencyAlert.create({
    data: { tripId, driverId, type: "SOS", message: "Driver triggered SOS" },
  });

  res.json({ ok: true });
});
