"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, QrCode, RefreshCw, Copy } from "lucide-react";

import { Button } from "../ui";
import { getTripQr } from "../../lib/riderClient";
import Image from "next/image";

type DriverQrModalProps = {
  tripId: string;
  onClose: () => void;

  /** optional (if you saved it from /book response) */
  initialQrToken?: string;
  initialBookingId?: string | null;
};

export function DriverQrModal({
  tripId,
  onClose,
  initialQrToken,
  initialBookingId = null,
}: DriverQrModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const [qrToken, setQrToken] = useState<string | null>(initialQrToken ?? null);
  const [bookingId, setBookingId] = useState<string | null>(initialBookingId);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qrPayload = useMemo(() => {
    if (!qrToken) return null;
    return JSON.stringify({ tripId, bookingId, token: qrToken });
  }, [tripId, bookingId, qrToken]);

  const fetchToken = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await getTripQr(tripId); // ✅ backend re-issues token
      setQrToken(res.qrToken);
      setBookingId(res.bookingId);
    } catch (e: any) {
      setErr(e?.error ? String(e.error) : "Failed to load QR token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!qrToken) {
      fetchToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!qrPayload) return;
      try {
        const mod: any = await import("qrcode");
        const toDataURL =
          mod?.toDataURL ?? mod?.default?.toDataURL;

        if (typeof toDataURL !== "function") {
          throw new Error("qrcode.toDataURL missing");
        }

        const url = await toDataURL(qrPayload, {
          margin: 1,
          width: 180,
          errorCorrectionLevel: "M",
        });

        if (alive) setQrDataUrl(url);
      } catch {
        if (alive) setQrDataUrl(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [qrPayload]);

  const copyToken = async () => {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#233358] bg-[#101a33] px-6 pb-6 pt-5 text-center shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
          Driver Verification
        </div>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">Show this QR at pickup</h2>

        {err ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-[#233358] bg-[#0b1635] p-5 shadow-[0_10px_25px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative inline-flex items-center justify-center rounded-xl bg-[#101a33] p-3">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="Trip QR Code"
                  width={180}
                  height={180}
                  className="rounded-md object-contain"
                />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-md bg-[#0f1b3a] text-[11px] text-slate-400">
                  {loading ? "Generating..." : "QR not ready"}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Booking ID: <span className="font-mono text-slate-100">{bookingId ?? "—"}</span>
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={copyToken}
                disabled={!qrToken}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#233358] bg-[#101a33] px-3 py-2 text-[12px] text-slate-200 hover:bg-[#172444] disabled:opacity-60"
              >
                <Copy className="h-4 w-4" />
                Copy token
              </button>

              <button
                type="button"
                onClick={fetchToken}
                disabled={loading}
                className="flex items-center justify-center rounded-lg bg-[#18213a] px-3 py-2 text-slate-200 hover:bg-[#1f2742] disabled:opacity-60"
                title="Refresh QR"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <QrCode className="h-3.5 w-3.5 text-slate-400" />
          <span>Scan only once at your driver’s arrival</span>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
