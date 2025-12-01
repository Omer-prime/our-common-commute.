"use client";

import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Bell,
  Star,
  ArrowUpRight,
} from "lucide-react";

/* ================= VIEW STATES ================= */

type ViewMode =
  | "details"
  | "preStart" // Destination + Start trip
  | "qr" // Scan QR code
  | "activeNav" // Turn left / Complete trip
  | "sosConfirm" // Emergency alert confirm
  | "tripSuccess" // Trip completed / Rate rider CTA
  | "cancelled"
  | "feedback"
  | "rateRider" // Rate your rider
  | "notifications" // Notification center
  | "chat"; // In-trip chat with rider

/* ================= CHAT TYPES ================= */

type ChatSender = "driver" | "rider";

type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  time: string; // e.g. "11:55 AM"
  status?: "sent" | "delivered" | "seen";
};

// Static seed data just to mirror the UI design.
// Backend can later replace this with real messages from API / websockets.
const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "rider",
    text: "Hello?",
    time: "11:55 AM",
    status: "seen",
  },
  {
    id: "2",
    sender: "driver",
    text: "How may I be of help ?",
    time: "11:56 AM",
    status: "seen",
  },
  {
    id: "3",
    sender: "rider",
    text: "I’m currently waiting for you at the beach beside Rain Cover Avenue",
    time: "11:57 AM",
    status: "seen",
  },
  {
    id: "4",
    sender: "driver",
    text: "Thanks for reaching out, we’ll be there shortly.",
    time: "11:58 AM",
    status: "seen",
  },
  {
    id: "5",
    sender: "driver",
    text: "Also, can you send us a picture so I can confirm the location",
    time: "11:59 AM",
    status: "delivered",
  },
  {
    id: "6",
    sender: "rider",
    text: "Of course! I will send now",
    time: "11:55 AM",
    status: "sent",
  },
];

/* ================= PAGE ================= */

