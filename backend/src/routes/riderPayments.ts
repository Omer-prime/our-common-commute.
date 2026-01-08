import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role, RiderPaymentMethod, PaymentStatus, TripStatus } from "@prisma/client";

const router = Router();

type UiPaymentMethod = {
  id: string;
  type: "apple-pay" | "paypal" | "card";
  label: string;
  description: string;
  isDefault?: boolean;
};

type UiTransaction = {
  id: string;
  title: string;
  dateLabel: string;
  fare: number;
  fee: number;
  methodLabel: string;
  status: "Completed" | "Pending";
};

function fmtDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentMethodToUi(pm: RiderPaymentMethod | null, userEmail: string): UiPaymentMethod[] {
  if (!pm) return [];

  // Map DB enum → UI type/icon bucket
  const map: Record<RiderPaymentMethod, { type: UiPaymentMethod["type"]; label: string }> = {
    APPLE_PAY: { type: "apple-pay", label: "Apple Pay" },
    PAYPAL: { type: "paypal", label: "PayPal" },
    GPAY: { type: "card", label: "Google Pay" },
    CASHAPP: { type: "card", label: "Cash App" },
    CREDIT_CARD: { type: "card", label: "Credit card" },
  };

  const m = map[pm];

  return [
    {
      id: `pm-${pm.toLowerCase()}`,
      type: m.type,
      label: m.label,
      description: userEmail, // real data we have
      isDefault: true,
    },
  ];
}

function paymentMethodLabel(pm: RiderPaymentMethod | null) {
  if (!pm) return "No payment method";
  if (pm === "APPLE_PAY") return "Apple Pay";
  if (pm === "PAYPAL") return "PayPal";
  if (pm === "GPAY") return "Google Pay";
  if (pm === "CASHAPP") return "Cash App";
  return "Credit card";
}

/**
 * Mounted at: /api/rider/payments
 * GET /api/rider/payments
 */
router.get("/", requireAuth([Role.RIDER]), async (req, res) => {
  const riderId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: riderId },
    select: {
      id: true,
      email: true,
      fullName: true,
      riderProfile: { select: { paymentMethod: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: "USER_NOT_FOUND", methods: [], transactions: [] });
  }

  const pm = user.riderProfile?.paymentMethod ?? null;

  // Transactions come from trips (real DB)
  const trips = await prisma.trip.findMany({
    where: { riderId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      pickupAddress: true,
      dropoffAddress: true,
      fareCents: true,
      paymentStatus: true,
      status: true,
      createdAt: true,
      completedAt: true,
      cancelledAt: true,
      updatedAt: true,
    },
  });

  const methodLabel = paymentMethodLabel(pm);

  const transactions: UiTransaction[] = trips.map((t) => {
    const fare = Number((t.fareCents ?? 0) / 100);
    const status: UiTransaction["status"] =
      t.paymentStatus === PaymentStatus.PAID || t.status === TripStatus.COMPLETED
        ? "Completed"
        : "Pending";

    const date =
      t.completedAt ?? t.cancelledAt ?? t.updatedAt ?? t.createdAt;

    return {
      id: t.id,
      title: `${t.pickupAddress} → ${t.dropoffAddress}`,
      dateLabel: fmtDateTime(date),
      fare: Number(fare.toFixed(2)),
      fee: 0, // schema has no fee field, so keep it real (0)
      methodLabel,
      status,
    };
  });

  const methods = paymentMethodToUi(pm, user.email);

  return res.json({
    ok: true,
    user: { id: user.id, fullName: user.fullName, email: user.email },
    methods,
    transactions,
  });
});

export default router;
