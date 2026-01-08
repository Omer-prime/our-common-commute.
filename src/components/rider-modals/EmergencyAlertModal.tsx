"use client";

import React, { useState } from "react";
import { ArrowLeft, Bell, PhoneCall } from "lucide-react";
import { Button } from "../ui";
import Image from "next/image";
import { sos } from "../../lib/riderClient";

type EmergencyAlertModalProps = {
  tripId: string;
  onClose: () => void;
  onCallEmergency?: () => void;
};

const contacts = ["Andrew Talks", "Shenaya", "Cynthia", "John", "Owen"];

export function EmergencyAlertModal({ tripId, onClose, onCallEmergency }: EmergencyAlertModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleCall = async () => {
    setErr(null);
    setLoading(true);
    try {
      await sos(tripId); // ✅ backend creates EmergencyAlert
      setOk(true);
      onCallEmergency?.();
    } catch (e: any) {
      setErr(e?.error ? String(e.error) : "Failed to trigger SOS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        <div className="flex items-center justify-between border-b border-[#233358] px-6 py-3 text-[11px] font-medium text-slate-300">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-200 hover:bg-[#1e2944]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span>Emergency</span>
          <span className="h-7 w-7" />
        </div>

        <div className="px-6 pb-5 pt-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#18213a]">
            <Image src={"/emergency-bell.png"} alt="Emergency Bell" width={36} height={36} />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-slate-50">Emergency Alert</h2>
          <p className="mt-1 text-[12px] text-slate-400">
            {ok ? "SOS sent to the system." : "Trigger SOS to notify the system."}
          </p>

          {err ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[#233358] bg-[#101a33] text-left">
            <div className="border-b border-[#233358] px-5 py-3 text-[12px] font-medium text-slate-300">
              Your friends have been notified
            </div>
            <div className="divide-y divide-[#233358]">
              {contacts.map((name) => (
                <div key={name} className="flex items-center justify-between px-5 py-3 text-[13px] text-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-semibold text-white">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span>{name}</span>
                  </div>
                  <Bell className="h-4 w-4 text-sky-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              onClick={handleCall}
              disabled={loading}
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
            >
              <span className="flex items-center justify-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <span>{loading ? "Sending SOS..." : "Call 911"}</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
