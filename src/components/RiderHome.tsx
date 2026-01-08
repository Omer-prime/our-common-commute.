"use client";

import {
  FareEstimateModal,
  BookingConfirmationModal,
  ShareBookingModal,
  DriverArrivalModal,
  DriverQrModal,
  CancelRideFeedbackModal,
  InTripTrackingModal,
  EmergencyAlertModal,
  EndTripConfirmationModal,
  RateDriverModal,
  DriverChatModal,
} from "@/src/components/rider-modals";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import { MobileTopSection } from "@/src/components/rider-home";
import {
  getRiderHome,
  estimateTrip,
  bookTrip,
  type RiderTripDTO,
} from "@/src/lib/riderClient";
import { DriverLiveMap } from "@/src/components/DriverLiveMap";

import { BookingFields } from "@/src/components/rider-home/BookingFields";
import type { TripType } from "@/src/components/rider-home/types";

type LatLng = { lat: number; lng: number };

type PlaceState = {
  label: string;
  coords?: LatLng;
};

type EstimateState = {
  fareCents: number;
  distanceMeters?: number | null;
  etaSeconds?: number | null;
  estDurationSeconds?: number | null;
};

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function fmtMoneyFromCents(cents: number) {
  const v = Number(cents ?? 0);
  return fmtMoney(v / 100);
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortTitle(addr: string) {
  const t = (addr || "").trim();
  if (!t) return "Destination";
  const p = t.split(",")[0]?.trim();
  return p || t;
}

/** Try to geocode on-client if Google Maps JS is loaded; otherwise return undefined coords */
async function tryGeocode(address: string): Promise<LatLng | undefined> {
  try {
    if (typeof window === "undefined") return undefined;
    const g = (globalThis as any).google;
    if (!g?.maps?.Geocoder) return undefined;

    const geocoder = new g.maps.Geocoder();
    const res = await geocoder.geocode({ address });
    const loc = res?.results?.[0]?.geometry?.location;
    if (!loc) return undefined;
    return { lat: loc.lat(), lng: loc.lng() };
  } catch {
    return undefined;
  }
}

export function RiderHome() {
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [recurring, setRecurring] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>("");
  const [meId, setMeId] = useState<string>(""); // needed for DriverChatModal

  const [activeTrip, setActiveTrip] = useState<RiderTripDTO | null>(null);
  const [history, setHistory] = useState<RiderTripDTO[]>([]);
  const [upcoming, setUpcoming] = useState<RiderTripDTO[]>([]);

  const firstName = useMemo(() => {
    const n = userName.trim();
    if (!n) return "there";
    return n.split(" ")[0] || n;
  }, [userName]);

  // booking input states
  const [pickup, setPickup] = useState<PlaceState | null>(null);
  const [dropoff, setDropoff] = useState<PlaceState | null>(null);

  const [leaveAt, setLeaveAt] = useState<Date | null>(null);
  const [arriveAt, setArriveAt] = useState<Date | null>(null);

  // estimate state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateErr, setEstimateErr] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateState | null>(null);

  // booked trip state (real backend result)
  const [bookedTrip, setBookedTrip] = useState<RiderTripDTO | null>(null);
  const [bookedShareUrl, setBookedShareUrl] = useState<string>("");
  const [bookedQrToken, setBookedQrToken] = useState<string>("");

  const [bookLoading, setBookLoading] = useState(false);

  // best trip to use for modals
  const currentTrip = useMemo(() => activeTrip ?? bookedTrip, [activeTrip, bookedTrip]);
  const currentTripId = useMemo(() => String((currentTrip as any)?.id ?? ""), [currentTrip]);

  // share modal return target
  const [shareReturnTo, setShareReturnTo] = useState<"none" | "arrival" | "inTrip">("none");

  // load dashboard data
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);

        const data = await getRiderHome();
        if (!alive) return;

        setUserName(data.user?.fullName ?? "");

        // try to set meId safely from whatever backend returns
        const uid =
          (data.user as any)?.id ??
          (data.user as any)?.userId ??
          (data.user as any)?.riderId ??
          "";
        setMeId(String(uid));

        setActiveTrip(data.activeTrip);
        setHistory(data.history ?? []);
        setUpcoming(data.upcoming ?? []);

        const seed = (data.upcoming?.[0] ?? data.history?.[0]) as RiderTripDTO | undefined;

        if (seed) {
          setPickup((prev) => prev ?? { label: (seed as any).pickupAddress ?? "" });
          setDropoff((prev) => prev ?? { label: (seed as any).destinationAddress ?? "" });
        }
      } catch (e: any) {
        if (!alive) return;
        setLoadErr(e?.error ? String(e.error) : "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // clear estimate when inputs change
  useEffect(() => {
    setEstimate(null);
    setEstimateErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.label, dropoff?.label, tripType, recurring, leaveAt?.getTime(), arriveAt?.getTime()]);

  // ----- Modals -----
  const [isFareModalOpen, setIsFareModalOpen] = useState(false);
  const [isBookingConfirmOpen, setIsBookingConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDriverArrivalOpen, setIsDriverArrivalOpen] = useState(false);
  const [isDriverQrOpen, setIsDriverQrOpen] = useState(false);
  const [isCancelFeedbackOpen, setIsCancelFeedbackOpen] = useState(false);

  const [isInTripOpen, setIsInTripOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isEndTripOpen, setIsEndTripOpen] = useState(false);
  const [isRateDriverOpen, setIsRateDriverOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const closeFareModal = () => setIsFareModalOpen(false);

  // ===== backend: estimate =====
  const openFareModal = async () => {
    const pickupAddress = pickup?.label?.trim() || "";
    const dropoffAddress = dropoff?.label?.trim() || "";

    setEstimateErr(null);

    if (!pickupAddress || !dropoffAddress) {
      setEstimateErr("Please select pickup and destination first.");
      setIsFareModalOpen(true);
      return;
    }

    try {
      setEstimateLoading(true);

      // if coords missing, try geocode and update state
      let pCoords = pickup?.coords;
      let dCoords = dropoff?.coords;

      if (!pCoords) {
        const g = await tryGeocode(pickupAddress);
        if (g) {
          pCoords = g;
          setPickup((prev) => (prev ? { ...prev, coords: g } : prev));
        }
      }
      if (!dCoords) {
        const g = await tryGeocode(dropoffAddress);
        if (g) {
          dCoords = g;
          setDropoff((prev) => (prev ? { ...prev, coords: g } : prev));
        }
      }

      const apiTripType = tripType === "round-trip" ? "ROUND_TRIP" : "ONE_WAY";

      const res = await estimateTrip({
        tripType: apiTripType,
        pickupAddress,
        dropoffAddress,
        pickupLat: pCoords?.lat,
        pickupLng: pCoords?.lng,
        dropoffLat: dCoords?.lat,
        dropoffLng: dCoords?.lng,
      });

      const payload = (res as any)?.estimate ?? res;

      setEstimate({
        fareCents: Number(payload?.fareCents ?? 0),
        distanceMeters: payload?.distanceMeters ?? null,
        etaSeconds: payload?.etaSeconds ?? null,
        estDurationSeconds: payload?.estDurationSeconds ?? null,
      });

      setIsFareModalOpen(true);
    } catch (e: any) {
      setEstimateErr(e?.error ? String(e.error) : "Failed to estimate ride");
      setIsFareModalOpen(true);
    } finally {
      setEstimateLoading(false);
    }
  };

  // ===== backend: book =====
  const handleBookNow = async () => {
    const pickupAddress = pickup?.label?.trim() || "";
    const dropoffAddress = dropoff?.label?.trim() || "";

    setEstimateErr(null);

    if (!pickupAddress || !dropoffAddress) {
      setEstimateErr("Please select pickup and destination first.");
      return;
    }
    if (!estimate) {
      setEstimateErr("Please get estimate first.");
      return;
    }

    try {
      setBookLoading(true);

      const apiTripType = tripType === "round-trip" ? "ROUND_TRIP" : "ONE_WAY";

      const scheduledFor =
        leaveAt && leaveAt.getTime() > Date.now() + 60_000 ? leaveAt.toISOString() : undefined;

      const res = await bookTrip({
        tripType: apiTripType,
        pickupAddress,
        dropoffAddress,
        pickupLat: pickup?.coords?.lat,
        pickupLng: pickup?.coords?.lng,
        dropoffLat: dropoff?.coords?.lat,
        dropoffLng: dropoff?.coords?.lng,
        scheduledFor,
        fareCents: estimate.fareCents,
        distanceMeters: estimate.distanceMeters ?? undefined,
      });

      setBookedTrip(res.trip);
      setBookedQrToken(res.qrToken);
      setBookedShareUrl(res.shareUrl);

      setActiveTrip(res.trip);

      setIsFareModalOpen(false);
      setIsBookingConfirmOpen(true);
    } catch (e: any) {
      setEstimateErr(e?.error ? String(e.error) : "Booking failed");
      setIsFareModalOpen(true);
    } finally {
      setBookLoading(false);
    }
  };

  // ===== schedule ride =====
  const handleScheduleRide = async () => {
    const pickupAddress = pickup?.label?.trim() || "";
    const dropoffAddress = dropoff?.label?.trim() || "";

    setEstimateErr(null);

    if (!pickupAddress || !dropoffAddress) {
      setEstimateErr("Please select pickup and destination first.");
      return;
    }
    if (!leaveAt) {
      setEstimateErr("Please select a 'Leave at' time to schedule.");
      return;
    }
    if (leaveAt.getTime() < Date.now() + 60_000) {
      setEstimateErr("Leave time must be at least 1 minute in the future.");
      return;
    }

    try {
      const apiTripType = tripType === "round-trip" ? "ROUND_TRIP" : "ONE_WAY";

      const res = await bookTrip({
        tripType: apiTripType,
        pickupAddress,
        dropoffAddress,
        pickupLat: pickup?.coords?.lat,
        pickupLng: pickup?.coords?.lng,
        dropoffLat: dropoff?.coords?.lat,
        dropoffLng: dropoff?.coords?.lng,
        scheduledFor: leaveAt.toISOString(),
      });

      setUpcoming((prev) => [res.trip, ...prev]);
    } catch (e: any) {
      setEstimateErr(e?.error ? String(e.error) : "Failed to schedule ride");
    }
  };

  const handleShareFromConfirmation = () => {
    setIsBookingConfirmOpen(false);
    setShareReturnTo("arrival");
    setIsShareModalOpen(true);
  };

  const handleGoToMyRides = () => {
    setIsBookingConfirmOpen(false);
    setIsDriverArrivalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);

    if (shareReturnTo === "arrival") {
      setIsDriverArrivalOpen(true);
    }
    setShareReturnTo("none");
  };

  const handleCloseCancelFeedback = () => {
    setIsCancelFeedbackOpen(false);
    setIsDriverArrivalOpen(false);
  };

  const canEstimate = Boolean(pickup?.label?.trim() && dropoff?.label?.trim());

  return (
    <RiderDashboardShell>
      <div className="space-y-5">
        {loadErr ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            {loadErr}
          </div>
        ) : null}

        {estimateErr ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            {estimateErr}
          </div>
        ) : null}

        {/* Mobile */}
        <div className="lg:hidden">
          <MobileTopSection
            tripType={tripType}
            setTripType={setTripType}
            recurring={recurring}
            toggleRecurring={() => setRecurring((v) => !v)}
            openFareModal={openFareModal}
            pickup={pickup}
            dropoff={dropoff}
            leaveAt={leaveAt}
            arriveAt={arriveAt}
            onPickupChange={async (p) => {
              const coords = p.coords ?? (p.label ? await tryGeocode(p.label) : undefined);
              setPickup({ label: p.label, coords });
            }}
            onDropoffChange={async (p) => {
              const coords = p.coords ?? (p.label ? await tryGeocode(p.label) : undefined);
              setDropoff({ label: p.label, coords });
            }}
            onLeaveAtChange={setLeaveAt}
            onArriveAtChange={setArriveAt}
          />
        </div>

        {/* Desktop */}
        <section className="hidden rounded-2xl border border-[#233358] bg-[#050f25] p-5 lg:block lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
            {/* MAP */}
            <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#233358] bg-[#0b1735]">
              <div className="absolute inset-0">
                <DriverLiveMap
                  pickup={pickup?.coords ?? null}
                  dropoff={dropoff?.coords ?? null}
                  showRoute={Boolean(pickup?.coords && dropoff?.coords)}
                />
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex justify-end gap-2">
                  <div className="pointer-events-auto flex flex-col gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#243456]/90 shadow"
                    >
                      <Image src="/arrow-head.png" alt="Navigate" width={16} height={16} />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#243456]/90 shadow"
                    >
                      <Image src="/fashion.png" alt="Center" width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOOKING */}
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Hello {firstName}, where would you like to go
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">Choose your preferred destination</p>
                </div>

                {/* Trip type toggle */}
                <div className="inline-flex w-full rounded-xl bg-[#101a33] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={`flex-1 rounded-lg py-2 font-medium ${
                      tripType === "one-way" ? "bg-[#1d4ed8] text-white" : "text-slate-300"
                    }`}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("round-trip")}
                    className={`flex-1 rounded-lg py-2 font-medium ${
                      tripType === "round-trip" ? "bg-[#1d4ed8] text-white" : "text-slate-300"
                    }`}
                  >
                    Round trip
                  </button>
                </div>

                <BookingFields
                  tripType={tripType}
                  recurring={recurring}
                  toggleRecurring={() => setRecurring((v) => !v)}
                  pickup={pickup}
                  dropoff={dropoff}
                  leaveAt={leaveAt}
                  arriveAt={arriveAt}
                  onPickupChange={async (p) => {
                    const coords = p.coords ?? (p.label ? await tryGeocode(p.label) : undefined);
                    setPickup({ label: p.label, coords });
                  }}
                  onDropoffChange={async (p) => {
                    const coords = p.coords ?? (p.label ? await tryGeocode(p.label) : undefined);
                    setDropoff({ label: p.label, coords });
                  }}
                  onLeaveAtChange={(d) => setLeaveAt(d)}
                  onArriveAtChange={(d) => setArriveAt(d)}
                />

                {/* Status row */}
                <div className="flex items-center gap-3 rounded-xl border border-[#233358] bg-[#1a2d51] px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
                    <Image
                      src="/arrow-head.png"
                      alt="Status"
                      width={18}
                      height={18}
                      className="h-4 w-4 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="text-[11px] text-slate-300">Status</div>
                    <div className="mt-0.5 text-slate-100">
                      {activeTrip ? activeTrip.status : "No active ride"}
                    </div>
                  </div>
                </div>

                {/* Quick estimate preview */}
                {estimate ? (
                  <div className="rounded-xl border border-[#233358] bg-[#0b1735] px-3 py-2 text-xs text-slate-200">
                    Estimated fare:{" "}
                    <span className="font-semibold text-slate-50">
                      {fmtMoneyFromCents(estimate.fareCents)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openFareModal}
                  className="w-full rounded-lg bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white hover:bg-[#2563eb] disabled:opacity-60"
                  disabled={loading || estimateLoading || !canEstimate}
                >
                  {loading || estimateLoading ? "Loading..." : "Get estimate"}
                </button>

                <button
                  type="button"
                  onClick={handleScheduleRide}
                  className="w-full rounded-lg border border-[#1d4ed8] bg-transparent py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#1d4ed8]/10 disabled:opacity-60"
                  disabled={!canEstimate}
                >
                  Schedule ride
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom: history + upcoming */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#233358] bg-[#101a33] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-50">History</h3>
              <Link
                href="/rider/dashboard/my-rides"
                className="text-xs font-medium text-blue-400 hover:underline"
              >
                See All
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-[#233358] bg-[#0b1735] p-4 text-xs text-slate-300">
                No completed rides yet.
              </div>
            ) : (
              <div className="divide-y divide-[#233358] text-xs">
                {history.map((t) => (
                  <RideRow
                    key={t.id as any}
                    title={shortTitle((t as any).destinationAddress ?? "")}
                    address={(t as any).pickupAddress ?? ""}
                    right={fmtMoney((t as any).fare ?? 0)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#233358] bg-[#101a33] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-50">Upcoming ride</h3>
              <Link
                href="/rider/dashboard/my-rides"
                className="text-xs font-medium text-blue-400 hover:underline"
              >
                See All
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-[#233358] bg-[#0b1735] p-4 text-xs text-slate-300">
                No upcoming rides scheduled.
              </div>
            ) : (
              <div className="divide-y divide-[#233358] text-xs">
                {upcoming.map((t) => (
                  <RideRow
                    key={t.id as any}
                    title={shortTitle((t as any).destinationAddress ?? "")}
                    address={(t as any).pickupAddress ?? ""}
                    right={(t as any).scheduledFor ? fmtDate((t as any).scheduledFor) : "—"}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODALS */}
      {isFareModalOpen && (
        <FareEstimateModal
          onClose={closeFareModal}
          onBook={handleBookNow}
          estimate={estimate}
          loading={estimateLoading || bookLoading}
          error={estimateErr}
          pickupAddress={pickup?.label || ""}
          dropoffAddress={dropoff?.label || ""}
          tripTypeLabel={tripType === "round-trip" ? "Round trip" : "One-way"}
          dateTimeLabel={leaveAt ? leaveAt.toLocaleString() : "Now"}
        />
      )}

      {isBookingConfirmOpen && (
        <BookingConfirmationModal
          trip={bookedTrip}
          onClose={() => setIsBookingConfirmOpen(false)}
          onShare={handleShareFromConfirmation}
          onGoToRides={handleGoToMyRides}
        />
      )}

      {isShareModalOpen && currentTrip && (
        <ShareBookingModal tripId={currentTripId} onClose={closeShareModal} />
      )}

      {isDriverArrivalOpen && currentTrip && (
        <DriverArrivalModal
          trip={currentTrip}
          onClose={() => setIsDriverArrivalOpen(false)}
          onOpenQr={() => {
            setIsDriverArrivalOpen(false);
            setIsDriverQrOpen(true);
          }}
          onCancelRide={() => {
            setIsDriverArrivalOpen(false);
            setIsCancelFeedbackOpen(true);
          }}
          onStartTrip={() => {
            setIsDriverArrivalOpen(false);
            setIsInTripOpen(true);
          }}
          onOpenChat={() => {
            setIsDriverArrivalOpen(false);
            setIsChatOpen(true);
          }}
        />
      )}

      {isDriverQrOpen && currentTrip && (
        <DriverQrModal tripId={currentTripId} onClose={() => setIsDriverQrOpen(false)} />
      )}

      {/* ✅ FINAL FIX: CancelRideFeedbackModal requires tripId */}
      {isCancelFeedbackOpen && currentTrip && (
        <CancelRideFeedbackModal
          tripId={currentTripId}
          onClose={handleCloseCancelFeedback}
        />
      )}

      {isInTripOpen && (
        <InTripTrackingModal
          onClose={() => setIsInTripOpen(false)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          onShareTrip={() => {
            setShareReturnTo("inTrip");
            setIsShareModalOpen(true);
          }}
          onEndTrip={() => {
            setIsInTripOpen(false);
            setIsEndTripOpen(true);
          }}
        />
      )}

      {isEmergencyOpen && currentTrip && (
        <EmergencyAlertModal
          tripId={currentTripId}
          onClose={() => setIsEmergencyOpen(false)}
          onCallEmergency={() => {}}
        />
      )}

      {isEndTripOpen && currentTrip && (
        <EndTripConfirmationModal
          trip={currentTrip}
          onClose={() => setIsEndTripOpen(false)}
          onReportIssue={() => setIsEndTripOpen(false)}
          onRateDriver={() => {
            setIsEndTripOpen(false);
            setIsRateDriverOpen(true);
          }}
        />
      )}

      {isRateDriverOpen && (
        <RateDriverModal
          onClose={() => setIsRateDriverOpen(false)}
          onSubmit={(rating, feedback) => {
            console.log("Driver rating:", rating, feedback);
            setIsRateDriverOpen(false);
          }}
        />
      )}

      {isChatOpen && currentTrip && (
        <DriverChatModal
          tripId={currentTripId}
          meId={meId}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </RiderDashboardShell>
  );
}

/* ---------- Small row for history list ---------- */
function RideRow({ title, address, right }: { title: string; address: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
          <Image
            src="/fashion.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-50">{title}</div>
          <div className="text-[11px] text-slate-400">{address}</div>
        </div>
      </div>
      <div className="text-xs font-semibold text-slate-100">{right}</div>
    </div>
  );
}
