import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { requireAuth, requireRider } from "../middleware/auth.js";

export const riderTripsRouter = Router();
riderTripsRouter.use(requireAuth, requireRider);

// -------------------- helpers --------------------

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken(bytes = 16) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function makeBookingId() {
  const n = crypto.randomInt(0, 100_000_000);
  return `#${String(n).padStart(8, "0")}`;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function estimateFare(params: { distanceMeters?: number | null; tripType: "ONE_WAY" | "ROUND_TRIP" }) {
  const baseCents = 350; // $3.50
  const perKmCents = 120; // $1.20/km

  const distanceKm = params.distanceMeters ? params.distanceMeters / 1000 : 0;
  const estSpeedKmh = 30;
  const estDurationMin = distanceKm > 0 ? (distanceKm / estSpeedKmh) * 60 : 0;

  const perMinCents = 25; // $0.25/min
  let fare =
    baseCents +
    Math.round(distanceKm * perKmCents) +
    Math.round(estDurationMin * perMinCents);

  if (params.tripType === "ROUND_TRIP") {
    fare = Math.round(fare * 1.85);
  }

  const estSeconds = distanceKm > 0 ? Math.round((distanceKm / estSpeedKmh) * 3600) : null;

  return {
    fareCents: Math.max(fare, baseCents),
    etaSeconds: estSeconds,
    estDurationSeconds: estSeconds,
  };
}

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
    etaSeconds: t.etaSeconds ?? null,
    estDurationSeconds: t.estDurationSeconds ?? null,
    scheduledFor: t.scheduledFor ? t.scheduledFor.toISOString() : null,
    startedAt: t.startedAt ? t.startedAt.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    cancelledAt: t.cancelledAt ? t.cancelledAt.toISOString() : null,
    driver: t.driver
      ? { id: t.driver.id, fullName: t.driver.fullName, email: t.driver.email }
      : null,
  };
}

// -------------------- estimate --------------------

const EstimateSchema = z.object({
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
});

riderTripsRouter.post("/estimate", async (req, res) => {
  const input = EstimateSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const v = input.data;

  let distanceMeters: number | null = null;
  if (
    typeof v.pickupLat === "number" &&
    typeof v.pickupLng === "number" &&
    typeof v.dropoffLat === "number" &&
    typeof v.dropoffLng === "number"
  ) {
    distanceMeters = Math.round(
      haversineMeters(
        { lat: v.pickupLat, lng: v.pickupLng },
        { lat: v.dropoffLat, lng: v.dropoffLng }
      )
    );
  }

  const pricing = estimateFare({ distanceMeters, tripType: v.tripType });

  return res.json({
    ok: true,
    distanceMeters,
    fareCents: pricing.fareCents,
    etaSeconds: pricing.etaSeconds,
    estDurationSeconds: pricing.estDurationSeconds,
  });
});

// -------------------- book --------------------

const BookSchema = z.object({
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),

  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),

  scheduledFor: z.string().datetime().optional(),

  // optional from frontend
  fareCents: z.number().int().min(0).optional(),
  distanceMeters: z.number().int().min(0).optional(),
});

