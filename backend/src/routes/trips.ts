import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Role, TripStatus, PaymentStatus } from "@prisma/client";
import { estimateTripCost } from "../services/estimate.js";
import { makeBookingId, randomToken, sha256 } from "../utils/crypto.js";

export const tripsRouter = Router();

/* ----------------------------- helpers ----------------------------- */

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

async function assertTripAccess(tripId: string, userId: string, role: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, riderId: true, driverId: true },
  });

  if (!trip) return { ok: false as const, error: "NOT_FOUND" as const };

  // admin can access everything
  if (role === "ADMIN") return { ok: true as const, trip };

  // rider or driver can only access their own trip
  if (trip.riderId === userId || trip.driverId === userId) {
    return { ok: true as const, trip };
  }

  return { ok: false as const, error: "FORBIDDEN" as const };
}

/* ----------------------------- schemas ----------------------------- */

const EstimateSchema = z.object({
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]).optional(),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
});

const BookSchema = z.object({
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),

  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),

  scheduledFor: z.string().datetime().optional(),

  // frontend can pass estimate results (optional)
  fareCents: z.number().int().min(0).optional(),
  distanceMeters: z.number().int().min(0).optional(),
  estDurationSeconds: z.number().int().min(0).optional(),
});

const CancelSchema = z.object({
  reasons: z.array(z.string().min(2)).min(1),
  otherReason: z.string().min(2).optional(),
});

const SendMessageSchema = z.object({
  text: z.string().min(1).max(1200),
});

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(800).optional(),
});

/* ----------------------------- endpoints ----------------------------- */

/**
 * Rider: estimate trip
 * Returns SAME shape as your riderClient expects:
 * { ok, distanceMeters, fareCents, etaSeconds, estDurationSeconds }
 */
tripsRouter.post(
  "/rider/trips/estimate",
  requireAuth,
  requireRole(Role.RIDER),
  async (req, res) => {
    const input = EstimateSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
    }

    const v = input.data;

    const est = await estimateTripCost({
      tripType: v.tripType ?? "ONE_WAY",
      pickupLat: v.pickupLat ?? null,
      pickupLng: v.pickupLng ?? null,
      dropoffLat: v.dropoffLat ?? null,
      dropoffLng: v.dropoffLng ?? null,
    });

    return res.json({
      ok: true,
      distanceMeters: est.distanceMeters,
      fareCents: est.fareCents,
      etaSeconds: est.etaSeconds,
      estDurationSeconds: est.estDurationSeconds,
    });
  }
);

/**
 * Rider: book trip
 * Returns SAME shape as your riderClient expects:
 * { ok: true, trip: RiderTripDTO }
 * + includes qrToken (extra, harmless)
 */
tripsRouter.post(
  "/rider/trips/book",
  requireAuth,
  requireRole(Role.RIDER),
  async (req, res) => {
    const input = BookSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
    }

    const riderId = req.auth!.userId;
    const v = input.data;

    // If frontend didn't pass estimate, compute it (best effort)
    const est =
      typeof v.fareCents === "number" && typeof v.distanceMeters === "number"
        ? {
            fareCents: v.fareCents,
            distanceMeters: v.distanceMeters,
            estDurationSeconds: v.estDurationSeconds ?? null,
            etaSeconds: v.estDurationSeconds ?? null,
          }
        : await estimateTripCost({
            tripType: v.tripType,
            pickupLat: v.pickupLat ?? null,
            pickupLng: v.pickupLng ?? null,
            dropoffLat: v.dropoffLat ?? null,
            dropoffLng: v.dropoffLng ?? null,
          });

    const bookingId = makeBookingId();
    const shareToken = randomToken(16);
    const qrToken = randomToken(16);

    const trip = await prisma.trip.create({
      data: {
        riderId,
        tripType: v.tripType,
        status: TripStatus.REQUESTED,
        bookingId,

        scheduledFor: v.scheduledFor ? new Date(v.scheduledFor) : null,

        pickupAddress: v.pickupAddress,
        dropoffAddress: v.dropoffAddress,

        pickupLat: v.pickupLat ?? null,
        pickupLng: v.pickupLng ?? null,
        dropoffLat: v.dropoffLat ?? null,
        dropoffLng: v.dropoffLng ?? null,

        fareCents: Number(est.fareCents ?? 0),
        distanceMeters: est.distanceMeters ?? null,
        estDurationSeconds: est.estDurationSeconds ?? null,

        paymentStatus: PaymentStatus.UNPAID,

        publicShareToken: shareToken,
        qrTokenHash: sha256(qrToken),
      },
      include: {
        driver: { select: { id: true, fullName: true, email: true } },
      },
    });

    return res.status(201).json({
      ok: true,
      trip: tripToDto(trip),
      qrToken,
    });
  }
);

