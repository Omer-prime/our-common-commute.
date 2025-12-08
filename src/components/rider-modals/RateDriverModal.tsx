"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui";
import clsx from "clsx";

type RateDriverModalProps = {
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
};

export function RateDriverModal({
  onClose,
  onSubmit,
}: RateDriverModalProps) {
  const stop = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, feedback.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#233358] px-6 py-3 text-[11px] font-medium text-slate-300">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-200 hover:bg-[#1e2944]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span>Rate driver</span>
          <span className="h-7 w-7" />
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-6 text-center">
          <h2 className="text-xl font-semibold text-slate-50">
            Rate your driver
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">
            Share your experience to help us maintain high-quality rides and
            reward great drivers.
          </p>

          {/* Driver info card */}
          <div className="mt-5 rounded-2xl bg-[#0f1830] px-6 py-5 text-slate-100">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-500">
                {/* Replace src with your avatar asset if you have one */}
                <Image
                  src="/driver-ml.png"
                  alt="Driver avatar"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover"
                />
              </div>
              <div className="text-sm font-semibold">M.L</div>
              <div className="flex items-center gap-1 text-[11px] text-slate-300">
                <MapPin className="h-3 w-3" />
                <span>Illinois, United States</span>
              </div>
            </div>

            {/* Stars */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => {
                const value = idx + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1"
                  >
                    <Star
                      className={clsx(
                        "h-6 w-6",
                        value <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-500"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Feedback textarea */}
            <div className="mt-5 rounded-xl border border-[#233358] bg-[#101a33] px-4 py-3 text-left">
              <label className="mb-1 block text-[11px] text-slate-400">
                Write your feedback <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share something about your ride..."
                className="mt-1 w-full resize-none border-none bg-transparent text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6">
            <Button
              type="button"
              onClick={handleSubmit}
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
            >
              Send feedback
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
