"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Image from "next/image";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import {
  ChevronLeft,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
} from "lucide-react";

/* ----------------------------- Types ----------------------------- */

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
  id: string;
  from: "agent" | "user";
  text: string;
  time: string;
};

type ThreadsRes = { ok: boolean; threads: SupportThread[]; error?: string };
type MessagesRes = { ok: boolean; messages: SupportMessage[]; error?: string };
type SendRes = { ok: boolean; message?: SupportMessage; error?: string };

/* ------------------------ API helpers ------------------------ */

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function normalizeToken(raw: string): string {
  let t = raw.trim();

  // if stored like: "Bearer eyJ..."
  if (t.toLowerCase().startsWith("bearer ")) t = t.slice(7).trim();

  // if stored like: "\"eyJ...\"" or "\"Bearer eyJ...\""
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
    if (t.toLowerCase().startsWith("bearer ")) t = t.slice(7).trim();
  }

  // if stored as JSON: {"accessToken":"..."}
  if (t.startsWith("{") && t.endsWith("}")) {
    try {
      const obj = JSON.parse(t) as any;
      const candidate =
        obj?.accessToken ||
        obj?.access_token ||
        obj?.token ||
        obj?.jwt ||
        obj?.authToken;
      if (typeof candidate === "string") return normalizeToken(candidate);
    } catch {
      // ignore
    }
  }

  return t;
}

function readStorage(keys: string[]): string | null {
  if (typeof window === "undefined") return null;

  for (const k of keys) {
    const v1 = window.localStorage.getItem(k);
    if (v1 && v1.trim()) return normalizeToken(v1);

    const v2 = window.sessionStorage.getItem(k);
    if (v2 && v2.trim()) return normalizeToken(v2);
  }

  // optional: some apps store auth object
  const occ = window.localStorage.getItem("occ_auth");
  if (occ && occ.trim()) {
    try {
      const obj = JSON.parse(occ) as any;
      const token =
        obj?.accessToken ||
        obj?.access_token ||
        obj?.token ||
        obj?.jwt ||
        obj?.authToken;
      if (typeof token === "string" && token.trim()) return normalizeToken(token);
    } catch {
      // ignore
    }
  }

  return null;
}

function getAccessToken(): string | null {
  return readStorage(["accessToken", "access_token", "token", "jwt", "authToken"]);
}

function getRefreshToken(): string | null {
  return readStorage(["refreshToken", "refresh_token"]);
}

async function tryRefreshAt(base: string, path: string, refreshToken: string) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
    credentials: "include",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string };
  if (!data?.accessToken) return null;

  const token = normalizeToken(data.accessToken);
  window.localStorage.setItem("accessToken", token);
  return token;
}

async function refreshAccessToken(): Promise<string | null> {
  const base = getBackendBaseUrl();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // ✅ support both mount styles:
  // - app.use("/api/auth", authRouter) => /api/auth/refresh
  // - app.use("/api", authRouter)      => /api/refresh
  const candidates = ["/api/auth/refresh", "/api/refresh"];

  for (const p of candidates) {
    const tok = await tryRefreshAt(base, p, refreshToken);
    if (tok) return tok;
  }

  return null;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const base = getBackendBaseUrl();
  const token = getAccessToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.method && init.method !== "GET"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include",
    headers: { ...headers, ...(init?.headers ?? {}) } as any,
  });

  // if 401 => refresh and retry once
  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error("UNAUTHORIZED — Please login again.");
    }

    const retryRes = await fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.method && init.method !== "GET"
          ? { "Content-Type": "application/json" }
          : {}),
        Authorization: `Bearer ${newToken}`,
        ...(init?.headers ?? {}),
      } as any,
    });

    const ct2 = retryRes.headers.get("content-type") || "";
    const data2 = ct2.includes("application/json")
      ? await retryRes.json()
      : { ok: false, error: await retryRes.text() };

    if (!retryRes.ok) {
      throw new Error(
        retryRes.status === 401
          ? "UNAUTHORIZED — Please login again."
          : (data2 as any)?.error || `Request failed (${retryRes.status})`,
      );
    }

    return data2 as T;
  }

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : { ok: false, error: await res.text() };

  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "UNAUTHORIZED — Please login again."
        : (data as any)?.error || `Request failed (${res.status})`,
    );
  }

  return data as T;
}

/* ----------------------------- Page ----------------------------- */

export default function RiderSupportPage() {
  const [tab, setTab] = useState<SupportTab>("chat");

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Support</h1>
        </div>

        <div className="mt-1 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton label="Chat" isActive={tab === "chat"} onClick={() => setTab("chat")} />
          <TabButton label="Email" isActive={tab === "email"} onClick={() => setTab("email")} />
        </div>

        {tab === "chat" ? <ChatTab /> : <EmailTab />}
      </div>
    </RiderDashboardShell>
  );
}

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

