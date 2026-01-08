import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const adminDashboardRouter = Router();

type ActivityCategory = "DOCUMENT" | "WORK_LOCATION" | "PAYMENT" | "SYSTEM";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

adminDashboardRouter.get(
  "/overview",
  requireAuth(),
  requireAdmin,
  async (_req, res) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);

    // ---------- TOP STATS ----------
    const [
      totalUsers,
      driversUnderReview,
      ridersUnderReview,
      ridesToday,
      revenueAggToday,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          role: "DRIVER",
          OR: [
            { driverProfile: { onboardingCompletedAt: null } },
            { driverProfile: { documentsV2: { some: { status: "PENDING" } } } },
            { driverProfile: { workLocationRequests: { some: { status: "PENDING" } } } },
          ],
        },
      }),

      prisma.user.count({
        where: {
          role: "RIDER",
          OR: [{ riderProfile: { onboardingCompletedAt: null } }],
        },
      }),

      prisma.trip.count({
        where: {
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),

      prisma.trip.aggregate({
        where: {
          paymentStatus: "PAID",
          updatedAt: { gte: todayStart, lt: tomorrowStart }, // payment changed today
        },
        _sum: { fareCents: true },
      }),
    ]);

    const usersUnderReview = driversUnderReview + ridersUnderReview;
    const revenueTodayCents = revenueAggToday._sum.fareCents ?? 0;

    // ---------- CHARTS (Last 7 days) ----------
    const days = 7;
    const chartStart = addDays(todayStart, -(days - 1));

    const ridesSeries: Array<{ date: string; value: number }> = [];
    const revenueSeries: Array<{ date: string; valueCents: number }> = [];

    for (let i = 0; i < days; i++) {
      const dayStart = addDays(chartStart, i);
      const nextStart = addDays(dayStart, 1);

      const [ridesCount, revAgg] = await Promise.all([
        prisma.trip.count({
          where: { createdAt: { gte: dayStart, lt: nextStart } },
        }),
        prisma.trip.aggregate({
          where: {
            paymentStatus: "PAID",
            updatedAt: { gte: dayStart, lt: nextStart },
          },
          _sum: { fareCents: true },
        }),
      ]);

      ridesSeries.push({ date: ymd(dayStart), value: ridesCount });
      revenueSeries.push({
        date: ymd(dayStart),
        valueCents: revAgg._sum.fareCents ?? 0,
      });
    }

    // ---------- RECENT ACTIVITIES (REAL EVENTS) ----------
    const [pendingDocs, pendingWork, refundedTrips, completedTrips] =
      await Promise.all([
        prisma.driverDocument.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { driver: { include: { user: true } } },
        }),

        prisma.workLocationChangeRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { driver: { include: { user: true } } },
        }),

        prisma.trip.findMany({
          where: { paymentStatus: "REFUNDED" },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { rider: true },
        }),

        prisma.trip.findMany({
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 5,
          include: { rider: true, driver: true },
        }),
      ]);

    const activities: Array<{
      id: string;
      category: ActivityCategory;
      text: string;
      createdAt: string;
    }> = [];

    for (const d of pendingDocs) {
      const driverName = d.driver?.user?.fullName ?? "Driver";
      activities.push({
        id: `doc_${d.id}`,
        category: "DOCUMENT",
        text: `Driver ${driverName} uploaded a new ${d.type} document for review.`,
        createdAt: d.createdAt.toISOString(),
      });
    }

    for (const w of pendingWork) {
      const driverName = w.driver?.user?.fullName ?? "Driver";
      activities.push({
        id: `work_${w.id}`,
        category: "WORK_LOCATION",
        text: `Driver ${driverName} requested a change of work location.`,
        createdAt: w.createdAt.toISOString(),
      });
    }

    for (const t of refundedTrips) {
      const riderName = t.rider?.fullName ?? "Rider";
      const dollars = (t.fareCents / 100).toFixed(2);
      activities.push({
        id: `refund_${t.id}`,
        category: "PAYMENT",
        text: `Payment of $${dollars} refunded to Rider ${riderName}.`,
        createdAt: t.updatedAt.toISOString(),
      });
    }

    for (const t of completedTrips) {
      const riderName = t.rider?.fullName ?? "Rider";
      const driverName = t.driver?.fullName ?? "Driver";
      activities.push({
        id: `done_${t.id}`,
        category: "SYSTEM",
        text: `Trip completed: ${riderName} with ${driverName}.`,
        createdAt: (t.completedAt ?? t.updatedAt).toISOString(),
      });
    }

    activities.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return res.json({
      ok: true,
      stats: {
        totalUsers,
        usersUnderReview,
        ridesToday,
        revenueTodayCents,
      },
      charts: {
        ridesLast7Days: ridesSeries,
        revenueLast7Days: revenueSeries,
      },
      activities: activities.slice(0, 8),
    });
  }
);
