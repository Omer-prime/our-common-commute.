export type EstimateInput = {
  tripType?: "ONE_WAY" | "ROUND_TRIP";
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
};

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

function priceFrom(distanceMeters: number | null, tripType: "ONE_WAY" | "ROUND_TRIP") {
  const baseCents = 350;  // $3.50
  const perKmCents = 120; // $1.20/km
  const perMinCents = 25; // $0.25/min

  const km = distanceMeters ? distanceMeters / 1000 : 0;
  const estSpeedKmh = 30;
  const minutes = km > 0 ? (km / estSpeedKmh) * 60 : 0;

  let fare = baseCents + Math.round(km * perKmCents) + Math.round(minutes * perMinCents);
  if (tripType === "ROUND_TRIP") fare = Math.round(fare * 1.85);

  const estDurationSeconds = km > 0 ? Math.round((km / estSpeedKmh) * 3600) : null;

  return {
    fareCents: Math.max(fare, baseCents),
    distanceMeters,
    estDurationSeconds,
    etaSeconds: estDurationSeconds,
  };
}

async function googleRouteDistanceSeconds(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): Promise<{ distanceMeters: number; durationSeconds: number } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${pickupLat},${pickupLng}` +
    `&destination=${dropoffLat},${dropoffLng}` +
    `&departure_time=now` +
    `&key=${key}`;

  // Use built-in fetch if available (Node 18+). If not available, skip Google route.
  const f: any = (globalThis as any).fetch;
  if (typeof f !== "function") return null;

  try {
    const resp = await f(url);
    if (!resp?.ok) return null;

    const data: any = await resp.json();
    const leg = data?.routes?.[0]?.legs?.[0];

    const dist = leg?.distance?.value;
    const dur = leg?.duration_in_traffic?.value ?? leg?.duration?.value;

    if (typeof dist !== "number" || typeof dur !== "number") return null;
    return { distanceMeters: dist, durationSeconds: dur };
  } catch {
    return null;
  }
}

export async function estimateTripCost(input: EstimateInput) {
  const tripType = input.tripType ?? "ONE_WAY";

  const hasCoords =
    typeof input.pickupLat === "number" &&
    typeof input.pickupLng === "number" &&
    typeof input.dropoffLat === "number" &&
    typeof input.dropoffLng === "number";

  if (hasCoords) {
    // Try Google first (real routing)
    const g = await googleRouteDistanceSeconds(
      input.pickupLat!,
      input.pickupLng!,
      input.dropoffLat!,
      input.dropoffLng!
    );

    if (g) {
      const pricing = priceFrom(g.distanceMeters, tripType);
      return {
        ...pricing,
        estDurationSeconds: g.durationSeconds,
        etaSeconds: g.durationSeconds,
      };
    }

    // fallback haversine
    const distanceMeters = Math.round(
      haversineMeters(
        { lat: input.pickupLat!, lng: input.pickupLng! },
        { lat: input.dropoffLat!, lng: input.dropoffLng! }
      )
    );

    return priceFrom(distanceMeters, tripType);
  }

  // No coords => base-only estimate
  return priceFrom(null, tripType);
}
