// backend/src/routes/adminReports.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  PaymentStatus,
  Role,
  TripStatus,
  WithdrawalStatus,
} from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function assertAdmin(req: any, res: any): boolean {
  const role = req?.user?.role;
  if (role !== "ADMIN") {
    res.status(403).json({ ok: false, error: "FORBIDDEN" });
    return false;
  }
  return true;
}

function formatShortDate(d: Date) {
  // "Nov 23"
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function usdFromCents(cents: number | null | undefined) {
  const v = typeof cents === "number" ? cents : 0;
  return `$${(v / 100).toFixed(2)}`;
}

function inferShift(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  return "Evening";
}

function escapeCsv(value: unknown) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  const head = headers.map(escapeCsv).join(",");
  const lines = rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(","));
  return [head, ...lines].join("\n");
}

const rangeSchema = z
  .enum(["week", "month", "year", "all"])
  .optional()
  .default("month");

function getRange(range: z.infer<typeof rangeSchema>) {
  const now = new Date();
  if (range === "all") return { start: null as Date | null, end: now };
  const start = new Date(now);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setDate(now.getDate() - 30);
  if (range === "year") start.setFullYear(now.getFullYear() - 1);
  return { start, end: now };
}

const listQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  range: rangeSchema,
});

/* -------------------------------------------------------------------------- */
/*  Rides                                                                     */
/* -------------------------------------------------------------------------- */

router.get("/rides/summary", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const range = rangeSchema.parse(req.query.range);
  const { start, end } = getRange(range);

  const whereBase: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
  };

  const [total, completed, cancelled] = await Promise.all([
    prisma.trip.count({ where: whereBase }),
    prisma.trip.count({
      where: { ...whereBase, status: TripStatus.COMPLETED },
    }),
    prisma.trip.count({
      where: { ...whereBase, status: TripStatus.CANCELLED },
    }),
  ]);

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return res.json({
    ok: true,
    stats: {
      totalRides: total,
      completedRides: completed,
      cancelledRides: cancelled,
      completionRate: Number(completionRate.toFixed(1)),
    },
  });
});

router.get("/rides/top-drivers", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const range = rangeSchema.parse(req.query.range);
  const { start, end } = getRange(range);

  const group = await prisma.trip.groupBy({
  by: ["driverId"],
  where: {
    status: TripStatus.COMPLETED,
    driverId: { not: null },
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
  },
  _count: { id: true }, // ✅ use a real field instead of _all
  orderBy: { _count: { id: "desc" } }, // ✅ correct typing
  take: 12,
});

const ids = group.map((g) => g.driverId).filter(Boolean) as string[];
const users = await prisma.user.findMany({
  where: { id: { in: ids } },
  select: { id: true, fullName: true },
});
const map = new Map(users.map((u) => [u.id, u.fullName]));

const points = group.map((g) => ({
  label: map.get(g.driverId as string) ?? "Unknown",
  value: g._count?.id ?? 0, // ✅ TS safe (fixes “possibly undefined”)
}));

return res.json({ ok: true, points });

});

router.get("/rides", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const parsed = listQuerySchema.parse(req.query);
  const q = parsed.q.trim();
  const skip = (parsed.page - 1) * parsed.limit;

  const range = parsed.range;
  const { start, end } = getRange(range);

  const where: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { pickupAddress: { contains: q, mode: "insensitive" } },
            { dropoffAddress: { contains: q, mode: "insensitive" } },
            { rider: { fullName: { contains: q, mode: "insensitive" } } },
            { driver: { fullName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, trips] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        scheduledFor: true,
        fareCents: true,
        rider: { select: { fullName: true } },
        driver: { select: { fullName: true } },
      },
    }),
  ]);

  // payout: try to use latest ACTIVE fare rule ratio if available, otherwise fallback 75%
  const activeRule = await prisma.fareRule.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { effectiveAt: "desc" },
    select: { rideFareCents: true, driverPayoutCents: true },
  });

  const ratio =
    activeRule && activeRule.rideFareCents > 0
      ? activeRule.driverPayoutCents / activeRule.rideFareCents
      : 0.75;

  const rows = trips.map((t) => {
    const d = t.scheduledFor ?? t.createdAt;
    const payoutCents = Math.round((t.fareCents ?? 0) * ratio);

    return {
      id: t.id,
      rider: t.rider?.fullName ?? "—",
      driver: t.driver?.fullName ?? "—",
      date: formatShortDate(d),
      shift: inferShift(d),
      status:
        t.status === TripStatus.COMPLETED
          ? "Completed"
          : t.status === TripStatus.CANCELLED
          ? "Cancelled"
          : "In progress",
      fare: usdFromCents(t.fareCents),
      payout: usdFromCents(payoutCents),
    };
  });

  return res.json({ ok: true, total, rows });
});

