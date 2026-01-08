// src/lib/riderClient.ts
import { authedJson } from "./authClient";

/* ----------------- Onboarding Types ----------------- */
export type RiderPaymentMethod =
  | "APPLE_PAY"
  | "PAYPAL"
  | "GPAY"
  | "CASHAPP"
  | "CREDIT_CARD";

/* ----------------- Dashboard/Trips Types ----------------- */
export type TripStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "EN_ROUTE_PICKUP"
  | "ARRIVED_PICKUP"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type RiderTripDTO = {
  id: string;
  bookingId: string | null;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  status: TripStatus;

  pickupAddress: string;
  destinationAddress: string;

  fare: number; // dollars
  distanceKm: number;

  // optional but now supported by backend DTO
  etaSeconds?: number | null;
  estDurationSeconds?: number | null;

  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;

  driver: null | { id: string; fullName: string; email: string };
};

export type TripMessageDTO = {
  id: string;
  tripId: string;
  senderId: string;
  text: string;
  deliveredAt: string | null;
  seenAt: string | null;
  createdAt: string;
};

export type TripEstimateResponse = {
  ok: true;
  distanceMeters: number | null;
  fareCents: number;
  etaSeconds: number | null;
  estDurationSeconds: number | null;
};

/* =========================================================
   Rider Onboarding
========================================================= */

export async function riderOnboardingStatus() {
  return authedJson<{
    ok: true;
    step: number;
    completedAt: string | null;
    phone: string | null;
    locationText: string | null;
    paymentMethod: RiderPaymentMethod | null;
    otpVerifiedAt: string | null;
  }>("/rider/onboarding/status", { method: "GET" });
}

export async function riderBasicDetails(payload: { phone: string }) {
  return authedJson<{ ok: true; otpId: string; devOtp?: string; nextPath: string }>(
    "/rider/onboarding/basic-details",
    { method: "POST", json: payload }
  );
}

export async function riderVerifyOtp(payload: { otpId: string; otp: string }) {
  return authedJson<{ ok: true; nextPath: string }>(
    "/rider/onboarding/verify-otp",
    { method: "POST", json: payload }
  );
}

export async function riderSetFullName(payload: { fullName: string }) {
  return authedJson<{ ok: true; nextPath: string }>(
    "/rider/onboarding/full-name",
    { method: "POST", json: payload }
  );
}

export async function riderSetLocation(payload: { locationText: string }) {
  return authedJson<{ ok: true; nextPath: string }>(
    "/rider/onboarding/location",
    { method: "POST", json: payload }
  );
}

export async function riderSetPaymentMethod(payload: { method: RiderPaymentMethod }) {
  return authedJson<{ ok: true; nextPath: string }>(
    "/rider/onboarding/payment-method",
    { method: "POST", json: payload }
  );
}

export async function riderAcceptAgreement() {
  return authedJson<{ ok: true; nextPath: string }>(
    "/rider/onboarding/agreement",
    { method: "POST", json: { agreed: true } }
  );
}

/* =========================================================
   Rider Dashboard + Trips
========================================================= */

export async function getRiderHome() {
  return authedJson<{
    ok: true;
    user: { id: string; fullName: string; email: string; role: "RIDER" };
    activeTrip: RiderTripDTO | null;
    upcoming: RiderTripDTO[];
    history: RiderTripDTO[];
  }>("/rider/dashboard/home", { method: "GET" });
}

/**
 * Calls backend estimate endpoint (cheap + deterministic).
 * Mount must be: app.use("/rider/trips", riderTripsRouter)
 */
export async function estimateTrip(payload: {
  tripType: "ONE_WAY" | "ROUND_TRIP";
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}) {
  return authedJson<TripEstimateResponse>("/rider/trips/estimate", {
    method: "POST",
    json: payload,
  });
}

/**
 * Real-time budget helper:
 * Use this in UI while user moves map / edits address (debounce it).
 * Returns backend estimate + computed dollars/km/minutes for UI display.
 */
export async function estimateTripRealtimeBudget(payload: {
  tripType: "ONE_WAY" | "ROUND_TRIP";
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}) {
  const est = await estimateTrip(payload);

  const fareUsd = Number(((est.fareCents ?? 0) / 100).toFixed(2));
  const distanceKm =
    typeof est.distanceMeters === "number" ? Number((est.distanceMeters / 1000).toFixed(2)) : null;

  const etaMin = typeof est.etaSeconds === "number" ? Math.max(1, Math.round(est.etaSeconds / 60)) : null;
  const durationMin =
    typeof est.estDurationSeconds === "number"
      ? Math.max(1, Math.round(est.estDurationSeconds / 60))
      : null;

  return {
    ...est,
    fareUsd,
    distanceKm,
    etaMin,
    durationMin,
  };
}

/**
 * Book trip (UPDATED):
 * backend now returns { ok, trip, qrToken, shareUrl }
 */
export async function bookTrip(payload: {
  tripType: "ONE_WAY" | "ROUND_TRIP";
  pickupAddress: string;
  dropoffAddress: string;

  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;

  scheduledFor?: string; // ISO string
  fareCents?: number;
  distanceMeters?: number;
}) {
  return authedJson<{
    ok: true;
    trip: RiderTripDTO;
    qrToken: string;
    shareUrl: string;
  }>("/rider/trips/book", { method: "POST", json: payload });
}

export async function getCurrentTrip() {
  return authedJson<{ ok: true; trip: RiderTripDTO | null }>("/rider/trips/current", {
    method: "GET",
  });
}

export async function cancelTrip(tripId: string, payload: { reasons: string[]; otherReason?: string }) {
  return authedJson<{ ok: true }>(`/rider/trips/${tripId}/cancel`, {
    method: "POST",
    json: payload,
  });
}

export async function rateDriver(tripId: string, payload: { rating: number; text?: string }) {
  return authedJson<{ ok: true; reviewId: string }>(`/rider/trips/${tripId}/rate-driver`, {
    method: "POST",
    json: payload,
  });
}

export async function getTripChat(tripId: string) {
  return authedJson<{ ok: true; messages: TripMessageDTO[] }>(`/rider/trips/${tripId}/chat`, {
    method: "GET",
  });
}

export async function sendTripChat(tripId: string, text: string) {
  return authedJson<{ ok: true; message: TripMessageDTO }>(`/rider/trips/${tripId}/chat`, {
    method: "POST",
    json: { text },
  });
}

export async function sos(tripId: string) {
  return authedJson<{ ok: true }>(`/rider/trips/${tripId}/sos`, { method: "POST" });
}

/* =========================================================
   NEW: Share + QR helpers
========================================================= */

/**
 * ShareBookingModal:
 * returns { ok, url }
 */
// export async function getTripShareLink(tripId: string) {
//   return authedJson<{ ok: true; url: string }>(`/trips/${tripId}/share-link`, {
//     method: "GET",
//   });
// }
export async function getTripShareLink(tripId: string) {
  return authedJson<{ ok: true; url: string }>(`/rider/trips/${tripId}/share-link`, {
    method: "GET",
  });
}
/**
 * DriverQrModal:
 * re-issues QR token so rider can show again
 */
export async function getTripQr(tripId: string) {
  return authedJson<{
    ok: true;
    tripId: string;
    bookingId: string | null;
    qrToken: string;
  }>(`/rider/trips/${tripId}/qr`, { method: "GET" });
}