riderTripsRouter.post("/book", async (req, res) => {
  const userId = req.auth!.userId;

  const input = BookSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const v = input.data;

  const distanceMeters =
    typeof v.distanceMeters === "number"
      ? v.distanceMeters
      : typeof v.pickupLat === "number" &&
        typeof v.pickupLng === "number" &&
        typeof v.dropoffLat === "number" &&
        typeof v.dropoffLng === "number"
      ? Math.round(
          haversineMeters(
            { lat: v.pickupLat, lng: v.pickupLng },
            { lat: v.dropoffLat, lng: v.dropoffLng }
          )
        )
      : null;

  const pricing =
    typeof v.fareCents === "number"
      ? { fareCents: v.fareCents, etaSeconds: null, estDurationSeconds: null }
      : estimateFare({ distanceMeters, tripType: v.tripType });

  // Share + QR tokens
  const publicShareToken = randomToken(16);

  const qrToken = randomToken(16);
  const qrTokenHash = sha256(qrToken);
  const qrTokenIssuedAt = new Date();
  const qrTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  const trip = await prisma.trip.create({
    data: {
      riderId: userId,
      status: "REQUESTED",
      tripType: v.tripType,

      bookingId: makeBookingId(),

      pickupAddress: v.pickupAddress,
      dropoffAddress: v.dropoffAddress,

      pickupLat: v.pickupLat ?? null,
      pickupLng: v.pickupLng ?? null,
      dropoffLat: v.dropoffLat ?? null,
      dropoffLng: v.dropoffLng ?? null,

      scheduledFor: v.scheduledFor ? new Date(v.scheduledFor) : null,

      fareCents: pricing.fareCents ?? 0,
      distanceMeters: distanceMeters ?? null,
      etaSeconds: (pricing as any).etaSeconds ?? null,
      estDurationSeconds: (pricing as any).estDurationSeconds ?? null,

      publicShareToken,
      qrTokenHash,
      qrTokenIssuedAt,
      qrTokenExpiresAt,
    } as any,
    include: {
      driver: { select: { id: true, fullName: true, email: true } },
    },
  });

  const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${base}/share/booking/${publicShareToken}`;

  return res.status(201).json({
    ok: true,
    trip: tripToDto(trip),
    qrToken,     // show in DriverQrModal (once)
    shareUrl,    // optional convenience
  });
});

// -------------------- current & details --------------------

riderTripsRouter.get("/current", async (req, res) => {
  const userId = req.auth!.userId;

  const trip = await prisma.trip.findFirst({
    where: {
      riderId: userId,
      status: { in: ["REQUESTED", "ACCEPTED", "EN_ROUTE_PICKUP", "ARRIVED_PICKUP", "IN_PROGRESS"] as any },
    },
    orderBy: { updatedAt: "desc" },
    include: { driver: { select: { id: true, fullName: true, email: true } } },
  });

  return res.json({ ok: true, trip: trip ? tripToDto(trip) : null });
});

riderTripsRouter.get("/:tripId", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    include: { driver: { select: { id: true, fullName: true, email: true } } },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json({ ok: true, trip: tripToDto(trip) });
});

// -------------------- share link (ShareBookingModal) --------------------

riderTripsRouter.get("/:tripId/share-link", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true, publicShareToken: true },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  let token = trip.publicShareToken;
  if (!token) {
    token = randomToken(16);
    await prisma.trip.update({
      where: { id: tripId },
      data: { publicShareToken: token } as any,
    });
  }

  const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base}/share/booking/${token}`;
  return res.json({ ok: true, url });
});

// -------------------- QR (DriverQrModal) --------------------
// Re-issues token so rider can open QR any time

riderTripsRouter.get("/:tripId/qr", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true, bookingId: true },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const qrToken = randomToken(16);
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      qrTokenHash: sha256(qrToken),
      qrTokenIssuedAt: new Date(),
      qrTokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    } as any,
  });

  return res.json({
    ok: true,
    tripId: trip.id,
    bookingId: trip.bookingId ?? null,
    qrToken,
  });
});

// -------------------- cancel --------------------

const CancelSchema = z.object({
  reasons: z.array(z.string().min(2)).min(1),
  otherReason: z.string().min(2).optional(),
});

riderTripsRouter.post("/:tripId/cancel", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const input = CancelSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    return res.status(409).json({ error: "TRIP_ALREADY_ENDED" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.tripCancellation.create({
      data: {
        tripId,
        cancelledBy: userId,
        reasons: input.data.reasons,
        otherReason: input.data.otherReason,
      },
    });

    await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });

  return res.json({ ok: true });
});

// -------------------- rate driver --------------------

const RateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(800).optional(),
});

riderTripsRouter.post("/:tripId/rate-driver", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const input = RateSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true, status: true, driverId: true },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (trip.status !== "COMPLETED") return res.status(409).json({ error: "TRIP_NOT_COMPLETED" });
  if (!trip.driverId) return res.status(409).json({ error: "NO_DRIVER_ASSIGNED" });

  const review = await prisma.tripReview.create({
    data: {
      tripId,
      reviewerId: userId,
      revieweeId: trip.driverId,
      rating: input.data.rating,
      text: input.data.text,
    },
  });

  return res.json({ ok: true, reviewId: review.id });
});

// -------------------- chat --------------------

riderTripsRouter.get("/:tripId/chat", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true },
  });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const messages = await prisma.tripMessage.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return res.json({ ok: true, messages });
});

const SendChatSchema = z.object({
  text: z.string().min(1).max(1200),
});

riderTripsRouter.post("/:tripId/chat", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const input = SendChatSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true },
  });
  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });

  const msg = await prisma.tripMessage.create({
    data: {
      tripId,
      senderId: userId,
      text: input.data.text,
    },
  });

  return res.json({ ok: true, message: msg });
});

// -------------------- SOS --------------------

riderTripsRouter.post("/:tripId/sos", async (req, res) => {
  const userId = req.auth!.userId;
  const tripId = req.params.tripId;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, riderId: userId },
    select: { id: true, driverId: true },
  });

  if (!trip) return res.status(404).json({ error: "NOT_FOUND" });
  if (!trip.driverId) return res.status(409).json({ error: "NO_DRIVER_ASSIGNED" });

  await prisma.emergencyAlert.create({
    data: {
      tripId,
      driverId: trip.driverId,
      type: "RIDER_SOS",
      message: `SOS triggered by rider ${userId}`,
    },
  });

  return res.json({ ok: true });
});
