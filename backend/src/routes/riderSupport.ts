import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role, SupportAuthor, SupportChannel } from "@prisma/client";

const router = Router();

function timeAgo(from: Date) {
  const diffMs = Date.now() - from.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}hr ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

async function ensureDefaultChatConversation(userId: string) {
  const existing = await prisma.supportConversation.findFirst({
    where: { driverId: userId, channel: SupportChannel.CHAT },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.supportConversation.create({
    data: {
      driverId: userId,
      channel: SupportChannel.CHAT,
      name: "Customer care",
      tagLine: "We are here to help",
      unread: false,
      lastMessageAt: new Date(),
      messages: {
        create: {
          author: SupportAuthor.AGENT,
          text: "Hi! How can we help you today?",
        },
      },
    },
  });
}

/**
 * GET /api/rider/support/whoami
 */
router.get("/whoami", requireAuth([Role.RIDER]), async (req, res) => {
  return res.json({ ok: true, user: req.user });
});

/**
 * GET /api/rider/support/threads
 */
router.get("/threads", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  await ensureDefaultChatConversation(userId);

  const conversations = await prisma.supportConversation.findMany({
    where: { driverId: userId, channel: SupportChannel.CHAT },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    take: 20,
  });

  const threads = conversations.map((c, idx) => {
    const lastMsg = c.messages[0]?.text ?? c.tagLine ?? "";
    const lastAt = c.lastMessageAt ?? c.updatedAt ?? c.createdAt;
    return {
      id: c.id,
      name: c.name || "Customer care",
      subtitle: lastMsg.length > 60 ? `${lastMsg.slice(0, 60)}…` : lastMsg,
      timeAgo: timeAgo(lastAt),
      unread: c.unread,
      avatar: idx % 2 === 0 ? "/support-agent-1.jpg" : "/support-agent-2.jpg",
    };
  });

  return res.json({ ok: true, threads });
});

/**
 * GET /api/rider/support/threads/:id/messages
 */
router.get("/threads/:id/messages", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const convo = await prisma.supportConversation.findFirst({
    where: { id, driverId: userId, channel: SupportChannel.CHAT },
    select: { id: true },
  });

  if (!convo) {
    return res.status(404).json({ ok: false, error: "THREAD_NOT_FOUND", messages: [] });
  }

  await prisma.supportConversation.update({
    where: { id },
    data: { unread: false },
  });

  const msgs = await prisma.supportMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  const messages = msgs.map((m) => ({
    id: m.id,
    from: m.author === SupportAuthor.AGENT ? "agent" : "user",
    text: m.text,
    time: fmtTime(m.createdAt),
  }));

  return res.json({ ok: true, messages });
});

const SendMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

/**
 * POST /api/rider/support/threads/:id/messages
 */
router.post("/threads/:id/messages", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });
  }

  const convo = await prisma.supportConversation.findFirst({
    where: { id, driverId: userId, channel: SupportChannel.CHAT },
    select: { id: true },
  });

  if (!convo) {
    return res.status(404).json({ ok: false, error: "THREAD_NOT_FOUND" });
  }

  const msg = await prisma.supportMessage.create({
    data: {
      conversationId: id,
      // NOTE: schema has DRIVER/AGENT only — we store rider as DRIVER to avoid migration right now
      author: SupportAuthor.DRIVER,
      text: parsed.data.text,
    },
  });

  await prisma.supportConversation.update({
    where: { id },
    data: { lastMessageAt: msg.createdAt, unread: false },
  });

  return res.json({
    ok: true,
    message: {
      id: msg.id,
      from: "user",
      text: msg.text,
      time: fmtTime(msg.createdAt),
    },
  });
});

const EmailSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

/**
 * POST /api/rider/support/email
 */
router.post("/email", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  const parsed = EmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });
  }

  const { fullName, email, message } = parsed.data;

  await prisma.supportConversation.create({
    data: {
      driverId: userId,
      channel: SupportChannel.EMAIL,
      name: fullName,
      tagLine: email,
      unread: true,
      lastMessageAt: new Date(),
      messages: {
        create: {
          author: SupportAuthor.DRIVER,
          text: message,
        },
      },
    },
  });

  return res.json({ ok: true });
});

export default router;
