"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import {
  ChevronLeft,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
} from "lucide-react";

type SupportTab = "chat" | "email";

type SupportThread = {
  id: string;
  name: string;
  subtitle: string;
  timeAgo: string;
  unread?: boolean;
  avatar: string;
};

type SupportMessage = {
  id: number;
  from: "agent" | "user";
  text: string;
  time: string;
};

const THREADS: SupportThread[] = [
  {
    id: "ai",
    name: "Alexia (AI)",
    subtitle: "Please complete incident reports...",
    timeAgo: "1hr ago",
    unread: true,
    avatar: "/support-agent-1.jpg",
  },
  {
    id: "care",
    name: "Gift (Customer care)",
    subtitle: "Please complete incident reports...",
    timeAgo: "1hr ago",
    unread: false,
    avatar: "/support-agent-2.jpg",
  },
];

const MESSAGES: SupportMessage[] = [
  {
    id: 1,
    from: "user",
    text: "Hello?",
    time: "11:55 A.M.",
  },
  {
    id: 2,
    from: "agent",
    text: "How may I be of help?",
    time: "11:56 A.M.",
  },
  {
    id: 3,
    from: "user",
    text: "I'm currently waiting for you at the beach beside Rain Cover Avenue.",
    time: "11:57 A.M.",
  },
  {
    id: 4,
    from: "agent",
    text: "Thanks for reaching out, well it takes...",
    time: "11:58 A.M.",
  },
  {
    id: 5,
    from: "agent",
    text: "Also, can you send us a picture so I can confirm the location?",
    time: "11:59 A.M.",
  },
  {
    id: 6,
    from: "user",
    text: "Of course! I will send now.",
    time: "12:05 A.M.",
  },
];

export default function RiderSupportPage() {
  const [tab, setTab] = useState<SupportTab>("chat");

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Support</h1>
        </div>

        {/* Tabs */}
        <div className="mt-1 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton
            label="Chat"
            isActive={tab === "chat"}
            onClick={() => setTab("chat")}
          />
          <TabButton
            label="Email"
            isActive={tab === "email"}
            onClick={() => setTab("email")}
          />
        </div>

        {/* Content */}
        {tab === "chat" ? <ChatTab /> : <EmailTab />}
      </div>
    </RiderDashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Tabs                                      */
/* -------------------------------------------------------------------------- */

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors ${
        isActive
          ? "bg-[#1d4ed8] text-white"
          : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Chat tab                                  */
/* -------------------------------------------------------------------------- */

function ChatTab() {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    THREADS[0]?.id ?? "",
  );

  const selectedThread =
    THREADS.find((t) => t.id === selectedThreadId) ?? THREADS[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Thread list */}
      <section className="w-full rounded-2xl border border-[#233358] bg-[#050f25] lg:max-w-xs">
        <div className="border-b border-[#233358] px-4 py-3 text-[11px] font-medium text-slate-200">
          Conversations
        </div>
        <div className="divide-y divide-[#0b1220]">
          {THREADS.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedThreadId(thread.id)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                selectedThreadId === thread.id
                  ? "bg-[#07152f]"
                  : "hover:bg-[#050f2f]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-600">
                  <Image
                    src={thread.avatar}
                    alt={thread.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-100">
                    {thread.name}
                  </div>
                  <div className="line-clamp-1 text-[10px] text-slate-400">
                    {thread.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-500">
                  {thread.timeAgo}
                </span>
                {thread.unread && (
                  <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Conversation – hidden on mobile, full panel on desktop */}
      <section className="hidden flex-1 flex-col rounded-2xl border border-[#233358] bg-[#050f25] lg:flex">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#233358] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] text-slate-300 lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-600">
              <Image
                src={selectedThread.avatar}
                alt={selectedThread.name}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-100">
                {selectedThread.name}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Online</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] text-slate-300 hover:bg-[#0b1430]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {/* Date marker */}
          <div className="mb-2 flex justify-center">
            <span className="rounded-full bg-[#07152f] px-3 py-1 text-[10px] text-slate-400">
              Today…
            </span>
          </div>

          {MESSAGES.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>

        {/* Input */}
        <MessageInput />
      </section>
    </div>
  );
}

function ChatBubble({ message }: { message: SupportMessage }) {
  const isAgent = message.from === "agent";

  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xs rounded-xl px-3 py-2 text-[11px] leading-relaxed shadow-sm sm:max-w-sm md:max-w-md ${
          isAgent
            ? "rounded-tl-none bg-[#1d4ed8] text-white"
            : "rounded-tr-none bg-[#07152f] text-slate-100"
        }`}
      >
        <p>{message.text}</p>
        <div className="mt-1 text-right text-[9px] text-slate-200/80">
          {message.time}
        </div>
      </div>
    </div>
  );
}

function MessageInput() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // later: send message to backend
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#233358] px-4 py-3"
    >
      <div className="flex items-center gap-3 rounded-full bg-[#07152f] px-3 py-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-slate-300 hover:bg-[#0b1430]"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          placeholder="Type your message"
        />

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-slate-300 hover:bg-[#0b1430]"
        >
          <Smile className="h-4 w-4" />
        </button>

        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-white hover:bg-[#2563eb]"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Email tab                                  */
/* -------------------------------------------------------------------------- */

function EmailTab() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // later: send feedback via API
  };

  return (
    <section className="w-full rounded-2xl border border-[#233358] bg-[#050f25] px-4 py-4 text-xs text-slate-200 sm:px-6 sm:py-5 lg:max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">Full name</label>
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">
            Email address
          </label>
          <input
            type="email"
            className="h-10 w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Email..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">Message</label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Write your feedback (Optional)"
          />
        </div>

        <button
          type="submit"
          className="mt-1 w-full rounded-md bg-[#1d4ed8] py-2.5 text-[11px] font-medium text-white hover:bg-[#2563eb]"
        >
          Send feedback
        </button>
      </form>
    </section>
  );
}
