import React from "react";
import clsx from "clsx";
import Image from "next/image";
import { Button } from "../ui";
import { X, Share2 } from "lucide-react";

type ShareBookingModalProps = {
  onClose: () => void;
};

type ShareItem = {
  label: string;
  src: string;
  rounded?: boolean;
};

export function ShareBookingModal({ onClose }: ShareBookingModalProps) {
  // ✅ FIX: use React.MouseEvent instead of MouseEvent
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const shareItems: ShareItem[] = [
    { label: "iMessage", src: "/imessage.png" },
    { label: "Gmail", src: "/mail.png" },
    { label: "Clara", src: "/clara.png", rounded: true },
    { label: "Jane", src: "/jane.png", rounded: true },
    { label: "Maxwell", src: "/maxwell.png", rounded: true },
    { label: "Whatsapp", src: "/whatsapp.png" },
    { label: "Instagram", src: "/instagram.png" },
    { label: "Discord", src: "/discord.png" },
    { label: "X", src: "/x.png" },
    { label: "Facebook", src: "/facebook.png" },
  ];

  const handleCopy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          "https://example.com/booking/36451923"
        );
      } catch {
        // ignore copy errors
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#233358] bg-[#101a33] px-6 pb-5 pt-5 shadow-[0_24px_60px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-out animate-fadeIn"
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
        <div className="flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B63F4]/10">
            <Share2 className="h-5 w-5 text-[#0B63F4]" />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-50">
            Share your booking
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Send your booking details to friends or colleagues
          </div>
        </div>

        {/* Share icons grid */}
        <div className="mt-5 grid grid-cols-5 gap-x-4 gap-y-6 text-center text-[11px] text-slate-200">
          {shareItems.map((item) => (
            <div key={item.src} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center transition-transform hover:scale-105">
                <Image
                  src={item.src}
                  alt={item.label}
                  width={48}
                  height={48}
                  className={clsx(
                    "h-12 w-12 object-contain",
                    item.rounded && "rounded-full"
                  )}
                />
              </div>
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Copy link button */}
        <div className="mt-6">
          <Button
            type="button"
            onClick={handleCopy}
            className="h-10 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_16px_32px_rgba(0,0,0,0.6)] hover:bg-[#1a74ff] transition"
          >
            Copy booking link
          </Button>
        </div>
      </div>
    </div>
  );
}
