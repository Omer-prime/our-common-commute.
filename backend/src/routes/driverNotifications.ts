import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role } from "@prisma/client";

const router = Router();

function clampLimit(n: any, min = 1, max = 50, fallback = 20) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64");
}

function decodeCursor(cursor: string) {
  const raw = Buffer.from(cursor, "base64").toString("utf8");
  const [iso, id] = raw.split("|");
  const dt = new Date(iso);
  if (!iso || !id || Number.isNaN(dt.getTime())) return null;
  return { createdAt: dt, id };
}

// GET /driver/notifications?limit=20&cursor=...&unreadOnly=1
router.get("/", requireAuth([Role.DRIVER]), async (req, res) => {
  const userId = req.user!.id;
  const limit = clampLimit(req.query.limit, 1, 50, 20);
  const unreadOnly = String(req.query.unreadOnly || "") === "1";

  const cursor = typeof req.query.cursor === "string" ? decodeCursor(req.query.cursor) : null;

  const where: any = { userId };
  if (unreadOnly) where.readAt = null;

  if (cursor) {
    where.OR = [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ];
  }

  const [unreadCount, rows] = await Promise.all([
    prisma.driverNotification.count({ where: { userId, readAt: null } }),
    prisma.driverNotification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        title: true,
        body: true,
        source: true,
        actionUrl: true,
        data: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor =
    hasMore && items.length
      ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
      : null;

  return res.json({ ok: true, unreadCount, nextCursor, notifications: items });
});

// PATCH /driver/notifications/:id/read
router.patch("/:id/read", requireAuth([Role.DRIVER]), async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const updated = await prisma.driverNotification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true, updated: updated.count });
});

// POST /driver/notifications/read-all
router.post("/read-all", requireAuth([Role.DRIVER]), async (req, res) => {
  const userId = req.user!.id;

  const updated = await prisma.driverNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return res.json({ ok: true, updated: updated.count });
});

export const driverNotificationsRouter = router;
export default router;
