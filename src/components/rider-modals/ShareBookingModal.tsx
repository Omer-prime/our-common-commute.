"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import { Button } from "../ui";
import { X, Share2 } from "lucide-react";
import { getTripShareLink } from "../../lib/riderClient";

type ShareBookingModalProps = {
  onClose: () => void;
  tripId: string; // ✅ needed to fetch real share link
};

type ShareItem = {
  label: string;
  src: string;
  rounded?: boolean;
  kind:
    | "system" // use native share
    | "whatsapp"
    | "x"
    | "facebook"
    | "gmail"
    | "imessage"
    | "instagram"
    | "discord"
    | "copy";
};

function safeEncode(s: string) {
  return encodeURIComponent(s);
}

export function ShareBookingModal({ onClose, tripId }: ShareBookingModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const shareItems: ShareItem[] = useMemo(
    () => [
      { label: "iMessage", src: "/imessage.png", kind: "imessage" },
      { label: "Gmail", src: "/mail.png", kind: "gmail" },
      { label: "Whatsapp", src: "/whatsapp.png", kind: "whatsapp" },
      { label: "Instagram", src: "/instagram.png", kind: "instagram" },
      { label: "Discord", src: "/discord.png", kind: "discord" },
      { label: "X", src: "/x.png", kind: "x" },
      { label: "Facebook", src: "/facebook.png", kind: "facebook" },
      { label: "Share", src: "/share.png", kind: "system" }, // optional icon if you have it
    ],
    []
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getTripShareLink(tripId);
        if (!alive) return;

        setShareUrl(res.url);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load share link");
        setShareUrl("");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tripId]);

  const copyToClipboard = useCallback(async (text: string) => {
    // best effort
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallthrough
    }

    try {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
  }, [copyToClipboard, shareUrl]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;

    // Native share sheet (mobile)
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share) {
      try {
        await nav.share({
          title: "Booking Link",
          text: "Here’s my booking link:",
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled -> ignore
      }
    }

    // fallback -> copy
    await copyToClipboard(shareUrl);
  }, [copyToClipboard, shareUrl]);

  const openShareTarget = useCallback(
    async (kind: ShareItem["kind"]) => {
      if (!shareUrl) return;

      const url = shareUrl;
      const text = `Booking link: ${url}`;
      const encodedUrl = safeEncode(url);
      const encodedText = safeEncode(text);

      // Try native share if asked
      if (kind === "system") {
        await handleShare();
        return;
      }

      // These are best-effort; some platforms block or require apps installed
      let target: string | null = null;

      if (kind === "whatsapp") target = `https://wa.me/?text=${encodedText}`;
      if (kind === "x") target = `https://twitter.com/intent/tweet?text=${encodedText}`;
      if (kind === "facebook") target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      if (kind === "gmail") target = `mailto:?subject=${safeEncode("Booking Link")}&body=${encodedText}`;
      if (kind === "imessage") target = `sms:&body=${encodedText}`;

      // Instagram/Discord don’t have clean web share URLs; copy instead
      if (kind === "instagram" || kind === "discord") {
        await copyToClipboard(url);
        return;
      }

      if (target) window.open(target, "_blank", "noopener,noreferrer");
    },
    [copyToClipboard, handleShare, shareUrl]
  );

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

          {/* Status */}
          <div className="mt-3 w-full">
            {loading ? (
              <div className="rounded-lg border border-[#233358] bg-[#18213a] px-3 py-2 text-[11px] text-slate-300">
                Generating share link…
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {error}
              </div>
            ) : shareUrl ? (
              <div className="rounded-lg border border-[#233358] bg-[#18213a] px-3 py-2 text-[11px] text-slate-300">
                Link ready ✅
              </div>
            ) : null}
          </div>
        </div>

        {/* Share icons grid */}
        <div className="mt-5 grid grid-cols-5 gap-x-4 gap-y-6 text-center text-[11px] text-slate-200">
          {shareItems.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={loading || !shareUrl}
              onClick={() => openShareTarget(item.kind)}
              className={clsx(
                "flex flex-col items-center gap-2",
                (loading || !shareUrl) && "opacity-60 cursor-not-allowed"
              )}
            >
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
            </button>
          ))}
        </div>

        {/* Copy link button */}
        <div className="mt-6 space-y-2">
          <Button
            type="button"
            onClick={handleCopy}
            disabled={loading || !shareUrl}
            className="h-10 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_16px_32px_rgba(0,0,0,0.6)] hover:bg-[#1a74ff] transition disabled:opacity-60"
          >
            {loading ? "Loading…" : "Copy booking link"}
          </Button>

          <Button
            type="button"
            onClick={handleShare}
            disabled={loading || !shareUrl}
            className="h-10 w-full rounded-lg bg-[#151f3a] text-sm font-semibold text-slate-100 border border-[#233358] hover:bg-[#1e2944] transition disabled:opacity-60"
          >
            Share (system)
          </Button>
        </div>
      </div>
    </div>
  );
}
