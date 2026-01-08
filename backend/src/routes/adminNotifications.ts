// backend/src/routes/adminNotifications.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  Role,
  AdminNotificationStatus,
  AdminNotificationTarget,
  AdminNotificationChannel,
} from "@prisma/client";

const router = Router();

function fmtDDMMYYYY(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function mapTarget(t: AdminNotificationTarget) {
  if (t === "DRIVERS") return "Drivers";
  if (t === "RIDERS") return "Riders";
  return "All users";
}

function mapChannel(c: AdminNotificationChannel) {
  if (c === "PUSH") return "Push";
  if (c === "EMAIL") return "Email";
  return "SMS";
}

function mapStatus(s: AdminNotificationStatus) {
  return s === "COMPLETED" ? "Completed" : "Pending";
}

/**
 * GET /admin/notifications/overview
 */
router.get("/overview", requireAuth([Role.ADMIN]), async (_req, res) => {
  // ✅ correct model accessor
  const [total, scheduled, agg] = await Promise.all([
    prisma.adminNotificationCampaign.count(),
    prisma.adminNotificationCampaign.count({
      where: { scheduleEnabled: true, status: AdminNotificationStatus.PENDING },
    }),
    prisma.adminNotificationCampaign.aggregate({
      _sum: { sentCount: true, failedCount: true },
    }),
  ]);

  return res.json({
    ok: true,
    stats: {
      totalNotifications: total,
      scheduledNotifications: scheduled,
      failedDeliveries: agg._sum.failedCount ?? 0,
      totalUsersReached: agg._sum.sentCount ?? 0,
    },
  });
});

/**
 * GET /admin/notifications?tab=all|scheduled&q=&page=1&limit=10
 */
router.get("/", requireAuth([Role.ADMIN]), async (req, res) => {
  const QuerySchema = z.object({
    tab: z.enum(["all", "scheduled"]).default("all"),
    q: z.string().optional().default(""),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
  });

  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });
  }

  const { tab, q, page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const query = q.trim();

  const where: any = {};

  // Scheduled tab = only pending scheduled campaigns
  if (tab === "scheduled") {
    where.scheduleEnabled = true;
    where.status = AdminNotificationStatus.PENDING;
  }

  // Simple search (id/title + also allow keyword search for channel/target/status)
  if (query) {
    const or: any[] = [
      { id: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
    ];

    const qLower = query.toLowerCase();

    // target keyword search
    if (qLower.includes("driver")) or.push({ target: AdminNotificationTarget.DRIVERS });
    if (qLower.includes("rider")) or.push({ target: AdminNotificationTarget.RIDERS });
    if (qLower.includes("all")) or.push({ target: AdminNotificationTarget.ALL_USERS });

    // channel keyword search
    if (qLower.includes("push")) or.push({ channel: AdminNotificationChannel.PUSH });
    if (qLower.includes("email")) or.push({ channel: AdminNotificationChannel.EMAIL });
    if (qLower.includes("sms")) or.push({ channel: AdminNotificationChannel.SMS });

    // status keyword search
    if (qLower.includes("pending")) or.push({ status: AdminNotificationStatus.PENDING });
    if (qLower.includes("completed")) or.push({ status: AdminNotificationStatus.COMPLETED });

    where.OR = or;
  }

  const [total, rows] = await Promise.all([
    prisma.adminNotificationCampaign.count({ where }),
    prisma.adminNotificationCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        target: true,
        channel: true,
        status: true,
        scheduleEnabled: true,
        scheduledFor: true,
        sentAt: true,
        createdAt: true,
      },
    }),
  ]);

  const mapped = rows.map((r) => {
    const scheduledTime =
      r.scheduleEnabled && r.scheduledFor
        ? fmtDDMMYYYY(r.scheduledFor)
        : r.status === "COMPLETED"
        ? "Sent"
        : r.sentAt
        ? fmtDDMMYYYY(r.sentAt)
        : "Pending";

    return {
      id: `#${r.id.slice(0, 8)}`,
      title: r.title,
      type: mapChannel(r.channel),
      target: mapTarget(r.target),
      status: mapStatus(r.status),
      scheduledTime,
    };
  });

  return res.json({
    ok: true,
    page,
    limit,
    total,
    rows: mapped,
  });
});

export default router;
