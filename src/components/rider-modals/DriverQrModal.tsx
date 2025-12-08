import React from "react";
import { X, QrCode } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui";

type DriverQrModalProps = {
  onClose: () => void;
};

export function DriverQrModal({ onClose }: DriverQrModalProps) {
  // ✅ FIX: use React.MouseEvent instead of MouseEvent
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#233358] bg-[#101a33] px-6 pb-6 pt-5 text-center shadow-[0_30px_80px_rgba(0,0,0,0.95)] transition-transform duration-300 ease-out animate-fadeIn"
        onClick={stop}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Heading */}
        <div className="pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
          Driver Verification
        </div>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">
          Show this QR at pickup
        </h2>

        {/* QR card */}
        <div className="mt-5 rounded-2xl border border-[#233358] bg-[#0b1635] p-5 shadow-[0_10px_25px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative inline-flex items-center justify-center rounded-xl bg-[#101a33] p-3">
              <Image
                src="/Qr.png"
                alt="Trip QR Code"
                width={160}
                height={160}
                className="rounded-md shadow-[0_6px_20px_rgba(11,99,244,0.3)] object-contain"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-[#0B63F4]/5 to-transparent" />
            </div>

            <div className="text-xs text-slate-400">
              Booking ID:{" "}
              <span className="font-mono text-slate-100">#36451923</span>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <QrCode className="h-3.5 w-3.5 text-slate-400" />
          <span>Scan only once at your driver’s arrival</span>
        </div>

        {/* Button */}
        <div className="mt-5">
          <Button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff] transition"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