/* -------------------------------- Chat -------------------------------- */

function ChatTab() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? threads[0],
    [threads, selectedThreadId],
  );

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const loadThreads = async () => {
    try {
      setErr(null);
      setLoadingThreads(true);

      const data = await apiFetch<ThreadsRes>("/api/rider/support/threads");
      if (!data.ok) throw new Error(data.error || "Failed to load threads");

      setThreads(data.threads ?? []);
      const firstId = data.threads?.[0]?.id ?? "";
      setSelectedThreadId((prev) => prev || firstId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load threads");
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!threadId) return;
    try {
      setErr(null);
      setLoadingMessages(true);

      const data = await apiFetch<MessagesRes>(
        `/api/rider/support/threads/${threadId}/messages`,
      );
      if (!data.ok) throw new Error(data.error || "Failed to load messages");

      setMessages(data.messages ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedThreadId) loadMessages(selectedThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  const onSelectThread = (id: string) => {
    setSelectedThreadId(id);
    setMobileView("chat");
  };

  const onBackMobile = () => setMobileView("list");

  const onSend = async (text: string) => {
    if (!selectedThreadId) return;

    const optimistic: SupportMessage = {
      id: `tmp-${Date.now()}`,
      from: "user",
      text,
      time: new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const data = await apiFetch<SendRes>(
        `/api/rider/support/threads/${selectedThreadId}/messages`,
        { method: "POST", body: JSON.stringify({ text }) },
      );

      if (!data.ok || !data.message) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessages((m) => m.map((x) => (x.id === optimistic.id ? data.message! : x)));
      loadThreads();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send message");
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Thread list */}
      <section
        className={`w-full rounded-2xl border border-[#233358] bg-[#050f25] lg:max-w-xs ${
          mobileView === "chat" ? "hidden lg:block" : "block"
        }`}
      >
        <div className="border-b border-[#233358] px-4 py-3 text-[11px] font-medium text-slate-200">
          Conversations
        </div>

        {err ? (
          <div className="m-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
            {err}
          </div>
        ) : null}

        {loadingThreads ? (
          <div className="px-4 py-4 text-[11px] text-slate-400">Loading…</div>
        ) : (
          <div className="divide-y divide-[#0b1220]">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                  selectedThreadId === thread.id ? "bg-[#07152f]" : "hover:bg-[#050f2f]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-600">
                    <Image src={thread.avatar} alt={thread.name} fill className="object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-100">{thread.name}</div>
                    <div className="line-clamp-1 text-[10px] text-slate-400">{thread.subtitle}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-500">{thread.timeAgo}</span>
                  {thread.unread && <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Conversation panel */}
      <section
        className={`w-full flex-1 flex-col rounded-2xl border border-[#233358] bg-[#050f25] ${
          mobileView === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#233358] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackMobile}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] text-slate-300 lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-600">
              <Image
                src={selectedThread?.avatar ?? "/support-agent-1.jpg"}
                alt={selectedThread?.name ?? "Support"}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-100">
                {selectedThread?.name ?? "Support"}
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

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="mb-2 flex justify-center">
            <span className="rounded-full bg-[#07152f] px-3 py-1 text-[10px] text-slate-400">
              Today…
            </span>
          </div>

          {loadingMessages ? (
            <div className="text-[11px] text-slate-400">Loading messages…</div>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} message={m} />)
          )}
        </div>

        <MessageInput onSend={onSend} disabled={!selectedThreadId} />
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

function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    setText("");
    onSend(t);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#233358] px-4 py-3">
      <div className="flex items-center gap-3 rounded-full bg-[#07152f] px-3 py-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-slate-300 hover:bg-[#0b1430]"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          placeholder={disabled ? "Select a conversation" : "Type your message"}
        />

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-slate-300 hover:bg-[#0b1430]"
        >
          <Smile className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-white hover:bg-[#2563eb] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* -------------------------------- Email -------------------------------- */

function EmailTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    try {
      setLoading(true);
      const res = await apiFetch<{ ok: boolean; error?: string }>(
        "/api/rider/support/email",
        { method: "POST", body: JSON.stringify({ fullName, email, message }) },
      );

      if (!res.ok) throw new Error(res.error || "Failed to send");

      setOk("Feedback sent successfully.");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full rounded-2xl border border-[#233358] bg-[#050f25] px-4 py-4 text-xs text-slate-200 sm:px-6 sm:py-5 lg:max-w-2xl">
      {err ? (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          {err}
        </div>
      ) : null}

      {ok ? (
        <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
          {ok}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            className="h-10 w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">Email address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="h-10 w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Email..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-[#233358] bg-[#07152f] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            placeholder="Write your feedback"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-[#1d4ed8] py-2.5 text-[11px] font-medium text-white hover:bg-[#2563eb] disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send feedback"}
        </button>
      </form>
    </section>
  );
}
