"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Send, X } from "lucide-react";
import { getTripChat, sendTripChat, type TripMessageDTO } from "../../lib/riderClient";

type DriverChatModalProps = {
  tripId: string;
  meId: string;
  onClose: () => void;

  driverName?: string;
  driverAvatarSrc?: string; // optional
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function DriverChatModal({
  tripId,
  meId,
  onClose,
  driverName = "Driver",
  driverAvatarSrc = "/maxwell.png",
}: DriverChatModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const [messages, setMessages] = useState<TripMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getTripChat(tripId);
        if (!alive) return;
        setMessages(res.messages);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.error ? String(e.error) : "Failed to load chat");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await sendTripChat(tripId, text);
      setMessages((prev) => [...prev, res.message]);
      setInput("");
    } catch (e: any) {
      setErr(e?.error ? String(e.error) : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const rendered = useMemo(() => {
    return messages.map((m) => {
      const isMe = m.senderId === meId;
      return {
        ...m,
        isMe,
        time: formatTime(m.createdAt),
      };
    });
  }, [messages, meId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-[#233358] bg-[#050817] shadow-[0_30px_80px_rgba(0,0,0,0.95)] sm:h-[640px]"
        onClick={stop}
      >
        {/* HEADER */}
        <div className="flex items-center border-b border-[#233358] bg-[#101a33] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-500">
              <Image src={driverAvatarSrc} alt="Driver avatar" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-50">{driverName}</span>
              <span className="text-[11px] text-emerald-400">● Online</span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#050817] px-4 py-3">
          <div className="my-2 text-center text-[11px] text-slate-500">Today...</div>

          {loading ? (
            <div className="text-center text-[12px] text-slate-400">Loading chat...</div>
          ) : null}

          {err ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {err}
            </div>
          ) : null}

          {rendered.map((m) => {
            const align = m.isMe ? "justify-end" : "justify-start";
            const bubbleColor = m.isMe ? "bg-[#0B63F4] text-white" : "bg-[#18213a] text-slate-100";
            const radius = m.isMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm";

            return (
              <div key={m.id} className={`flex w-full ${align}`}>
                <div className="max-w-[80%]">
                  <div className={`${bubbleColor} ${radius} inline-block px-3 py-2 text-[13px] leading-relaxed`}>
                    {m.text}
                  </div>
                  <div className={`mt-1 text-[10px] text-slate-500 ${m.isMe ? "text-right" : "text-left"}`}>
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-[#233358] bg-[#050817] px-3 py-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[#101a33] px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message"
              className="flex-1 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B63F4] text-white hover:bg-[#1a74ff] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