/**
 * Rider: cancel trip + feedback
 */
tripsRouter.post(
  "/rider/trips/:tripId/cancel",
  requireAuth,
  requireRole(Role.RIDER),
  async (req, res) => {
    const input = CancelSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
    }

    const riderId = req.auth!.userId;
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.riderId !== riderId) return res.status(404).json({ error: "NOT_FOUND" });

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      return res.status(409).json({ error: "TRIP_ALREADY_ENDED" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.tripCancellation.create({
        data: {
          tripId,
          cancelledBy: riderId,
          reasons: input.data.reasons,
          otherReason: input.data.otherReason ?? null,
        },
      });

      await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.CANCELLED, cancelledAt: new Date() },
      });
    });

    return res.json({ ok: true });
  }
);

/**
 * Trip: messages (chat) — rider/driver/admin only
 */
tripsRouter.get("/trips/:tripId/messages", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const role = req.auth!.role;
  const { tripId } = req.params;

  const access = await assertTripAccess(tripId, userId, role);
  if (!access.ok) return res.status(access.error === "NOT_FOUND" ? 404 : 403).json({ error: access.error });

  const messages = await prisma.tripMessage.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return res.json({ ok: true, messages });
});

tripsRouter.post("/trips/:tripId/messages", requireAuth, async (req, res) => {
  const input = SendMessageSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const userId = req.auth!.userId;
  const role = req.auth!.role;
  const { tripId } = req.params;

  const access = await assertTripAccess(tripId, userId, role);
  if (!access.ok) return res.status(access.error === "NOT_FOUND" ? 404 : 403).json({ error: access.error });

  const msg = await prisma.tripMessage.create({
    data: { tripId, senderId: userId, text: input.data.text },
  });

  return res.json({ ok: true, message: msg });
});

/**
 * Trip: emergency alert — rider/driver/admin only
 */
tripsRouter.post("/trips/:tripId/emergency", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const role = req.auth!.role;
  const { tripId } = req.params;

  const access = await assertTripAccess(tripId, userId, role);
  if (!access.ok) return res.status(access.error === "NOT_FOUND" ? 404 : 403).json({ error: access.error });

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (!trip.driverId) return res.status(409).json({ error: "NO_DRIVER_ASSIGNED" });

  const { type, message } = req.body ?? {};

  const alert = await prisma.emergencyAlert.create({
    data: {
      tripId,
      driverId: trip.driverId,
      type: String(type ?? "SOS"),
      message: message ? String(message) : null,
    },
  });

  return res.json({ ok: true, alertId: alert.id });
});

/**
 * Trip: review (rate driver) — rider only, completed only
 */
tripsRouter.post("/trips/:tripId/review", requireAuth, requireRole(Role.RIDER), async (req, res) => {
  const input = ReviewSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const riderId = req.auth!.userId;
  const { tripId } = req.params;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.riderId !== riderId) return res.status(404).json({ error: "NOT_FOUND" });
  if (trip.status !== TripStatus.COMPLETED) return res.status(409).json({ error: "TRIP_NOT_COMPLETED" });
  if (!trip.driverId) return res.status(409).json({ error: "NO_DRIVER_ASSIGNED" });

  const review = await prisma.tripReview.create({
    data: {
      tripId,
      reviewerId: riderId,
      revieweeId: trip.driverId,
      rating: input.data.rating,
      text: input.data.text ?? null,
    },
  });

  return res.json({ ok: true, reviewId: review.id });
});

/**
 * Trip: share link — participant only
 */
tripsRouter.get("/trips/:tripId/share-link", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const role = req.auth!.role;
  const { tripId } = req.params;

  const access = await assertTripAccess(tripId, userId, role);
  if (!access.ok) return res.status(access.error === "NOT_FOUND" ? 404 : 403).json({ error: access.error });

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (!trip.publicShareToken) return res.status(409).json({ error: "SHARE_TOKEN_NOT_CREATED" });

  const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base}/share/booking/${trip.publicShareToken}`;
  return res.json({ ok: true, url });
});

/**
 * Trip: QR payload — participant only
 */
tripsRouter.get("/trips/:tripId/qr", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const role = req.auth!.role;
  const { tripId } = req.params;

  const access = await assertTripAccess(tripId, userId, role);
  if (!access.ok) return res.status(access.error === "NOT_FOUND" ? 404 : 403).json({ error: access.error });

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  return res.json({ ok: true, bookingId: trip.bookingId, tripId: trip.id });
});
