import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role, NotificationCategory } from "@prisma/client";
import {
  addNotificationClient,
  removeNotificationClient,
} from "../lib/notificationHub.js";

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

const TabSchema = z.enum(["all", "rides", "payments"]).optional();

function tabToCategory(tab?: string) {
  if (tab === "rides") return NotificationCategory.RIDE;
  if (tab === "payments") return NotificationCategory.PAYMENT;
  return null;
}

/**
 * GET /api/rider/notifications?tab=all|rides|payments&cursor=...&take=30
 */
router.get("/notifications", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  const tabParsed = TabSchema.safeParse(req.query.tab);
  const tab = tabParsed.success ? tabParsed.data : "all";

  const category = tabToCategory(tab);

  const take = Math.min(Number(req.query.take ?? 30) || 30, 50);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const items = await prisma.userNotification.findMany({
    where: {
      userId,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;

  const mapped = page.map((n) => ({
    id: n.id,
    category:
      n.category === NotificationCategory.RIDE
        ? "ride"
        : n.category === NotificationCategory.PAYMENT
        ? "payment"
        : "system",
    title: n.title,
    body: n.body,
    timeAgo: timeAgo(n.createdAt),
    ctaLabel: n.ctaLabel ?? "Open",
    actionUrl: n.actionUrl ?? null,
    isNew: !n.readAt,
    createdAt: n.createdAt.toISOString(),
  }));

  return res.json({
    ok: true,
    items: mapped,
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
});

/**
 * POST /api/rider/notifications/:id/read
 */
router.post("/notifications/:id/read", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const updated = await prisma.userNotification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true, updated: updated.count });
});

/**
 * POST /api/rider/notifications/read-all
 */
router.post("/notifications/read-all", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  const updated = await prisma.userNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true, updated: updated.count });
});

/**
 * GET /api/rider/notifications/stream  (SSE real-time)
 */
router.get("/notifications/stream", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // @ts-ignore
  res.flushHeaders?.();

  res.write(`retry: 5000\n\n`);
  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  addNotificationClient(userId, res);

  const ping = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    removeNotificationClient(userId, res);
    res.end();
  });
});

export default router;
