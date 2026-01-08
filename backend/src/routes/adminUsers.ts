// backend/src/routes/adminUsers.ts
import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { Prisma, Role } from "@prisma/client";

const router = Router();

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function lastNDays(n: number) {
  const days: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getDriversUnderReviewSet() {
  const [pendingDocs, pendingWork] = await Promise.all([
    prisma.driverDocument.findMany({
      where: { status: "PENDING" },
      select: { driver: { select: { userId: true } } },
    }),
    prisma.workLocationChangeRequest.findMany({
      where: { status: "PENDING" },
      select: { driver: { select: { userId: true } } },
    }),
  ]);

  const set = new Set<string>();
  for (const r of pendingDocs) set.add(r.driver.userId);
  for (const r of pendingWork) set.add(r.driver.userId);

  return set;
}

/**
 * Mounted in app.ts as:
 *   app.use("/admin/users", adminUsersRouter);
 *
 * So routes are:
 *   GET /admin/users/overview
 *   GET /admin/users/list
 *   GET /admin/users/drivers/:id
 *   GET /admin/users/riders/:id
 */

router.get("/overview", requireAuth(), requireAdmin, async (_req, res) => {
  const underReview = await getDriversUnderReviewSet();

  const [totalUsers, suspendedDrivers, verifiedDrivers, topEarners] =
    await Promise.all([
      prisma.user.count({
        where: { role: { in: ["DRIVER", "RIDER"] } },
      }),

      prisma.driverProfile.count({
        where: { driverStatus: "INACTIVE" },
      }),

      prisma.driverProfile.count({
        where: {
          onboardingCompletedAt: { not: null },
          driverStatus: { not: "INACTIVE" },
          AND: [
            { documentsV2: { some: { status: "VERIFIED" } } },
            { documentsV2: { none: { status: "PENDING" } } },
          ],
        },
      }),

      (async () => {
        const monthStart = startOfMonth(new Date());

        // Prefer DriverEarningTransaction (real revenue)
        const grouped = await prisma.driverEarningTransaction.groupBy({
          by: ["userId"],
          where: {
            createdAt: { gte: monthStart },
            direction: "CREDIT",
          },
          _sum: { amountCents: true },
          orderBy: { _sum: { amountCents: "desc" } },
          take: 12,
        });

        let rows = grouped
          .map((g) => ({
            userId: g.userId,
            valueCents: g._sum.amountCents ?? 0,
          }))
          .filter((x) => x.valueCents > 0);

        // Fallback: sum Trip.fareCents if no earning transactions exist yet
        if (rows.length === 0) {
          const groupedTrips = await prisma.trip.groupBy({
            by: ["driverId"],
            where: {
              driverId: { not: null },
              status: "COMPLETED",
              createdAt: { gte: monthStart },
            },
            _sum: { fareCents: true },
            orderBy: { _sum: { fareCents: "desc" } },
            take: 12,
          });

          rows = groupedTrips
            .map((g) => ({
              userId: g.driverId as string,
              valueCents: g._sum.fareCents ?? 0,
            }))
            .filter((x) => x.valueCents > 0);
        }

        const ids = rows.map((r) => r.userId);
        const users = await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, fullName: true },
        });

        const nameById = new Map(users.map((u) => [u.id, u.fullName]));

        return rows.map((r) => ({
          name: nameById.get(r.userId) ?? "Unknown",
          valueCents: r.valueCents,
        }));
      })(),
    ]);

  return res.json({
    ok: true,
    stats: {
      totalUsers,
      usersUnderReview: underReview.size,
      verifiedDrivers,
      suspendedDrivers,
    },
    topEarningDrivers: topEarners,
  });
});

router.get("/list", requireAuth(), requireAdmin, async (req, res) => {
  const tab = String(req.query.tab ?? "all");
  const q = String(req.query.q ?? "").trim();
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 10)));
  const skip = (page - 1) * limit;

  // ✅ make it mutable (no readonly tuple)
  const roles: Role[] =
    tab === "drivers"
      ? ["DRIVER"]
      : tab === "riders"
      ? ["RIDER"]
      : ["DRIVER", "RIDER"];

  const where: Prisma.UserWhereInput = {
    role: { in: roles },
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const underReview = await getDriversUnderReviewSet();

  type Row = Prisma.UserGetPayload<{
    select: {
      id: true;
      fullName: true;
      email: true;
      role: true;
      updatedAt: true;
      driverProfile: { select: { driverStatus: true } };
    };
  }>;

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true,
        driverProfile: { select: { driverStatus: true } },
      },
    }) as Promise<Row[]>,
  ]);

  const users = rows.map((u) => {
    let status = "Active";

    if (u.role === "DRIVER") {
      if (u.driverProfile?.driverStatus === "INACTIVE") status = "Suspended";
      else if (underReview.has(u.id)) status = "Under review";
      else if (u.driverProfile?.driverStatus === "OCCUPIED") status = "Occupied";
      else status = "Active";
    }

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status,
      lastActivity: u.updatedAt.toISOString(),
    };
  });

  return res.json({ ok: true, page, limit, total, users });
});