/* -------------------------------------------------------------------------- */
/*  Payments (based on Trip.paymentStatus)                                    */
/* -------------------------------------------------------------------------- */

router.get("/payments/summary", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const range = rangeSchema.parse(req.query.range);
  const { start, end } = getRange(range);

  const whereBase: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
  };

  const [paidCount, unpaidCount, revenueAgg] = await Promise.all([
    prisma.trip.count({
      where: { ...whereBase, paymentStatus: PaymentStatus.PAID },
    }),
    prisma.trip.count({
      where: { ...whereBase, paymentStatus: PaymentStatus.UNPAID },
    }),
    prisma.trip.aggregate({
      where: { ...whereBase, paymentStatus: PaymentStatus.PAID },
      _sum: { fareCents: true },
    }),
  ]);

  const totalRevenueCents = revenueAgg._sum.fareCents ?? 0;

  return res.json({
    ok: true,
    stats: {
      totalRevenue: usdFromCents(totalRevenueCents),
      totalTransactions: paidCount + unpaidCount,
      completedPayments: paidCount,
      failedPayments: unpaidCount, // best-possible mapping with current schema
    },
  });
});

router.get("/payments/revenue-by-month", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const now = new Date();
  const start = new Date(now);
  start.setMonth(now.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const trips = await prisma.trip.findMany({
    where: {
      paymentStatus: PaymentStatus.PAID,
      createdAt: { gte: start, lte: now },
    },
    select: { createdAt: true, fareCents: true },
  });

  const buckets = new Map<string, number>(); // "Jan" -> cents
  for (const t of trips) {
    const label = t.createdAt.toLocaleDateString("en-US", { month: "short" });
    buckets.set(label, (buckets.get(label) ?? 0) + (t.fareCents ?? 0));
  }

  // Ensure Jan..Dec order (last 12 months)
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    labels.push(d.toLocaleDateString("en-US", { month: "short" }));
  }

  const points = labels.map((lab) => ({
    label: lab,
    value: Math.round((buckets.get(lab) ?? 0) / 100), // dollars for chart
  }));

  return res.json({ ok: true, points });
});

router.get("/payments", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const parsed = listQuerySchema.parse(req.query);
  const q = parsed.q.trim();
  const skip = (parsed.page - 1) * parsed.limit;

  const range = parsed.range;
  const { start, end } = getRange(range);

  const where: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { rider: { fullName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, trips] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.limit,
      select: {
        id: true,
        createdAt: true,
        fareCents: true,
        paymentStatus: true,
        rider: {
          select: {
            fullName: true,
            riderProfile: { select: { paymentMethod: true } },
          },
        },
      },
    }),
  ]);

  const rows = trips.map((t) => ({
    id: t.id,
    rider: t.rider?.fullName ?? "—",
    amount: usdFromCents(t.fareCents),
    date: formatShortDate(t.createdAt),
    method: t.rider?.riderProfile?.paymentMethod
      ? String(t.rider.riderProfile.paymentMethod)
      : "—",
    status: t.paymentStatus === PaymentStatus.PAID ? "Completed" : "Failed",
  }));

  return res.json({ ok: true, total, rows });
});

/* -------------------------------------------------------------------------- */
/*  Payouts (DriverWithdrawalRequest)                                         */
/* -------------------------------------------------------------------------- */

