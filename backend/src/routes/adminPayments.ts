// backend/src/routes/adminPayments.ts
import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { Prisma, PaymentStatus, Role, WithdrawalStatus } from "@prisma/client";

const router = Router();

/* ------------------------------ Date helpers ----------------------------- */
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

function humanPaymentMethod(method: any): string {
  if (!method) return "Unknown";
  const map: Record<string, string> = {
    APPLE_PAY: "Apple Pay",
    PAYPAL: "PayPal",
    GPAY: "Google Pay",
    CASHAPP: "Cash App",
    CREDIT_CARD: "Credit Card",
  };
  return map[String(method)] ?? String(method);
}

function humanPayoutMethod(method: any): string {
  if (!method) return "Unknown";
  const map: Record<string, string> = {
    BANK_ACCOUNT: "Bank Account",
    MOBILE_WALLET: "Mobile Wallet",
    PAYPAL: "PayPal",
  };
  return map[String(method)] ?? String(method);
}

/* -------------------------------------------------------------------------- */
/*  GET /admin/payments/overview                                              */
/* -------------------------------------------------------------------------- */
router.get("/overview", requireAuth(), requireAdmin, async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days ?? 30)));
  const today = startOfDay(new Date());
  const rangeStart = addDays(today, -(days - 1));

  const [paidAgg, refundedAgg, pendingPayoutAgg, refundedCount, paidTrips] =
    await Promise.all([
      prisma.trip.aggregate({
        where: { paymentStatus: PaymentStatus.PAID, updatedAt: { gte: rangeStart } },
        _sum: { fareCents: true },
      }),
      prisma.trip.aggregate({
        where: { paymentStatus: PaymentStatus.REFUNDED, updatedAt: { gte: rangeStart } },
        _sum: { fareCents: true },
      }),
      prisma.driverWithdrawalRequest.aggregate({
        where: {
          status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
        },
        _sum: { amountCents: true },
      }),
      prisma.trip.count({
        where: { paymentStatus: PaymentStatus.REFUNDED, updatedAt: { gte: rangeStart } },
      }),
      prisma.trip.findMany({
        where: { paymentStatus: PaymentStatus.PAID, updatedAt: { gte: rangeStart } },
        select: { updatedAt: true, fareCents: true },
      }),
    ]);

  const totalPaidCents = paidAgg._sum.fareCents ?? 0;
  const totalRefundedCents = refundedAgg._sum.fareCents ?? 0;
  const totalRevenueCents = Math.max(0, totalPaidCents - totalRefundedCents);
  const pendingPayoutsCents = pendingPayoutAgg._sum.amountCents ?? 0;

  const seriesMap = new Map<string, number>();
  for (let i = 0; i < days; i++) seriesMap.set(ymd(addDays(rangeStart, i)), 0);

  for (const t of paidTrips) {
    const key = ymd(startOfDay(t.updatedAt));
    seriesMap.set(key, (seriesMap.get(key) ?? 0) + (t.fareCents ?? 0));
  }

  const transactionSeries = Array.from(seriesMap.entries()).map(([date, valueCents]) => ({
    date,
    valueCents,
  }));

  return res.json({
    ok: true,
    stats: {
      totalTransactionsCents: totalPaidCents,
      totalRevenueCents,
      pendingPayoutsCents,
      disputedPaymentsCount: refundedCount,
    },
    series: {
      days,
      transactionSeries,
    },
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /admin/payments/list?tab=all|payouts|refunds&q=&page=1&limit=10        */
/* -------------------------------------------------------------------------- */
router.get("/list", requireAuth(), requireAdmin, async (req, res) => {
  const tab = String(req.query.tab ?? "all");
  const q = String(req.query.q ?? "").trim();
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 10)));
  const skip = (page - 1) * limit;

  // ---------------- PAYOUTS ----------------
  if (tab === "payouts") {
    const where: Prisma.DriverWithdrawalRequestWhereInput = {
      user: { role: Role.DRIVER },
      ...(q
        ? {
            OR: [
              { user: { fullName: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.driverWithdrawalRequest.count({ where }),
      prisma.driverWithdrawalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          amountCents: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: { select: { fullName: true, email: true } },
          payoutMethod: { select: { type: true, label: true } },
        },
      }),
    ]);

    const driverIds = Array.from(new Set(rows.map((r) => r.userId)));
    const rideCounts = driverIds.length
      ? await prisma.trip.groupBy({
          by: ["driverId"],
          where: { driverId: { in: driverIds }, status: "COMPLETED" },
          _count: { _all: true },
        })
      : [];

    const rideCountByDriver = new Map<string, number>();
    for (const g of rideCounts) {
      if (g.driverId) rideCountByDriver.set(g.driverId, g._count._all);
    }

    return res.json({
      ok: true,
      tab: "payouts",
      page,
      limit,
      total,
      rows: rows.map((r) => ({
        id: r.id,
        driverName: r.user.fullName,
        driverEmail: r.user.email,
        payoutMethod: humanPayoutMethod(r.payoutMethod?.type),
        amountCents: r.amountCents,
        status: r.status,
        rides: rideCountByDriver.get(r.userId) ?? 0,
        lastPayoutAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }

  // ---------------- REFUNDS ----------------
  if (tab === "refunds") {
    const where: Prisma.TripWhereInput = {
      paymentStatus: PaymentStatus.REFUNDED,
      ...(q
        ? {
            OR: [
              { rider: { fullName: { contains: q, mode: "insensitive" } } },
              { rider: { email: { contains: q, mode: "insensitive" } } },
              { driver: { is: { fullName: { contains: q, mode: "insensitive" } } } },
              { driver: { is: { email: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          rider: { select: { fullName: true, email: true, riderProfile: true } },
          driver: { select: { fullName: true, email: true } },
          cancellations: true,
        },
      }),
    ]);

    return res.json({
      ok: true,
      tab: "refunds",
      page,
      limit,
      total,
      rows: rows.map((t) => {
        const reason =
          t.cancellations?.[0]?.otherReason ||
          t.cancellations?.[0]?.reasons?.[0] ||
          "Payment refunded";

        return {
          id: t.id,
          riderName: t.rider.fullName,
          riderEmail: t.rider.email,
          driverName: t.driver?.fullName ?? "Unassigned",
          driverEmail: t.driver?.email ?? null,
          paymentMethod: humanPaymentMethod(t.rider.riderProfile?.paymentMethod),
          amountCents: t.fareCents ?? 0,
          reason,
          status: "Completed",
          refundedAt: t.updatedAt.toISOString(),
        };
      }),
    });
  }

  // ---------------- ALL ----------------
  const where: Prisma.TripWhereInput = {
    paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
    ...(q
      ? {
          OR: [
            { rider: { fullName: { contains: q, mode: "insensitive" } } },
            { rider: { email: { contains: q, mode: "insensitive" } } },
            { driver: { is: { fullName: { contains: q, mode: "insensitive" } } } },
            { driver: { is: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        rider: { select: { fullName: true, email: true, riderProfile: true } },
        driver: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  return res.json({
    ok: true,
    tab: "all",
    page,
    limit,
    total,
    rows: rows.map((t) => ({
      id: t.id,
      riderName: t.rider.fullName,
      riderEmail: t.rider.email,
      driverName: t.driver?.fullName ?? "Unassigned",
      driverEmail: t.driver?.email ?? null,
      paymentMethod: humanPaymentMethod(t.rider.riderProfile?.paymentMethod),
      amountCents: t.fareCents ?? 0,
      paymentStatus: t.paymentStatus,
      paidAt: t.updatedAt.toISOString(),
    })),
  });
});

export default router;
