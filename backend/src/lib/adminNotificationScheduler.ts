// backend/src/lib/adminNotificationScheduler.ts
import { prisma } from "../prisma.js";
import {
  AdminNotificationStatus,
  AdminNotificationTarget,
  NotificationCategory,
  NotificationSource,
  Role,
} from "@prisma/client";

/**
 * Runs every N seconds and sends scheduled admin notification campaigns.
 * NOTE: Campaigns are stored in AdminNotificationCampaign (prisma.adminNotificationCampaign).
 */

const DEFAULT_INTERVAL_MS = 10_000;

function targetToUserWhere(target: AdminNotificationTarget) {
  if (target === AdminNotificationTarget.DRIVERS) return { role: Role.DRIVER };
  if (target === AdminNotificationTarget.RIDERS) return { role: Role.RIDER };
  // "ALL_USERS" -> riders + drivers (exclude ADMIN by default)
  return { role: { in: [Role.RIDER, Role.DRIVER] } };
}

export function startAdminNotificationScheduler() {
  const intervalMs =
    Number(process.env.ADMIN_NOTIFICATION_SCHEDULER_MS ?? DEFAULT_INTERVAL_MS) ||
    DEFAULT_INTERVAL_MS;

  const run = async () => {
    try {
      await processDueCampaigns();
    } catch (err) {
      console.error("[adminNotificationScheduler] tick failed:", err);
    }
  };

  // run once immediately
  void run();

  const timer = setInterval(() => void run(), intervalMs);

  return () => clearInterval(timer);
}

async function processDueCampaigns() {
  const now = new Date();

  // ✅ correct Prisma accessor: adminNotificationCampaign
  const due = await prisma.adminNotificationCampaign.findMany({
    where: {
      scheduleEnabled: true,
      scheduledFor: { lte: now },
      status: AdminNotificationStatus.PENDING,
    },
    orderBy: { scheduledFor: "asc" },
    take: 10,
  });

  for (const campaign of due) {
    // lock campaign (avoid double send if multiple instances)
    const locked = await prisma.adminNotificationCampaign.updateMany({
      where: {
        id: campaign.id,
        status: AdminNotificationStatus.PENDING,
      },
      data: { status: AdminNotificationStatus.PROCESSING },
    });

    if (locked.count === 0) continue;

    try {
      const userWhere = targetToUserWhere(campaign.target);

      const users = await prisma.user.findMany({
        where: userWhere,
        select: { id: true },
        take: 5000, // safety cap
      });

      const userIds = users.map((u) => u.id);
      const totalRecipients = userIds.length;

      if (totalRecipients === 0) {
        await prisma.adminNotificationCampaign.update({
          where: { id: campaign.id },
          data: {
            status: AdminNotificationStatus.COMPLETED,
            totalRecipients: 0,
            sentCount: 0,
            failedCount: 0,
            sentAt: new Date(),
            errorMessage: null,
          },
        });
        continue;
      }

      // create user notifications (your riderNotifications API reads from UserNotification)
      const created = await prisma.userNotification.createMany({
        data: userIds.map((userId) => ({
          userId,
          source: NotificationSource.ADMIN,
          sourceUserId: campaign.createdById,
          category: NotificationCategory.SYSTEM, // your admin UI doesn't have category yet
          title: campaign.title,
          body: campaign.body,
          ctaLabel: null,
          actionUrl: null,
          data: {
            campaignId: campaign.id,
            channel: campaign.channel,
            target: campaign.target,
          },
        })),
      });

      await prisma.adminNotificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: AdminNotificationStatus.COMPLETED,
          totalRecipients,
          sentCount: created.count,
          failedCount: Math.max(0, totalRecipients - created.count),
          sentAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (err: any) {
      await prisma.adminNotificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: AdminNotificationStatus.FAILED,
          errorMessage: err?.message || "Failed to send scheduled notification",
        },
      });
    }
  }
}
