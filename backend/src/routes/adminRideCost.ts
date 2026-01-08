// backend/src/routes/adminRideCost.ts
import { Router } from "express";
import { Role, FareRuleStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function toInt(v: any, fallback: number) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

/**
 * GET /admin/ride-cost/overview
 * Top stats:
 * - Total rides (COMPLETED)
 * - Total revenues (sum fareCents for COMPLETED + PAID)
 * - Current price per ride (active FareRule)
 * - Current driver payout (active FareRule)
 */
router.get("/overview", requireAuth([Role.ADMIN]), async (_req, res) => {
  const [totalRides, revenueAgg, activeRule] = await Promise.all([
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.trip.aggregate({
      where: { status: "COMPLETED", paymentStatus: "PAID" },
      _sum: { fareCents: true },
    }),
    prisma.fareRule.findFirst({
      where: { status: FareRuleStatus.ACTIVE },
      orderBy: { effectiveAt: "desc" },
    }),
  ]);

  return res.json({
    ok: true,
    stats: {
      totalRides,
      totalRevenueCents: revenueAgg._sum.fareCents ?? 0,
      currentRideFareCents: activeRule?.rideFareCents ?? 0,
      currentDriverPayoutCents: activeRule?.driverPayoutCents ?? 0,
    },
  });
});

/**
 * GET /admin/ride-cost/rules
 * Query:
 * - amount=all|low|high (low < $10, high >= $10)
 * - date=scheduled|effective (sorting)
 * - q=search
 * - page, limit
 */
router.get("/rules", requireAuth([Role.ADMIN]), async (req, res) => {
  const amount = String(req.query.amount ?? "all");
  const date = String(req.query.date ?? "scheduled");
  const q = String(req.query.q ?? "").trim();

  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 10)));
  const skip = (page - 1) * limit;

  const where: any = {};

  // amount filter (threshold = $10)
  if (amount === "low") where.rideFareCents = { lt: 1000 };
  if (amount === "high") where.rideFareCents = { gte: 1000 };

  // search
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { createdBy: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orderBy =
    date === "effective"
      ? [{ effectiveAt: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [total, rows] = await Promise.all([
    prisma.fareRule.count({ where }),
    prisma.fareRule.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        createdBy: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  return res.json({
    ok: true,
    page,
    limit,
    total,
    rows: rows.map((r) => ({
      id: r.id,
      createdBy: r.createdBy?.fullName ?? "Admin",
      createdAt: r.createdAt.toISOString(),
      effectiveAt: r.effectiveAt.toISOString(),
      rideFareCents: r.rideFareCents,
      driverPayoutCents: r.driverPayoutCents,
      transactionFeeCents: r.transactionFeeCents ?? null,
      status: r.status,
    })),
  });
});

/**
 * POST /admin/ride-cost/rules
 * Body:
 * - rideFareCents
 * - driverPayoutCents
 * - effectiveAt (ISO or YYYY-MM-DD)
 * - transactionFeeCents? (nullable)
 *
 * Behavior:
 * - creates new ACTIVE rule
 * - deactivates any previous ACTIVE rule
 */
router.post("/rules", requireAuth([Role.ADMIN]), async (req, res) => {
  const rideFareCents = toInt(req.body?.rideFareCents, 0);
  const driverPayoutCents = toInt(req.body?.driverPayoutCents, 0);

  const transactionFeeCentsRaw = req.body?.transactionFeeCents;
  const transactionFeeCents =
    transactionFeeCentsRaw === null || transactionFeeCentsRaw === undefined || transactionFeeCentsRaw === ""
      ? null
      : toInt(transactionFeeCentsRaw, 0);

  const effectiveAt = new Date(String(req.body?.effectiveAt ?? ""));

  if (!rideFareCents || !driverPayoutCents || !isValidDate(effectiveAt)) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  if (driverPayoutCents > rideFareCents) {
    return res.status(400).json({ ok: false, error: "PAYOUT_EXCEEDS_FARE" });
  }

  if (transactionFeeCents !== null && transactionFeeCents < 0) {
    return res.status(400).json({ ok: false, error: "INVALID_FEE" });
  }

  const userId = req.user!.id;

  const created = await prisma.$transaction(async (tx) => {
    await tx.fareRule.updateMany({
      where: { status: FareRuleStatus.ACTIVE },
      data: { status: FareRuleStatus.INACTIVE },
    });

    return tx.fareRule.create({
      data: {
        createdById: userId,
        effectiveAt,
        rideFareCents,
        driverPayoutCents,
        transactionFeeCents,
        status: FareRuleStatus.ACTIVE,
      },
    });
  });

  return res.json({ ok: true, rule: created });
});

/**
 * PATCH /admin/ride-cost/rules/:id
 * Body can include:
 * - rideFareCents
 * - driverPayoutCents
 * - effectiveAt
 * - transactionFeeCents (null allowed)
 * - status (ACTIVE/INACTIVE) optional
 */
router.patch("/rules/:id", requireAuth([Role.ADMIN]), async (req, res) => {
  const id = String(req.params.id);

  const existing = await prisma.fareRule.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

  const rideFareCents =
    req.body?.rideFareCents === undefined ? existing.rideFareCents : toInt(req.body.rideFareCents, 0);
  const driverPayoutCents =
    req.body?.driverPayoutCents === undefined ? existing.driverPayoutCents : toInt(req.body.driverPayoutCents, 0);

  const transactionFeeCents =
    req.body?.transactionFeeCents === undefined
      ? existing.transactionFeeCents
      : req.body.transactionFeeCents === null || req.body.transactionFeeCents === ""
        ? null
        : toInt(req.body.transactionFeeCents, 0);

  const effectiveAt =
    req.body?.effectiveAt === undefined ? existing.effectiveAt : new Date(String(req.body.effectiveAt));

  const status =
    req.body?.status === undefined ? existing.status : (String(req.body.status) as FareRuleStatus);

  if (!rideFareCents || !driverPayoutCents || !isValidDate(effectiveAt)) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  if (driverPayoutCents > rideFareCents) {
    return res.status(400).json({ ok: false, error: "PAYOUT_EXCEEDS_FARE" });
  }

  if (transactionFeeCents !== null && (transactionFeeCents as number) < 0) {
    return res.status(400).json({ ok: false, error: "INVALID_FEE" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // if making ACTIVE, deactivate others
    if (status === FareRuleStatus.ACTIVE) {
      await tx.fareRule.updateMany({
        where: { status: FareRuleStatus.ACTIVE, NOT: { id } },
        data: { status: FareRuleStatus.INACTIVE },
      });
    }

    return tx.fareRule.update({
      where: { id },
      data: {
        rideFareCents,
        driverPayoutCents,
        transactionFeeCents,
        effectiveAt,
        status,
      },
    });
  });

  return res.json({ ok: true, rule: updated });
});

export default router;