router.get("/drivers/:id", requireAuth(), requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      driverProfile: {
        include: {
          vehicle: true,
          documents: true,
          documentsV2: true,
        },
      },
      driverWallet: true,
    },
  });

  if (!user || user.role !== "DRIVER") {
    return res.status(404).json({ error: "DRIVER_NOT_FOUND" });
  }

  const driverProfile = user.driverProfile;

  const [totalRides, ridesCompleted, ridesCancelled] = await Promise.all([
    prisma.trip.count({ where: { driverId: id } }),
    prisma.trip.count({ where: { driverId: id, status: "COMPLETED" } }),
    prisma.trip.count({ where: { driverId: id, status: "CANCELLED" } }),
  ]);

  const avatarUrl =
    driverProfile?.avatarUrl ||
    driverProfile?.documents?.selfieUrl ||
    driverProfile?.documents?.governmentIdUrl ||
    null;

  const trips = await prisma.trip.findMany({
    where: { driverId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { rider: { select: { fullName: true } } },
  });

  const days = lastNDays(13);
  const start = days[0];

  const tx = await prisma.driverEarningTransaction.findMany({
    where: { userId: id, direction: "CREDIT", createdAt: { gte: start } },
    select: { amountCents: true, createdAt: true },
  });

  const seriesMap = new Map<string, number>();
  for (const d of days) seriesMap.set(ymd(d), 0);

  if (tx.length > 0) {
    for (const t of tx) {
      const key = ymd(startOfDay(t.createdAt));
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + t.amountCents);
    }
  } else {
    const fareTrips = await prisma.trip.findMany({
      where: { driverId: id, status: "COMPLETED", createdAt: { gte: start } },
      select: { fareCents: true, createdAt: true },
    });

    for (const t of fareTrips) {
      const key = ymd(startOfDay(t.createdAt));
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + (t.fareCents ?? 0));
    }
  }

  const revenueSeries = days.map((d) => ({
    day: String(d.getDate()),
    valueCents: seriesMap.get(ymd(d)) ?? 0,
  }));

  const totalEarningsCents =
    user.driverWallet?.lifetimeEarnedCents ??
    (await prisma.driverEarningTransaction.aggregate({
      where: { userId: id, direction: "CREDIT" },
      _sum: { amountCents: true },
    }))._sum.amountCents ??
    0;

  return res.json({
    ok: true,
    driver: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      phone: driverProfile?.phone ?? null,
      driverStatus: driverProfile?.driverStatus ?? "INACTIVE",
      avatarUrl,
      workSiteName: driverProfile?.workSiteName ?? null,
      workAddress: driverProfile?.workAddress ?? null,
      homeAddress: driverProfile?.locationText ?? null,
    },
    stats: { totalEarningsCents, totalRides, ridesCompleted, ridesCancelled },
    vehicle: driverProfile?.vehicle
      ? {
          make: driverProfile.vehicle.make,
          model: driverProfile.vehicle.model,
          year: driverProfile.vehicle.year,
          color: driverProfile.vehicle.color,
          licensePlate: driverProfile.vehicle.licensePlate,
          seats: driverProfile.vehicle.seats,
          imageUrl: driverProfile.vehicle.imageUrl,
        }
      : null,
    documents: (driverProfile?.documentsV2 ?? []).map((d) => ({
      id: d.id,
      type: d.type,
      url: d.url,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    rides: trips.map((t) => ({
      id: t.id,
      riderName: t.rider.fullName,
      pickup: t.pickupAddress,
      dropoff: t.dropoffAddress,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    revenueSeries,
  });
});

router.get("/riders/:id", requireAuth(), requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    include: { riderProfile: true },
  });

  if (!user || user.role !== "RIDER") {
    return res.status(404).json({ error: "RIDER_NOT_FOUND" });
  }

  const [totalRides, ridesCompleted, ridesCancelled, totalSpentAgg] = await Promise.all([
    prisma.trip.count({ where: { riderId: id } }),
    prisma.trip.count({ where: { riderId: id, status: "COMPLETED" } }),
    prisma.trip.count({ where: { riderId: id, status: "CANCELLED" } }),
    prisma.trip.aggregate({
      where: { riderId: id, status: "COMPLETED" },
      _sum: { fareCents: true },
    }),
  ]);

  const trips = await prisma.trip.findMany({
    where: { riderId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { driver: { select: { fullName: true } } },
  });

  const days = lastNDays(13);
  const start = days[0];

  const fareTrips = await prisma.trip.findMany({
    where: { riderId: id, status: "COMPLETED", createdAt: { gte: start } },
    select: { fareCents: true, createdAt: true },
  });

  const seriesMap = new Map<string, number>();
  for (const d of days) seriesMap.set(ymd(d), 0);

  for (const t of fareTrips) {
    const key = ymd(startOfDay(t.createdAt));
    seriesMap.set(key, (seriesMap.get(key) ?? 0) + (t.fareCents ?? 0));
  }

  const spendSeries = days.map((d) => ({
    day: String(d.getDate()),
    valueCents: seriesMap.get(ymd(d)) ?? 0,
  }));

  return res.json({
    ok: true,
    rider: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      phone: user.riderProfile?.phone ?? null,
      homeAddress: user.riderProfile?.locationText ?? null,
      workAddress: null,
    },
    stats: {
      totalSpentCents: totalSpentAgg._sum.fareCents ?? 0,
      totalRides,
      ridesCompleted,
      ridesCancelled,
    },
    rides: trips.map((t) => ({
      id: t.id,
      driverName: t.driver?.fullName ?? "Unassigned",
      pickup: t.pickupAddress,
      dropoff: t.dropoffAddress,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    spendSeries,
  });
});

export default router;
