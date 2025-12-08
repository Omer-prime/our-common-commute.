"use client";

import type { MouseEvent } from "react";
import { X } from "lucide-react";
import { Button } from "../ui";
import Image from "next/image";

type EndTripConfirmationModalProps = {
  onClose: () => void;
  onReportIssue?: () => void;
  onRateDriver: () => void;
};

export function EndTripConfirmationModal({
  onClose,
  onReportIssue,
  onRateDriver,
}: EndTripConfirmationModalProps) {
  const stop = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const handleReport = () => {
    if (onReportIssue) onReportIssue();
  };

  const handleRate = () => {
    onRateDriver();
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] text-center shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        {/* Header */}
        <div className="border-b border-[#233358] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
          End of trip confirmation
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
         
          </button>
        </div>

        {/* Icon + text */}
        <div className="px-6 pb-5 pt-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#18213a]">
            {/* If you have /ix_certificate-success-filled.png you can replace this with an Image */}
               <Image src="/success.png" alt="Close" width={16} height={16} />
            {/* <span className="text-lg">✔</span> */}
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-50">
            You&apos;ve arrived at Transcorp
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Did you reach your destination safely?
          </p>

          {/* Trip details */}
          <div className="mt-5 rounded-2xl border border-[#233358] bg-[#101a33] px-5 py-4 text-left text-xs text-slate-100">
            <div className="mb-3 text-[11px] font-medium text-slate-300">
              Trip details
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] text-slate-400">Date &amp; time</div>
                <div className="mt-0.5">12-11-25, 9:50 AM</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Trip type</div>
                <div className="mt-0.5">One-way</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Booking ID</div>
                <div className="mt-0.5">#36451923</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handleReport}
              className="h-11 w-full rounded-lg border border-[#233358] bg-transparent text-sm font-semibold text-slate-200 hover:bg-[#172444]"
            >
              Report an issue
            </Button>
            <Button
              type="button"
              onClick={handleRate}
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
            >
              Rate driver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