export default function RiderDetailsPage() {
  const [view, setView] = useState<ViewMode>("details");
  const router = useRouter();

  return (
    <DriverDashboardShell>
      <div className="relative space-y-6">
        {/* Header with back button + notifications */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-semibold text-slate-100">
              Rider details
            </h1>
          </div>

          {/* Notifications trigger (driver can open notifications from here) */}
          <button
            type="button"
            onClick={() => setView("notifications")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>

        {/* ===== MAIN DETAILS CONTENT ===== */}
        <div className="mx-auto mt-4 flex max-w-3xl flex-col gap-6 pb-10">
          {/* Rider header */}
          <section className="flex flex-col items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              <Image
                src="/rider-io.png"
                alt="I.O"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-50">
                <span>I.O</span>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                  ✓
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Illinois, United States
              </div>
            </div>

            {/* Action icons row */}
            <div className="mt-2 flex items-center gap-3">
              <RoundIconButton
                ariaLabel="Chat with rider"
                onClick={() => setView("chat")}
              >
                <MessageCircle className="h-4 w-4" />
              </RoundIconButton>
              <RoundIconButton ariaLabel="Call rider">
                <Phone className="h-4 w-4" />
              </RoundIconButton>
              <RoundIconButton ariaLabel="View pickup location">
                <MapPin className="h-4 w-4" />
              </RoundIconButton>
            </div>
          </section>

          {/* Stats row */}
          <section className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-center text-xs text-slate-200 sm:grid-cols-4">
            <StatBox label="Ratings" value="4.7" />
            <StatBox label="Total Trips" value="359" />
            <StatBox label="Years of Exp" value="5" />
            <StatBox label="Reviews" value="205" />
          </section>

          {/* Distance + fare + route */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Distance</span>
              <span className="text-sm font-semibold text-slate-50">
                13 km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ride Fare</span>
              <span className="text-sm font-semibold text-slate-50">
                $21
              </span>
            </div>

            <div className="mt-3 space-y-2 rounded-xl bg-[#07152f] px-3 py-3">
              <RouteRow
                label="Pickup"
                text="4517 Washington Ave, Manchester..."
              />
              <RouteRow
                label="Drop-off"
                text="2118 Thornridge Cir, Syracuse..."
              />
            </div>
          </section>

          {/* Go to navigation – switches view */}
          <button
            type="button"
            onClick={() => setView("preStart")}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to navigation
          </button>
        </div>

        {/* ===== OVERLAYS ===== */}
        {view === "preStart" && (
          <PreStartOverlay
            onClose={() => setView("details")}
            onStartTrip={() => setView("qr")}
          />
        )}

        {view === "qr" && (
          <QrOverlay
            onBack={() => setView("preStart")}
            onStartNavigation={() => setView("activeNav")}
          />
        )}

        {view === "activeNav" && (
          <ActiveNavigationOverlay
            onClose={() => setView("details")}
            onCancelTrip={() => setView("cancelled")}
            onCompleteTrip={() => setView("tripSuccess")}
            onOpenSos={() => setView("sosConfirm")}
          />
        )}

        {view === "sosConfirm" && (
          <EmergencyAlertOverlay
            onCancel={() => setView("activeNav")}
            onConfirm={() => {
              // TODO: call SOS / emergency API from here
              setView("activeNav");
            }}
          />
        )}

        {view === "tripSuccess" && (
          <TripSuccessOverlay
            onRate={() => setView("rateRider")}
            onLater={() => setView("details")}
          />
        )}

        {view === "cancelled" && (
          <CancelledOverlay
            onClose={() => setView("details")}
            onBackToNav={() => setView("activeNav")}
            onOpenFeedback={() => setView("feedback")}
          />
        )}

        {view === "feedback" && (
          <FeedbackOverlay
            onBackToCancelled={() => setView("cancelled")}
            onDone={() => setView("details")}
          />
        )}

        {view === "rateRider" && (
          <RateRiderOverlay onClose={() => setView("details")} />
        )}

        {view === "notifications" && (
          <NotificationsOverlay onClose={() => setView("details")} />
        )}

        {view === "chat" && (
          <ChatOverlay
            onClose={() => setView("details")}
            // later: you can pass riderId / tripId here
          />
        )}
      </div>
    </DriverDashboardShell>
  );
}

/* ---------- Small reusable pieces ---------- */

function RoundIconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
    >
      {children}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-[#07152f] px-3 py-3">
      <div className="text-sm font-semibold text-slate-50">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

function RouteRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 h-3 w-3 rounded-full border border-blue-400 bg-blue-500" />
      <div>
        <div className="text-[11px] font-medium text-slate-300">
          {label}
        </div>
        <div className="text-[11px] text-slate-400">{text}</div>
      </div>
    </div>
  );
}

/* ================= SHARED MAP WITH OVERLAYS ================= */

type MapVariant = "destination" | "turn" | "distance";

function MapWithOverlays({
  dimmed = false,
  variant = "destination",
  showAlert = false,
  onAlertClick,
}: {
  dimmed?: boolean;
  variant?: MapVariant;
  showAlert?: boolean;
  onAlertClick?: () => void;
}) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden bg-[#050f25] sm:h-[400px] md:h-[430px]">
      {/* Base map */}
      <Image
        src="/driver/Map.png"
        alt="Navigation map"
        fill
        className={`object-cover ${dimmed ? "opacity-70" : "opacity-90"}`}
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0">
        {/* Top bubble */}
        {variant === "destination" && (
          <div className="absolute left-1/2 top-[11%] flex -translate-x-1/2 flex-col items-center">
            <div className="rounded-2xl bg-[#07152f]/95 px-5 py-2 text-center text-xs text-slate-100 shadow-lg">
              <div className="text-[11px] font-semibold">Destination</div>
              <div className="text-[10px] text-slate-400">
                210 Cross road junction
              </div>
            </div>
          </div>
        )}

        {variant === "turn" && (
          <div className="absolute left-1/2 top-[11%] flex -translate-x-1/2 flex-col items-center">
            <div className="rounded-2xl bg-[#07152f]/95 px-5 py-2 text-center text-xs text-slate-100 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/10">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                </span>
                <span>Turn left in 6th Avenue Cross way</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                18 miles ahead
              </div>
            </div>
          </div>
        )}

        {variant === "distance" && (
          <div className="absolute left-1/2 top-[11%] flex -translate-x-1/2 flex-col items-center">
            <div className="rounded-2xl bg-[#07152f]/95 px-5 py-2 text-center text-xs text-slate-100 shadow-lg">
              <div className="text-[11px] font-semibold">
                2 meter to right
              </div>
              <div className="text-[10px] text-slate-400">
                210 Cross road junction
              </div>
            </div>
          </div>
        )}

        {/* Destination / passenger pin */}
        <Image
          src="/driver/nav-destination-pin.png"
          alt="Destination"
          width={40}
          height={40}
          className="pointer-events-none absolute right-[22%] top-[22%]"
        />

        {/* Vertical route beam */}
        <div className="pointer-events-none absolute left-1/2 top-[24%] bottom-[18%] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-400 via-indigo-500/80 to-indigo-500/0" />

        {/* Horizontal beam from center to destination pin */}
        <div className="pointer-events-none absolute left-1/2 top-[24%] h-[3px] w-[22%] rounded-full bg-gradient-to-r from-indigo-500/85 via-indigo-500/70 to-indigo-500/0" />

        {/* Arrow / car position */}
        <Image
          src="/driver/nav-arrow.png"
          alt="Car position"
          width={56}
          height={56}
          className="pointer-events-none absolute left-1/2 bottom-[14%] -translate-x-1/2"
        />

        {/* RED ALERT ICON (clickable) */}
        {showAlert && (
          <button
            type="button"
            onClick={onAlertClick}
            className="pointer-events-auto absolute bottom-[2%] right-[3%] flex h-[52px] w-[52px] items-center justify-center"
          >
            <div className="relative h-[52px] w-[52px]">
              <Image
                src="/driver/alert-dot.png"
                alt="Alert"
                fill
                className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Image
                  src="/driver/alert-icon.png"
                  alt="Alert icon"
                  width={24}
                  height={24}
                />
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

/* ================= MAP FOR TRIP SUCCESS (GREEN PATH) ================= */

function SuccessMap() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden bg-[#050f25] sm:h-[400px] md:h-[430px]">
      <Image
        src="/driver/Map.png"
        alt="Navigation map"
        fill
        className="object-cover opacity-90"
      />

      <div className="pointer-events-none absolute inset-0">
        {/* Green success bubble */}
        <div className="absolute left-1/2 top-[11%] flex -translate-x-1/2 flex-col items-center">
          <div className="rounded-2xl bg-[#16a34a] px-5 py-2 text-center text-xs text-white shadow-lg">
            <div className="text-[11px] font-semibold">
              You&apos;ve arrived at the destination
            </div>
            <div className="text-[10px] opacity-85">Success</div>
          </div>
        </div>

        {/* Green vertical beam */}
        <div className="absolute left-1/2 top-[24%] bottom-[18%] w-[6px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-500/0" />

        {/* Green horizontal beam */}
        <div className="absolute left-1/2 top-[24%] h-[6px] w-[22%] rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500/0" />

        {/* Green arrow at destination */}
        <Image
          src="/driver/nav-success-arrow.png"
          alt="Arrived"
          width={54}
          height={54}
          className="absolute right-[19%] top-[21%]"
        />

        {/* Red alert icon */}
        <div className="absolute bottom-[2%] right-[3%] flex h-[52px] w-[52px] items-center justify-center">
          <div className="relative h-[52px] w-[52px]">
            <Image
              src="/driver/alert-dot.png"
              alt="Alert"
              fill
              className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Image
                src="/driver/alert-icon.png"
                alt="Alert icon"
                width={24}
                height={24}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PRE-START OVERLAY (Destination + Start trip) ================= */

type PreStartOverlayProps = {
  onClose: () => void;
  onStartTrip: () => void;
};

function PreStartOverlay({ onClose, onStartTrip }: PreStartOverlayProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify	center bg-black/50 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <MapWithOverlays variant="destination" />

        <div className="border-t border-slate-800 bg-[#020818] px-4 pb-4 pt-3 text-xs text-slate-200">
          <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
            <span>Passenger&apos;s pickup</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-900"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            onClick={onStartTrip}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start trip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= QR OVERLAY (Scan QR code) ================= */

type QrOverlayProps = {
  onBack: () => void;
  onStartNavigation: () => void;
};

function QrOverlay({ onBack, onStartNavigation }: QrOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let stream: MediaStream;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          (videoRef.current as any).srcObject = stream;
          videoRef.current
            .play()
            .catch(() => setError("Unable to start camera preview."));
        }
      })
      .catch(() => {
        setError("Camera not available. Please check browser permissions.");
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Scan QR code</span>
          <span className="h-7 w-7" />
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-6 text-center text-xs text-slate-200">
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-50">
              Scan QR code
            </div>
            <p className="text-[11px] text-slate-400">
              Scan the QR code on the rider&apos;s phone to start trip.
            </p>
          </div>

          <div className="relative mx-auto h-64 w-full max-w-xs overflow-hidden rounded-3xl bg-black">
            {error ? (
              <div className="flex h-full w-full items-center justify-center px-3 text-[11px] text-slate-300">
                {error}
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/70" />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onStartNavigation}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start trip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= ACTIVE NAVIGATION OVERLAY ================= */

type ActiveNavOverlayProps = {
  onClose: () => void;
  onCancelTrip: () => void;
  onCompleteTrip: () => void;
  onOpenSos: () => void;
};

function ActiveNavigationOverlay({
  onClose,
  onCancelTrip,
  onCompleteTrip,
  onOpenSos,
}: ActiveNavOverlayProps) {
  return (
    <div className="fixed inset-0 z-35 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <MapWithOverlays variant="turn" showAlert onAlertClick={onOpenSos} />

        <div className="border-t border-slate-800 bg-[#020818] px-4 pb-5 pt-4 text-xs text-slate-200">
          <div className="mb-3 text-center text-[11px] text-slate-400">
            Drop-off location
          </div>

          <div className="mb-3 rounded-xl bg-[#07152f] px-3 py-2 text-[11px] text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3 w-3 text-amber-400" />
              <span>2118 Thornridge Cir, Syracuse, Connecticut 3...</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onCompleteTrip}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Complete trip
            </button>
            <button
              type="button"
              onClick={onCancelTrip}
              className="w-full rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Cancel trip
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ================= EMERGENCY ALERT OVERLAY ================= */

type EmergencyAlertOverlayProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function EmergencyAlertOverlay({
  onCancel,
  onConfirm,
}: EmergencyAlertOverlayProps) {
  return (
    <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="relative">
          <MapWithOverlays variant="distance" dimmed />
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 border-t border-slate-800 bg-[#020818] px-6 py-6 text-center text-xs text-slate-200">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-500 bg-[#07152f]">
            <span className="text-base font-semibold">!</span>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">
              Confirm emergency alert
            </div>
            <p className="text-[11px] text-slate-400">
              Are you sure you want to send alert to your
              <br />
              friends and police.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Yes, confirm alert
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= TRIP SUCCESS OVERLAY ================= */

type TripSuccessOverlayProps = {
  onRate: () => void;
  onLater: () => void;
};

function TripSuccessOverlay({ onRate, onLater }: TripSuccessOverlayProps) {
  return (
    <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="relative">
          <SuccessMap />
          <button
            type="button"
            onClick={onLater}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 border-t border-slate-800 bg-[#020818] px-6 py-6 text-center text-xs text-slate-200">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#07152f]">
            <span className="text-base font-semibold">✓</span>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">
              Trip successful
            </div>
            <p className="text-[11px] text-slate-400">
              You&apos;ve completed the trip. Kindly rate the
              <br />
              rider.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onRate}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Rate rider
            </button>
            <button
              type="button"
              onClick={onLater}
              className="w-full rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              No, Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= CANCELLED OVERLAY ================= */

type CancelOverlayProps = {
  onClose: () => void;
  onBackToNav: () => void;
  onOpenFeedback: () => void;
};

function CancelledOverlay({
  onClose,
  onBackToNav,
  onOpenFeedback,
}: CancelOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="relative">
          <MapWithOverlays dimmed variant="turn" />
          <button
            type="button"
            onClick={onBackToNav}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 border-t border-slate-800 bg-[#020818] px-6 py-6 text-center text-xs text-slate-200">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#07152f]">
            <span className="text-base font-semibold">✕</span>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">
              You&apos;ve cancelled the ride
            </div>
            <p className="text-[11px] text-slate-400">
              Help us improve your experience by letting us know the
              reason for cancelling this ride.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onOpenFeedback}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit feedback
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= FEEDBACK OVERLAY ================= */

type FeedbackOverlayProps = {
  onBackToCancelled: () => void;
  onDone: () => void;
};

const FEEDBACK_OPTIONS = [
  "I want to change details of this journey",
  "The driver took long than expected",
  "Wrong address",
  "I don’t want the journey",
  "Driver denied coming to pickup",
  "Others",
];

function FeedbackOverlay({
  onBackToCancelled,
  onDone,
}: FeedbackOverlayProps) {
  const [selected, setSelected] = useState<string[]>([FEEDBACK_OPTIONS[0]]);
  const [otherReason, setOtherReason] = useState("");

  const toggleOption = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const handleSubmit = () => {
    // TODO: send `selected` + `otherReason` to backend
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onBackToCancelled}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Submit feedback</span>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 px-8 py-6 text-xs text-slate-200">
          <div className="flex justify-center">
            <Image
              src="/driver/feedback-icon.png"
              alt="Feedback"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>

          <div className="space-y-1 text-center">
            <div className="text-base font-semibold text-slate-50">
              Tell us why you
              <br />
              cancelled the ride
            </div>
            <p className="text-[11px] text-slate-400">
              Help us improve your experience by
              <br />
              letting us know the reason for cancelling this ride.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl bg-[#07152f] px-4 py-4">
            {FEEDBACK_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className="flex w-full items-center gap-3 text-left text-[11px] text-slate-200"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    selected.includes(option)
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-500 bg-transparent"
                  }`}
                >
                  {selected.includes(option) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-[#07152f] px-4 py-2">
            <input
              type="text"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Other reasons"
              className="w-full border-none bg-transparent text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= RATE RIDER OVERLAY ================= */

type RateRiderOverlayProps = {
  onClose: () => void;
};

function RateRiderOverlay({ onClose }: RateRiderOverlayProps) {
  const [rating, setRating] = useState<number>(4);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    // TODO: send rating + text to backend
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <span className="text-[11px] font-medium">Submit feedback</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>

        <div className="space-y-5 px-8 py-6 text-xs text-slate-200">
          {/* Title */}
          <div className="space-y-1 text-center">
            <div className="text-base font-semibold text-slate-50">
              Rate your rider
            </div>
            <p className="text-[11px] text-slate-400">
              Share your experience to help us maintain high-quality rides and
              reward great riders.
            </p>
          </div>

          {/* Card */}
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#07152f] px-6 py-6">
            {/* Avatar */}
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-700">
              <Image
                src="/rider-io.png"
                alt="Rider avatar"
                fill
                className="object-cover"
              />
            </div>

            {/* Name + location */}
            <div className="space-y-0.5 text-center">
              <div className="text-sm font-semibold text-slate-50">
                Wilson Ezekiel
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span>Illinois, United States</span>
              </div>
            </div>

            {/* Stars */}
            <div className="mt-2 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const active = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="text-yellow-400"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        active ? "text-yellow-400" : "text-slate-500"
                      }`}
                      fill={active ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>

            {/* Feedback input */}
            <div className="mt-3 w-full rounded-xl border border-slate-700 bg-[#050f25] px-4 py-2 text-left">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Write your feedback (Optional)"
                className="w-full resize-none border-none bg-transparent text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= NOTIFICATIONS OVERLAY ================= */

type NotificationsOverlayProps = {
  onClose: () => void;
};

type SimpleNotification = {
  id: number;
  title: string;
  body: string;
};

const TODAY_NOTIFS: SimpleNotification[] = [
  {
    id: 1,
    title: "Payment success",
    body: "You just made a payment for taxi",
  },
  {
    id: 2,
    title: "New services are now available",
    body: "You can now track your drivers",
  },
  {
    id: 3,
    title: "New services are now available",
    body: "You can now track your drivers",
  },
];

const YESTERDAY_NOTIFS: SimpleNotification[] = [
  {
    id: 4,
    title: "Payment success",
    body: "You just made a payment for taxi",
  },
  {
    id: 5,
    title: "New services are now available",
    body: "You can now track your drivers",
  },
  {
    id: 6,
    title: "New services are now available",
    body: "You can now track your drivers",
  },
];

function NotificationsOverlay({ onClose }: NotificationsOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <span className="text-[11px] font-medium">Notifications</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <NotificationSection label="Today" items={TODAY_NOTIFS} />
          <NotificationSection label="Yesterday" items={YESTERDAY_NOTIFS} />
        </div>
      </div>
    </div>
  );
}

function NotificationSection({
  label,
  items,
}: {
  label: string;
  items: SimpleNotification[];
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#07152f]/60 px-4 py-4">
      <div className="mb-3 text-[11px] font-medium text-slate-400">
        {label}
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#050f25] px-4 py-3 text-left hover:bg-[#0b1b3a]"
          >
            {/* Small blue icon bullet */}
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/15">
              <div className="h-3 w-3 rounded-full bg-blue-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-100">
                {n.title}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {n.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= CHAT OVERLAY ================= */

type ChatOverlayProps = {
  onClose: () => void;
};

function ChatOverlay({ onClose }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_CHAT_MESSAGES,
  );
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Always scroll to bottom when a new message is added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const value = draft.trim();
    if (!value) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      sender: "driver",
      text: value,
      time,
      status: "sent",
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");

    // TODO: send `newMessage` to backend (REST / websocket) here
  };

  const handleSubmitForm: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-[#020818] shadow-2xl">
        {/* Optional right-side info for desktop */}
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#050f25] px-5 py-6 text-xs text-slate-200 md:flex">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700">
              <Image
                src="/rider-io.png"
                alt="Rider avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-50">
                <span>I.O</span>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
                  ✓
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Online</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-[#07152f] px-4 py-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pickup</span>
              <span className="text-slate-100">13 km</span>
            </div>
            <div className="h-px bg-slate-800/70" />
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-400">Location</div>
              <div className="text-slate-100">
                4517 Washington Ave, Manchester...
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-auto w-full rounded-lg border border-slate-700 bg-transparent py-2.5 text-[11px] font-medium text-slate-200 hover:bg-slate-900"
          >
            Close chat
          </button>
        </aside>

        {/* Chat column */}
        <section className="flex h-[520px] flex-1 flex-col bg-gradient-to-b from-[#050f25] to-[#020818] md:h-[560px]">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a] md:hidden"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>

              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-700">
                <Image
                  src="/rider-io.png"
                  alt="Rider avatar"
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-50">
                  <span>I.O</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Desktop close button */}
            <button
              type="button"
              onClick={onClose}
              className="hidden h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a] md:inline-flex"
            >
              <span className="text-xs">✕</span>
            </button>
          </header>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs text-slate-100"
          >
            <div className="mb-2 flex justify-center">
              <span className="rounded-full bg-[#050f25] px-3 py-1 text-[10px] text-slate-400">
                Today...
              </span>
            </div>

            {messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
          </div>

          {/* Input */}
          <footer className="border-t border-slate-800 bg-[#050f25]/80 px-4 py-3">
            <form onSubmit={handleSubmitForm}>
              <div className="flex items-center gap-2 rounded-2xl bg-[#020818] px-3 py-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message"
                  className="flex-1 border-none bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isDriver = message.sender === "driver";

  return (
    <div
      className={`flex w-full ${
        isDriver ? "justify-end" : "justify-start"
      }`}
    >
      <div className="max-w-[75%] space-y-1">
        <div
          className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
            isDriver
              ? "rounded-br-sm bg-blue-600 text-white"
              : "rounded-bl-sm bg-[#07152f] text-slate-100"
          }`}
        >
          {message.text}
        </div>
        <div
          className={`flex items-center gap-1 text-[9px] ${
            isDriver ? "justify-end text-slate-300/80" : "text-slate-500"
          }`}
        >
          <span>{message.time}</span>
          {isDriver && message.status && (
            <span className="text-[8px]">
              {message.status === "seen"
                ? "✓✓"
                : message.status === "delivered"
                ? "✓✓"
                : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