router.get("/payouts/summary", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const range = rangeSchema.parse(req.query.range);
  const { start, end } = getRange(range);

  const whereBase: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
  };

  const paidWhere = {
    ...whereBase,
    status: WithdrawalStatus.PAID,
  };

  const pendingWhere = {
    ...whereBase,
    status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
  };

  const failedWhere = {
    ...whereBase,
    status: {
      in: [
        WithdrawalStatus.FAILED,
        WithdrawalStatus.REJECTED,
        WithdrawalStatus.CANCELLED,
      ],
    },
  };

  const [driversPaidAgg, totalPaidAgg, pendingCount, failedCount] =
    await Promise.all([
      prisma.driverWithdrawalRequest.findMany({
        where: paidWhere,
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.driverWithdrawalRequest.aggregate({
        where: paidWhere,
        _sum: { amountCents: true },
      }),
      prisma.driverWithdrawalRequest.count({ where: pendingWhere }),
      prisma.driverWithdrawalRequest.count({ where: failedWhere }),
    ]);

  return res.json({
    ok: true,
    stats: {
      totalDriversPaid: driversPaidAgg.length,
      totalPaidAmount: usdFromCents(totalPaidAgg._sum.amountCents ?? 0),
      pendingPayouts: pendingCount,
      failedPayouts: failedCount,
    },
  });
});

router.get("/payouts/by-driver", requireAuth, async (_req, res) => {
  // Chart: sum paid amount by driver (last 12 drivers)
  // (No range for now; easy extension later)
  const group = await prisma.driverWithdrawalRequest.groupBy({
    by: ["userId"],
    where: { status: WithdrawalStatus.PAID },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
    take: 12,
  });

  const ids = group.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true },
  });
  const map = new Map(users.map((u) => [u.id, u.fullName]));

  const points = group.map((g) => ({
    label: map.get(g.userId) ?? "Unknown",
    value: Math.round(((g._sum.amountCents ?? 0) / 100) as number),
  }));

  return res.json({ ok: true, points });
});

