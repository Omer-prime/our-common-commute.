// src/lib/driverClient.ts
import { authedJson } from "./authClient";

export type RideDTO = {
  id: string;
  bookingId?: string | null;
  tripType: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  fare: number;
  distanceKm: number;
  rider: null | { id: string; fullName: string; email: string };
  scheduledFor?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

export async function getMyRides() {
  return authedJson<{ ok: true; activeRide: RideDTO | null; upcoming: RideDTO[]; completed: RideDTO[] }>(
    "/driver/dashboard/my-rides",
    { method: "GET" }
  );
}

export async function getRequests(filters: { distanceOn?: boolean; shortTripsOn?: boolean }) {
  const qs = new URLSearchParams();
  if (filters.distanceOn) qs.set("maxDistanceMiles", "15");
  if (filters.shortTripsOn) qs.set("shortTrips", "1");

  return authedJson<{ ok: true; requests: RideDTO[] }>(
    `/driver/dashboard/requests?${qs.toString()}`,
    { method: "GET" }
  );
}

export async function acceptRequest(tripId: string) {
  return authedJson<{ ok: true; trip: RideDTO }>(`/driver/dashboard/requests/${tripId}/accept`, { method: "POST" });
}

export async function getCurrentTrip() {
  return authedJson<{ ok: true; trip: RideDTO | null }>(`/driver/trips/current`, { method: "GET" });
}

export async function getTrip(tripId: string) {
  return authedJson(`/driver/trips/${tripId}`, { method: "GET" });
}

export async function startTrip(tripId: string) {
  return authedJson(`/driver/trips/${tripId}/start`, { method: "POST" });
}

export async function completeTrip(tripId: string) {
  return authedJson(`/driver/trips/${tripId}/complete`, { method: "POST" });
}

export async function cancelTrip(tripId: string, payload: { reasons: string[]; otherReason?: string }) {
  return authedJson(`/driver/trips/${tripId}/cancel`, { method: "POST", json: payload });
}

export async function rateRider(tripId: string, payload: { rating: number; text?: string }) {
  return authedJson(`/driver/trips/${tripId}/rate-rider`, { method: "POST", json: payload });
}

export async function getChat(tripId: string) {
  return authedJson<{ ok: true; messages: any[] }>(`/driver/trips/${tripId}/chat`, { method: "GET" });
}

export async function sendChat(tripId: string, text: string) {
  return authedJson<{ ok: true; message: any }>(`/driver/trips/${tripId}/chat`, { method: "POST", json: { text } });
}

export async function getNotifications() {
  return authedJson<{ ok: true; items: any[] }>(`/driver/notifications`, { method: "GET" });
}

export async function sos(tripId: string) {
  return authedJson(`/driver/trips/${tripId}/sos`, { method: "POST" });
}
