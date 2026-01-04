import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  WithdrawalStatus,
  EarningDirection,
  EarningTransactionType,
  PayoutMethod,
} from "@prisma/client";

const router = Router();

// ✅ Protect everything in this router for DRIVER only
router.use(requireAuth(["DRIVER"]));

// ✅ Export BOTH ways so app.ts can import named or default
export const driverEarningsRouter = router;
export default router;

// ---------- helpers ----------
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

async function getOrCreateWallet(userId: string) {
  return prisma.driverWallet.upsert({
    where: { userId },
    update: {},
    create: { userId, currency: "USD", availableCents: 0 },
  });
}

function toCentsFromUnknown(input: any) {
  // supports {amount: 40.25} OR {amountCents: 4025}
  if (input?.amountCents != null) {
    const n = Number(input.amountCents);
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }
  if (input?.amount != null) {
    const n = Number(input.amount);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }
  return null;
}

// ---------- routes ----------

// summary
router.get("/summary", async (req, res) => {
  const userId = req.user!.id;
  const wallet = await getOrCreateWallet(userId);

  return res.json({
    ok: true,
    currency: wallet.currency,
    availableCents: wallet.availableCents,
    lifetimeEarnedCents: wallet.lifetimeEarnedCents,
    lifetimeWithdrawnCents: wallet.lifetimeWithdrawnCents,
  });
});

// chart (monthly net)
router.get("/chart", async (req, res) => {
  const userId = req.user!.id;
  const year = Number(req.query.year) || new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ month: number; net_cents: bigint }[]>`
    SELECT
      EXTRACT(MONTH FROM "createdAt")::int AS month,
      SUM(
        CASE
          WHEN "direction" = 'CREDIT' THEN "amountCents"
          ELSE -"amountCents"
        END
      )::bigint AS net_cents
    FROM "DriverEarningTransaction"
    WHERE "userId" = ${userId}
      AND EXTRACT(YEAR FROM "createdAt")::int = ${year}
    GROUP BY 1
    ORDER BY 1
  `;

  const monthLabels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.month, Number(r.net_cents));

  const points = monthLabels.map((m, idx) => ({
    month: m,
    netCents: map.get(idx + 1) ?? 0,
  }));

  return res.json({ ok: true, year, points });
});

// transactions (cursor pagination)
router.get("/transactions", async (req, res) => {
  const userId = req.user!.id;
  const limit = clampLimit(req.query.limit, 1, 50, 20);

  const cursor =
    typeof req.query.cursor === "string" ? decodeCursor(req.query.cursor) : null;

  const where: any = { userId };

  if (cursor) {
    where.OR = [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ];
  }

  const txs = await prisma.driverEarningTransaction.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      type: true,
      direction: true,
      title: true,
      description: true,
      amountCents: true,
      createdAt: true,
    },
  });

  const hasMore = txs.length > limit;
  const items = hasMore ? txs.slice(0, limit) : txs;

  const nextCursor =
    hasMore && items.length
      ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
      : null;

  return res.json({ ok: true, nextCursor, transactions: items });
});

// payout methods
router.get("/payment-methods", async (req, res) => {
  const userId = req.user!.id;

  const methods = await prisma.driverPayoutMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: { id: true, type: true, label: true, subLabel: true, isDefault: true },
  });

  return res.json({ ok: true, methods });
});

// add payout method
router.post("/payment-methods", async (req, res) => {
  const userId = req.user!.id;
  const { type, label, subLabel, makeDefault } = req.body ?? {};

  if (!type || !label) {
    return res.status(400).json({ ok: false, error: "type and label are required" });
  }

  if (!Object.values(PayoutMethod).includes(type)) {
    return res.status(400).json({ ok: false, error: "Invalid payout method type" });
  }

  const created = await prisma.$transaction(async (tx) => {
    if (makeDefault === true) {
      await tx.driverPayoutMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.driverPayoutMethod.create({
      data: {
        userId,
        type,
        label,
        subLabel: subLabel ?? null,
        isDefault: makeDefault === true,
      },
      select: { id: true, type: true, label: true, subLabel: true, isDefault: true },
    });
  });

  return res.json({ ok: true, method: created });
});

// set default payout method
router.patch("/payment-methods/:id/default", async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const method = await prisma.driverPayoutMethod.findFirst({ where: { id, userId } });
  if (!method) return res.status(404).json({ ok: false, error: "Method not found" });

  await prisma.$transaction(async (tx) => {
    await tx.driverPayoutMethod.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.driverPayoutMethod.update({ where: { id }, data: { isDefault: true } });
  });

  return res.json({ ok: true });
});

// withdraw
router.post("/withdraw", async (req, res) => {
  const userId = req.user!.id;
  const { payoutMethodId } = req.body ?? {};

  const amountCents = toCentsFromUnknown(req.body);
  if (!amountCents || amountCents <= 0) {
    return res.status(400).json({ ok: false, error: "amount or amountCents must be a positive number" });
  }

  const method = await prisma.driverPayoutMethod.findFirst({
    where: { id: payoutMethodId, userId },
  });

  if (!method) return res.status(404).json({ ok: false, error: "Payout method not found" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.driverWallet.upsert({
        where: { userId },
        update: {},
        create: { userId, currency: "USD", availableCents: 0 },
      });

      if (wallet.availableCents < amountCents) {
        return null;
      }

      const withdrawal = await tx.driverWithdrawalRequest.create({
        data: {
          walletId: wallet.id,
          userId,
          payoutMethodId: method.id,
          amountCents,
          status: WithdrawalStatus.PENDING,
        },
        select: { id: true, amountCents: true, status: true, createdAt: true },
      });

      await tx.driverEarningTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: EarningTransactionType.WITHDRAWAL,
          direction: EarningDirection.DEBIT,
          title: "Withdrawal",
          description: `Withdrawal to ${String(method.type)}`,
          amountCents,
          withdrawalId: withdrawal.id,
        },
      });

      const updated = await tx.driverWallet.update({
        where: { id: wallet.id },
        data: {
          availableCents: { decrement: amountCents },
          lifetimeWithdrawnCents: { increment: amountCents },
        },
        select: { availableCents: true, currency: true },
      });

      return { withdrawal, wallet: updated };
    });

    if (!result) return res.status(400).json({ ok: false, error: "Insufficient balance" });

    return res.json({ ok: true, withdrawal: result.withdrawal, wallet: result.wallet });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "WITHDRAW_FAILED" });
  }
});
