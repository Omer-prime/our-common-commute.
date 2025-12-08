import React, { useState } from "react";
import Image from "next/image";
import { Send, X } from "lucide-react";

type DriverChatModalProps = {
  onClose: () => void;
};

type ChatMessage = {
  id: number;
  from: "me" | "driver";
  text: string;
  time: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    from: "driver",
    text: "Hello?",
    time: "11:55 A.M.",
  },
  {
    id: 2,
    from: "me",
    text: "How may I be of help ?",
    time: "11:56 A.M.",
  },
  {
    id: 3,
    from: "driver",
    text: "I’m currently waiting for you at the beach beside Rain Cover Avenue",
    time: "11:57 A.M.",
  },
  {
    id: 4,
    from: "me",
    text: "Thanks for reaching out, well it takes...",
    time: "11:58 A.M.",
  },
  {
    id: 5,
    from: "me",
    text: "Also, can you send us a picture so I can confirm the location",
    time: "11:59 A.M.",
  },
  {
    id: 6,
    from: "driver",
    text: "Of course! I will send now",
    time: "11:59 A.M.",
  },
];

export function DriverChatModal({ onClose }: DriverChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        from: "me",
        text: trimmed,
        time: "Now",
      },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-[#233358] bg-[#050817] shadow-[0_30px_80px_rgba(0,0,0,0.95)] sm:h-[640px]"
        onClick={stop}
      >
        {/* HEADER */}
        <div className="flex items-center border-b border-[#233358] bg-[#101a33] px-4 py-3">
          {/* Back / close on the left for mobile-feel */}
          <button
            type="button"
            onClick={onClose}
            className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-500">
              <Image
                src="/maxwell.png"
                alt="Driver avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-50">M.L</span>
              <span className="text-[11px] text-emerald-400">● Online</span>
            </div>
          </div>
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#050817] px-4 py-3">
          {/* Date separator */}
          <div className="my-2 text-center text-[11px] text-slate-500">
            Today...
          </div>

          {messages.map((m) => {
            const isMe = m.from === "me";
            const align = isMe ? "justify-end" : "justify-start";
            const bubbleColor = isMe
              ? "bg-[#0B63F4] text-white"
              : "bg-[#18213a] text-slate-100";
            const radius = isMe
              ? "rounded-2xl rounded-br-sm"
              : "rounded-2xl rounded-bl-sm";

            return (
              <div key={m.id} className={`flex w-full ${align}`}>
                <div className="max-w-[80%]">
                  <div
                    className={`${bubbleColor} ${radius} inline-block px-3 py-2 text-[13px] leading-relaxed`}
                  >
                    {m.text}
                  </div>
                  <div
                    className={`mt-1 text-[10px] text-slate-500 ${
                      isMe ? "text-right" : "text-left"
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT BAR */}
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B63F4] text-white hover:bg-[#1a74ff]"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
