"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui";
import { cancelTrip } from "../../lib/riderClient";

type CancelRideFeedbackModalProps = {
  tripId: string;
  onClose: () => void;
  onSubmitted?: () => void; // success callback
};

const cancelReasons = [
  "I want to change details of this journey",
  "The driver took long than expected",
  "Wrong address",
  "I don't want the journey",
  "Driver denied coming to pickup",
  "Others",
];

export function CancelRideFeedbackModal({ tripId, onClose, onSubmitted }: CancelRideFeedbackModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const [selected, setSelected] = useState<string[]>([cancelReasons[0]]);
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleReason = (reason: string) => {
    setSelected((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  };

  const payload = useMemo(() => {
    const reasons = selected.length ? selected : ["Others"];
    const other = otherReason.trim();
    return {
      reasons,
      otherReason: other ? other : undefined,
    };
  }, [selected, otherReason]);

  const handleSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await cancelTrip(tripId, payload);
      onSubmitted?.();
      onClose();
    } catch (e: any) {
      setErr(e?.error ? String(e.error) : "Failed to cancel trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        {/* Header */}
        <div className="border-b border-[#233358] px-6 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Submit feedback</div>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18213a]">
            <Image src="/cancel-feedback-icon.png" alt="Feedback icon" width={48} height={48} />
          </div>

          <h2 className="mt-4 text-lg font-semibold leading-snug text-slate-50">
            Tell us why you
            <br className="hidden sm:block" /> cancelled the ride
          </h2>

          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
            Help us improve your experience by letting us know the reason for cancelling this ride.
          </p>

          {err ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {err}
            </div>
          ) : null}

          {/* Reasons list */}
          <div className="mt-6 overflow-hidden rounded-xl border border-[#233358] bg-[#18213a] text-left">
            {cancelReasons.map((reason, idx) => {
              const isSelected = selected.includes(reason);
              return (
                <button
                  type="button"
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-5 py-3 text-left text-[13px] text-slate-100",
                    idx !== cancelReasons.length - 1 && "border-b border-[#233358]",
                    isSelected && "bg-[#1b2950]"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      isSelected ? "border-[#0B63F4] bg-[#0B63F4]" : "border-slate-500 bg-transparent"
                    )}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{reason}</span>
                </button>
              );
            })}
          </div>

          {/* Other reasons field */}
          <div className="mt-3 rounded-xl border border-[#233358] bg-[#18213a] px-4 py-3 text-left">
            <textarea
              rows={3}
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Other reasons"
              className="w-full resize-none border-none bg-transparent text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Footer button */}
        <div className="border-t border-[#233358] bg-[#101a33] px-6 py-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