router.get("/payouts", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const parsed = listQuerySchema.parse(req.query);
  const q = parsed.q.trim();
  const skip = (parsed.page - 1) * parsed.limit;

  const range = parsed.range;
  const { start, end } = getRange(range);

  const where: any = {
    ...(start ? { createdAt: { gte: start, lte: end } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { user: { fullName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, payouts] = await Promise.all([
    prisma.driverWithdrawalRequest.count({ where }),
    prisma.driverWithdrawalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.limit,
      select: {
        id: true,
        amountCents: true,
        createdAt: true,
        status: true,
        user: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  const rows = payouts.map((p) => ({
    id: p.id,
    driver: p.user?.fullName ?? "—",
    amount: usdFromCents(p.amountCents),
    date: formatShortDate(p.createdAt),
    rides: 0, // schema does not store rides per payout; keep 0 or compute later
    status:
      p.status === WithdrawalStatus.PAID
        ? "Completed"
        : p.status === WithdrawalStatus.PENDING || p.status === WithdrawalStatus.PROCESSING
        ? "Pending"
        : "Failed",
  }));

  return res.json({ ok: true, total, rows });
});

/* -------------------------------------------------------------------------- */
/*  Users                                                                     */
/* -------------------------------------------------------------------------- */

router.get("/users/summary", requireAuth, async (_req, res) => {
  const [riders, drivers] = await Promise.all([
    prisma.user.count({ where: { role: Role.RIDER } }),
    prisma.user.count({ where: { role: Role.DRIVER } }),
  ]);

  // Best mapping with existing schema:
  // rider verified -> riderProfile.otpVerifiedAt not null
  // driver verified -> driverProfile.onboardingCompletedAt not null
  const [verifiedRiders, verifiedDrivers] = await Promise.all([
    prisma.user.count({
      where: { role: Role.RIDER, riderProfile: { otpVerifiedAt: { not: null } } },
    }),
    prisma.user.count({
      where: { role: Role.DRIVER, driverProfile: { onboardingCompletedAt: { not: null } } },
    }),
  ]);

  const verified = verifiedRiders + verifiedDrivers;
  const underReview = riders + drivers - verified;

  return res.json({
    ok: true,
    stats: {
      totalRegisteredRiders: riders,
      totalRegisteredDrivers: drivers,
      verifiedUsers: verified,
      usersUnderReview: underReview,
    },
  });
});

router.get("/users", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const parsed = listQuerySchema.parse(req.query);
  const q = parsed.q.trim();
  const skip = (parsed.page - 1) * parsed.limit;

  const where: any = {
    role: { in: [Role.RIDER, Role.DRIVER] },
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.limit,
      select: {
        id: true,
        fullName: true,
        role: true,
        createdAt: true,
        riderProfile: { select: { otpVerifiedAt: true } },
        driverProfile: { select: { onboardingCompletedAt: true } },
      },
    }),
  ]);

  // last ride: for riders only (cheap + reliable)
  const riderIds = users.filter((u) => u.role === Role.RIDER).map((u) => u.id);
  const lastRides = await prisma.trip.groupBy({
    by: ["riderId"],
    where: { riderId: { in: riderIds } },
    _max: { createdAt: true },
  });
  const lastRideMap = new Map(lastRides.map((r) => [r.riderId, r._max.createdAt]));

  const rows = users.map((u) => {
    const isVerified =
      (u.role === Role.RIDER && u.riderProfile?.otpVerifiedAt) ||
      (u.role === Role.DRIVER && u.driverProfile?.onboardingCompletedAt);

    const lastRideDate =
      u.role === Role.RIDER ? lastRideMap.get(u.id) ?? null : null;

    return {
      id: u.fullName, // UI column says "User", so show name
      type: u.role === Role.DRIVER ? "Driver" : "Rider",
      lastRide: lastRideDate ? formatShortDate(lastRideDate) : "—",
      joined: formatShortDate(u.createdAt),
      status: isVerified ? "Verified" : "Under review",
    };
  });

  return res.json({ ok: true, total, rows });
});

/* -------------------------------------------------------------------------- */
/*  Export CSV                                                                */
/* -------------------------------------------------------------------------- */

router.get("/export", requireAuth, async (req, res) => {
  if (!assertAdmin(req, res)) return;

  const tab = z.enum(["rides", "payments", "payouts", "users"]).parse(req.query.tab);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const range = rangeSchema.parse(req.query.range);
  const { start, end } = getRange(range);

  const filename = `occ-${tab}-export.csv`;

  let csv = "";
  if (tab === "rides") {
    const where: any = {
      ...(start ? { createdAt: { gte: start, lte: end } } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { rider: { fullName: { contains: q, mode: "insensitive" } } },
              { driver: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        status: true,
        createdAt: true,
        fareCents: true,
        rider: { select: { fullName: true } },
        driver: { select: { fullName: true } },
      },
    });

    const rows = trips.map((t) => ({
      RideID: t.id,
      Rider: t.rider?.fullName ?? "",
      Driver: t.driver?.fullName ?? "",
      Date: formatShortDate(t.createdAt),
      Status: t.status,
      Fare: usdFromCents(t.fareCents),
    }));

    csv = toCsv(rows, ["RideID", "Rider", "Driver", "Date", "Status", "Fare"]);
  }

  if (tab === "payments") {
    const where: any = {
      ...(start ? { createdAt: { gte: start, lte: end } } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { rider: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        createdAt: true,
        fareCents: true,
        paymentStatus: true,
        rider: {
          select: { fullName: true, riderProfile: { select: { paymentMethod: true } } },
        },
      },
    });

    const rows = trips.map((t) => ({
      TransactionID: t.id,
      Rider: t.rider?.fullName ?? "",
      Amount: usdFromCents(t.fareCents),
      Date: formatShortDate(t.createdAt),
      Method: t.rider?.riderProfile?.paymentMethod
        ? String(t.rider.riderProfile.paymentMethod)
        : "",
      Status: t.paymentStatus,
    }));

    csv = toCsv(rows, ["TransactionID", "Rider", "Amount", "Date", "Method", "Status"]);
  }

  if (tab === "payouts") {
    const where: any = {
      ...(start ? { createdAt: { gte: start, lte: end } } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const payouts = await prisma.driverWithdrawalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        createdAt: true,
        amountCents: true,
        status: true,
        user: { select: { fullName: true } },
      },
    });

    const rows = payouts.map((p) => ({
      PayoutID: p.id,
      Driver: p.user?.fullName ?? "",
      Amount: usdFromCents(p.amountCents),
      Date: formatShortDate(p.createdAt),
      Status: p.status,
    }));

    csv = toCsv(rows, ["PayoutID", "Driver", "Amount", "Date", "Status"]);
  }

  if (tab === "users") {
    const where: any = {
      role: { in: [Role.RIDER, Role.DRIVER] },
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { fullName: true, email: true, role: true, createdAt: true },
    });

    const rows = users.map((u) => ({
      Name: u.fullName,
      Email: u.email,
      Role: u.role,
      Joined: formatShortDate(u.createdAt),
    }));

    csv = toCsv(rows, ["Name", "Email", "Role", "Joined"]);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
});

export default router;
