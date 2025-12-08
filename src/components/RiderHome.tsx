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
import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import { ChevronDown } from "lucide-react";
import { MobileTopSection } from "@/src/components/rider-home";

type TripType = "one-way" | "round-trip";

const historyItems = [
  {
    id: 1,
    title: "Fashion Store",
    address: "45, Jos Avenue 3A Crescent",
    amount: "$40.6",
  },
  {
    id: 2,
    title: "Home",
    address: "45, Jos Avenue 3A Crescent",
    amount: "$34.78",
  },
  {
    id: 3,
    title: "School",
    address: "45, Jos Avenue 3A Crescent",
    amount: "$16.00",
  },
  {
    id: 4,
    title: "Home",
    address: "45, Jos Avenue 3A Crescent",
    amount: "$34.78",
  },
];

const upcomingItems = [
  {
    id: 1,
    title: "Fashion Store",
    address: "45, Jos Avenue 3A Crescent",
    date: "23 Nov, 2025",
  },
  {
    id: 2,
    title: "Fashion Store",
    address: "45, Jos Avenue 3A Crescent",
    date: "23 Nov, 2025",
  },
  {
    id: 3,
    title: "Fashion Store",
    address: "45, Jos Avenue 3A Crescent",
    date: "23 Nov, 2025",
  },
  {
    id: 4,
    title: "Home",
    address: "45, Jos Avenue 3A Crescent",
    date: "23 Nov, 2025",
  },
];

