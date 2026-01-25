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
      // ✅ include REJECTED too so it still stays "Under review"
      where: { status: { in: ["PENDING", "REJECTED"] } },
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
 * Routes:
 *   GET    /admin/users/overview
 *   GET    /admin/users/list
 *   GET    /admin/users/documents
 *   PATCH  /admin/users/documents/:docId
 *   DELETE /admin/users/:id
 *   GET    /admin/users/drivers/:id
 *   GET    /admin/users/riders/:id
 */

router.get("/overview", requireAuth(), requireAdmin, async (_req, res) => {
  const underReview = await getDriversUnderReviewSet();

  const [totalUsers, suspendedDrivers, verifiedDrivers, topEarners] = await Promise.all([
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
          { documentsV2: { none: { status: { in: ["PENDING", "REJECTED"] } } } },
        ],
      },
    }),

    (async () => {
      const monthStart = startOfMonth(new Date());

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

  const roles: Role[] =
    tab === "drivers" ? ["DRIVER"] : tab === "riders" ? ["RIDER"] : ["DRIVER", "RIDER"];

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
    (prisma.user.findMany({
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
    }) as Promise<Row[]>),
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

/* -------------------------------------------------------------------------- */
/*  ✅ DOCUMENTS LIST (ALL DRIVERS)                                            */
/* -------------------------------------------------------------------------- */
router.get("/documents", requireAuth(), requireAdmin, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const status = String(req.query.status ?? "").trim().toUpperCase(); // PENDING/VERIFIED/REJECTED
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 10)));
  const skip = (page - 1) * limit;

  // Filter drivers by search (name/email) -> get userIds -> driverProfile ids -> driverDocument
  let driverProfileIds: string[] | null = null;

  if (q) {
    const users = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 500,
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return res.json({ ok: true, page, limit, total: 0, documents: [] });
    }

    const profiles = await prisma.driverProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });

    driverProfileIds = profiles.map((p) => p.id);
    if (driverProfileIds.length === 0) {
      return res.json({ ok: true, page, limit, total: 0, documents: [] });
    }
  }

  const where: Prisma.DriverDocumentWhereInput = {
    ...(status && status !== "ALL" ? { status: status as any } : {}),
    ...(driverProfileIds ? { driverId: { in: driverProfileIds } } : {}),
  };

  const [total, docs] = await Promise.all([
    prisma.driverDocument.count({ where }),
    prisma.driverDocument.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        url: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        driver: { select: { userId: true } },
      },
    }),
  ]);

  const userIds = Array.from(new Set(docs.map((d) => d.driver.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true },
  });
  const map = new Map(users.map((u) => [u.id, u]));

  const out = docs.map((d) => {
    const u = map.get(d.driver.userId);
    return {
      id: d.id,
      type: d.type,
      url: d.url,
      status: d.status as any,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      driver: {
        userId: d.driver.userId,
        fullName: u?.fullName ?? "Unknown",
        email: u?.email ?? "Unknown",
      },
    };
  });

  return res.json({ ok: true, page, limit, total, documents: out });
});

/* -------------------------------------------------------------------------- */
/*  ✅ VERIFY / REJECT DOCUMENT                                                */
/* -------------------------------------------------------------------------- */
router.patch("/documents/:docId", requireAuth(), requireAdmin, async (req, res) => {
  const docId = String(req.params.docId);
  const status = String(req.body?.status ?? "").toUpperCase();

  if (!["VERIFIED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "BAD_STATUS" });
  }

  const doc = await prisma.driverDocument.findUnique({
    where: { id: docId },
    select: { id: true, driverId: true },
  });

  if (!doc) return res.status(404).json({ error: "DOC_NOT_FOUND" });

  await prisma.driverDocument.update({
    where: { id: docId },
    data: { status: status as any },
  });

  return res.json({ ok: true });
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

/* -------------------------------------------------------------------------- */
/*  ✅ DELETE USER                                                             */
/* -------------------------------------------------------------------------- */
router.delete("/:id", requireAuth(), requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user) return res.status(404).json({ error: "NOT_FOUND" });
  if (user.role !== "DRIVER" && user.role !== "RIDER") {
    return res.status(400).json({ error: "CANNOT_DELETE_ROLE" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (user.role === "DRIVER") {
        const dp = await tx.driverProfile.findUnique({ where: { userId: id }, select: { id: true } });

        // keep historical trips but unassign driver (driverId is nullable in your code)
        await tx.trip.updateMany({ where: { driverId: id }, data: { driverId: null } });

        if (dp) {
          await tx.driverDocument.deleteMany({ where: { driverId: dp.id } });
          await tx.driverPreferences.deleteMany({ where: { driverId: dp.id } });
          await tx.vehicle.deleteMany({ where: { driverId: dp.id } });
          await tx.workLocationChangeRequest.deleteMany({ where: { driverId: dp.id } });
        }

        // support conversations (driverId = userId in your driverProfile.ts)
        const convs = await tx.supportConversation.findMany({ where: { driverId: id }, select: { id: true } });
        const convIds = convs.map((c) => c.id);
        if (convIds.length) {
          await tx.supportMessage.deleteMany({ where: { conversationId: { in: convIds } } });
          await tx.supportConversation.deleteMany({ where: { id: { in: convIds } } });
        }

        await tx.driverEarningTransaction.deleteMany({ where: { userId: id } });
        await tx.driverWallet.deleteMany({ where: { userId: id } });
        await tx.tripReview.deleteMany({ where: { OR: [{ revieweeId: id }, { reviewerId: id }] } });

        await tx.driverProfile.deleteMany({ where: { userId: id } });
      }

      if (user.role === "RIDER") {
        // riderId likely non-null => delete their trips
        await tx.trip.deleteMany({ where: { riderId: id } });
        await tx.tripReview.deleteMany({ where: { OR: [{ revieweeId: id }, { reviewerId: id }] } });
        await tx.riderProfile.deleteMany({ where: { userId: id } });
      }

      await tx.user.delete({ where: { id } });
    });

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: "DELETE_FAILED", message: e?.message || "Failed to delete user" });
  }
});

export default router;
