import { prisma } from "../prisma.js";
import {
  AdminNotificationTarget,
  NotificationSource,
  NotificationCategory,
  Role,
  AdminNotificationStatus,
} from "@prisma/client";

export async function deliverAdminNotification(campaignId: string) {
  const campaign = await prisma.adminNotificationCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) return;

  let totalRecipients = 0;
  let sentCount = 0;

  if (
    campaign.target === AdminNotificationTarget.DRIVERS ||
    campaign.target === AdminNotificationTarget.ALL_USERS
  ) {
    const drivers = await prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: { id: true },
    });

    totalRecipients += drivers.length;

    if (drivers.length) {
      const created = await prisma.userNotification.createMany({
        data: drivers.map((d) => ({
          userId: d.id,
          title: campaign.title,
          body: campaign.body,
          source: NotificationSource.ADMIN,
          sourceUserId: campaign.createdById,
          category: NotificationCategory.SYSTEM,
          data: { campaignId },
        })),
      });
      sentCount += created.count;
    }
  }

  if (
    campaign.target === AdminNotificationTarget.RIDERS ||
    campaign.target === AdminNotificationTarget.ALL_USERS
  ) {
    const riders = await prisma.user.findMany({
      where: { role: Role.RIDER },
      select: { id: true },
    });

    totalRecipients += riders.length;

    if (riders.length) {
      const created = await prisma.userNotification.createMany({
        data: riders.map((r) => ({
          userId: r.id,
          title: campaign.title,
          body: campaign.body,
          source: NotificationSource.ADMIN,
          sourceUserId: campaign.createdById,
          category: NotificationCategory.SYSTEM,
          data: { campaignId },
        })),
      });
      sentCount += created.count;
    }
  }

  await prisma.adminNotificationCampaign.update({
    where: { id: campaignId },
    data: {
      status: AdminNotificationStatus.COMPLETED,
      totalRecipients,
      sentCount,
      failedCount: Math.max(0, totalRecipients - sentCount),
      sentAt: new Date(),
      errorMessage: null,
    },
  });
}