export function RiderHome() {
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [recurring, setRecurring] = useState(true);

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

  const openFareModal = () => setIsFareModalOpen(true);
  const closeFareModal = () => setIsFareModalOpen(false);

  const handleBookNow = () => {
    setIsFareModalOpen(false);
    setIsBookingConfirmOpen(true);
  };

  const handleShareFromConfirmation = () => {
    setIsBookingConfirmOpen(false);
    setIsShareModalOpen(true);
  };

  const handleGoToMyRides = () => {
    setIsBookingConfirmOpen(false);
    setIsDriverArrivalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setIsDriverArrivalOpen(true);
  };

  const openDriverArrival = () => setIsDriverArrivalOpen(true);
  const closeDriverArrival = () => setIsDriverArrivalOpen(false);

  const openDriverQr = () => setIsDriverQrOpen(true);
  const closeDriverQr = () => setIsDriverQrOpen(false);

  const openCancelFeedback = () => setIsCancelFeedbackOpen(true);
  const closeCancelFeedback = () => setIsCancelFeedbackOpen(false);

  const handleSubmitCancelFeedback = () => {
    setIsCancelFeedbackOpen(false);
    setIsDriverArrivalOpen(false);
  };

  return (
    <RiderDashboardShell>
      <div className="space-y-5">
        {/* ===== MOBILE TOP SECTION (unchanged – keeps old mobile map) ===== */}
        <div className="lg:hidden">
          <MobileTopSection
            tripType={tripType}
            setTripType={setTripType}
            recurring={recurring}
            toggleRecurring={() => setRecurring((v) => !v)}
            openFareModal={openFareModal}
          />
        </div>

        {/* ========= DESKTOP/TABLET TOP: NEW MAP + FORM (FIGMA LAYOUT) ========= */}
        <section className="hidden rounded-2xl border border-[#233358] bg-[#050f25] p-5 lg:block lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
            {/* MAP COLUMN (desktop only) */}
            <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#233358] bg-[#0b1735]">
              <Image
                src="/new-map.png" // new desktop map asset
                alt="Route map"
                fill
                priority
                className="object-cover"
              />

              {/* Small map controls in top-right (icons you shared) */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex justify-end gap-2">
                  <div className="pointer-events-auto flex flex-col gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#243456]/90 shadow"
                    >
                      <Image
                        src="/arrow-head.png"
                        alt="Navigate"
                        width={16}
                        height={16}
                      />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#243456]/90 shadow"
                    >
                      <Image
                        src="/fashion.png"
                        alt="Center"
                        width={16}
                        height={16}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOOKING COLUMN */}
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-4">
                {/* Heading */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Hello Daniel, where would you like to go
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Choose your preferred destination
                  </p>
                </div>

                {/* Trip type toggle (One-way / Round trip) */}
                <div className="inline-flex w-full rounded-xl bg-[#101a33] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setTripType("one-way")}
                    className={`flex-1 rounded-lg py-2 font-medium ${
                      tripType === "one-way"
                        ? "bg-[#1d4ed8] text-white"
                        : "text-slate-300"
                    }`}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("round-trip")}
                    className={`flex-1 rounded-lg py-2 font-medium ${
                      tripType === "round-trip"
                        ? "bg-[#1d4ed8] text-white"
                        : "text-slate-300"
                    }`}
                  >
                    Round trip
                  </button>
                </div>

                {/* Booking rows */}
                <div className="space-y-3">
                  <BookingRow
                    icon={
                      <Image
                        src="/pickup.png"
                        alt="Pickup"
                        width={18}
                        height={18}
                        className="h-4 w-4 object-contain"
                      />
                    }
                    label="Pickup location"
                    value="Home"
                  />
                  <BookingRow
                    icon={
                      <Image
                        src="/work.png"
                        alt="Destination"
                        width={18}
                        height={18}
                        className="h-4 w-4 object-contain"
                      />
                    }
                    label="Destination"
                    value="Work"
                  />
                  <BookingRow
                    icon={
                      <Image
                        src="/leaving.png"
                        alt="Leave at"
                        width={18}
                        height={18}
                        className="h-4 w-4 object-contain"
                      />
                    }
                    label="Leave at"
                    value="23 Nov, 2025"
                    compact
                  />
                  {/* This row changes when Round trip is selected */}
                  <BookingRow
                    icon={
                      tripType === "round-trip" ? (
                        <Image
                          src="/leaving.png"
                          alt="Arrive at"
                          width={18}
                          height={18}
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <Image
                          src="/arrow-head.png"
                          alt="Time"
                          width={18}
                          height={18}
                          className="h-4 w-4 object-contain"
                        />
                      )
                    }
                    label={tripType === "round-trip" ? "Arrive at" : "Time"}
                    value={tripType === "round-trip" ? "23 Nov, 2025" : "09:15 AM"}
                    compact
                  />
                </div>

                {/* Make this recurring */}
                <div className="flex items-center justify-between rounded-xl bg-[#101a33] px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111e3c]">
                      <Image
                        src="/new-pin.png"
                        alt="Recurring"
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 object-contain"
                      />
                    </span>
                    <span className="text-[11px] font-medium text-slate-100">
                      Make this recurring
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecurring((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      recurring ? "bg-[#1d4ed8]" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        recurring ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Primary actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={openFareModal}
                  className="w-full rounded-lg bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white hover:bg-[#2563eb]"
                >
                  Get estimate
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-[#1d4ed8] bg-transparent py-2.5 text-sm font-semibold text-slate-100 hover:bg-[#1d4ed8]/10"
                >
                  Schedule ride
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========= BOTTOM: HISTORY + UPCOMING ========= */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* History */}
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
            <div className="divide-y divide-[#233358] text-xs">
              {historyItems.map((item) => (
                <RideRow
                  key={item.id}
                  title={item.title}
                  address={item.address}
                  right={item.amount}
                />
              ))}
            </div>
          </div>

          {/* Upcoming rides */}
          <div className="rounded-2xl border border-[#233358] bg-[#101a33] p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-50">
                Upcoming ride
              </h3>
              <Link
                href="/rider/dashboard/my-rides"
                className="text-xs font-medium text-blue-400 hover:underline"
              >
                See All
              </Link>
            </div>
            <div className="divide-y divide-[#233358] text-xs">
              {upcomingItems.map((item) => (
                <RideRow
                  key={item.id}
                  title={item.title}
                  address={item.address}
                  right={item.date}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ========= MODALS ========= */}

      {isFareModalOpen && (
        <FareEstimateModal onClose={closeFareModal} onBook={handleBookNow} />
      )}

      {isBookingConfirmOpen && (
        <BookingConfirmationModal
          onClose={() => setIsBookingConfirmOpen(false)}
          onShare={handleShareFromConfirmation}
          onGoToRides={handleGoToMyRides}
        />
      )}

      {isShareModalOpen && <ShareBookingModal onClose={closeShareModal} />}

      {isDriverArrivalOpen && (
        <DriverArrivalModal
          onClose={closeDriverArrival}
          onOpenQr={openDriverQr}
          onCancelRide={openCancelFeedback}
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

      {isDriverQrOpen && <DriverQrModal onClose={closeDriverQr} />}

      {isCancelFeedbackOpen && (
        <CancelRideFeedbackModal
          onClose={closeCancelFeedback}
          onSubmit={handleSubmitCancelFeedback}
        />
      )}

      {isInTripOpen && (
        <InTripTrackingModal
          onClose={() => setIsInTripOpen(false)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          onShareTrip={() => setIsShareModalOpen(true)}
          onEndTrip={() => {
            setIsInTripOpen(false);
            setIsEndTripOpen(true);
          }}
        />
      )}

      {isEmergencyOpen && (
        <EmergencyAlertModal
          onClose={() => setIsEmergencyOpen(false)}
          onCallEmergency={() => {
            // hook into native call / emergency flow later
          }}
        />
      )}

      {isEndTripOpen && (
        <EndTripConfirmationModal
          onClose={() => setIsEndTripOpen(false)}
          onReportIssue={() => {
            setIsEndTripOpen(false);
          }}
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

      {isChatOpen && <DriverChatModal onClose={() => setIsChatOpen(false)} />}
    </RiderDashboardShell>
  );
}

/* ---------- SHARED SMALL COMPONENTS ---------- */

type BookingRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
};

function BookingRow({ icon, label, value, compact }: BookingRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#233358] bg-[#1a2d51] px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
        {icon}
      </div>
      <div className="flex-1 text-xs">
        <div className="text-[11px] text-slate-300">{label}</div>
        <div className="mt-0.5 text-slate-100">{value}</div>
      </div>
      {!compact && (
        <button className="inline-flex items-center gap-1 rounded-md border border-[#233358] bg-[#101a33] px-3 py-[6px] text-[11px] text-slate-200">
          Home
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      )}
    </div>
  );
}

type RideRowProps = {
  title: string;
  address: string;
  right: string;
};

function RideRow({ title, address, right }: RideRowProps) {
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
