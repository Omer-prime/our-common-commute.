"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import {
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Share2,
  Car,
  Star,
  X,
} from "lucide-react";
import { Button } from "../ui";

type InTripTrackingModalProps = {
  onClose: () => void;
  onOpenEmergency: () => void;
  onShareTrip: () => void;
  onEndTrip?: () => void;
};

export function InTripTrackingModal({
  onClose,
  onOpenEmergency,
  onShareTrip,
  onEndTrip,
}: InTripTrackingModalProps) {
  const stop = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        {/* Header / top label */}
        <div className="absolute left-0 right-0 top-4 flex items-center justify-center text-[11px] font-medium text-slate-200">
          <span className="rounded-full bg-[#091128]/90 px-3 py-1">
            In trip
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* MAP */}
        <div className="relative h-[260px] w-full bg-[#050817] sm:h-[320px]">
          <Image
            src="/rider-dashboard-map.png"
            alt="Trip in progress map"
            fill
            priority
            className="object-cover"
          />

          {/* Approximate time pill */}
          <div className="absolute left-1/2 top-6 -translate-x-1/2">
            <div className="rounded-xl bg-[#0b1430]/95 px-4 py-2 text-center shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-300">
                Approximate destination time
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                12 mins
              </div>
            </div>
          </div>

          {/* Car + destination marker path are baked into map asset in Figma;
              if you want, you can replace this with a custom illustration */}
        </div>

        {/* LOWER PANEL */}
        <div className="border-t border-[#233358] bg-[#0b1224] px-5 pb-4 pt-3 sm:px-6 sm:pt-4">
          {/* Pickup / destination */}
          <div className="rounded-2xl border border-[#233358] bg-[#101a33] px-4 py-3 text-xs text-slate-100">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                  <MapPin className="h-3 w-3 text-sky-400" />
                </span>
                <div>
                  <div className="text-[11px] text-slate-400">Pickup location</div>
                  <div>123 Main street, Springfield</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                  <MapPin className="h-3 w-3 text-emerald-300" />
                </span>
                <div>
                  <div className="text-[11px] text-slate-400">Destination</div>
                  <div>TechCorp office, 456 Business Ave</div>
                </div>
              </div>
            </div>
          </div>

          {/* DRIVER CARD */}
          <div className="mt-3 rounded-2xl border border-[#233358] bg-[#101a33] px-4 py-3 text-xs text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-500">
                  {/* Replace src with your driver avatar asset */}
                  <Image
                    src="/driver-ml.png"
                    alt="Driver avatar"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-50">M.L</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-300">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>4.6</span>
                    <span className="text-slate-500">(109 rides)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1e2944]">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1e2944]">
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1e2944]"
                  onClick={onShareTrip}
                  type="button"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Car details */}
            <div className="mt-4 border-t border-[#233358] pt-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-300">
                <Car className="h-3.5 w-3.5" />
                <span>Car details</span>
              </div>
              <div className="grid gap-3 text-[11px] text-slate-300 sm:grid-cols-4">
                <div>
                  <div className="text-slate-400">Car model</div>
                  <div className="mt-0.5 text-slate-100">Lexus ES350</div>
                </div>
                <div>
                  <div className="text-slate-400">License number</div>
                  <div className="mt-0.5 text-slate-100">GR-34645-GHE</div>
                </div>
                <div>
                  <div className="text-slate-400">Seats</div>
                  <div className="mt-0.5 text-slate-100">2</div>
                </div>
                <div>
                  <div className="text-slate-400">Color</div>
                  <div className="mt-0.5 text-slate-100">Red</div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onOpenEmergency}
              className="h-11 w-full rounded-lg border border-[#233358] bg-[#101a33] text-sm font-semibold text-slate-100 hover:bg-[#172444]"
            >
              <span className="flex items-center justify-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <span>SOS</span>
              </span>
            </Button>

            <Button
              type="button"
              onClick={onShareTrip}
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
            >
              Share trip
            </Button>
          </div>

          {onEndTrip && (
            <div className="mt-2 text-center text-[11px] text-slate-500">
              <button
                type="button"
                onClick={onEndTrip}
                className="text-xs font-medium text-slate-300 underline-offset-2 hover:underline"
              >
                End trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
