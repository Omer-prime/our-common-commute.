import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const r = Router();

function requireDriver(req: any, res: any, next: any) {
  if (req.user?.role !== "DRIVER") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thur: 4,
  Fri: 5,
  Sat: 6,
};

function parseHHMM(hhmm?: string | null) {
  if (!hhmm) return null;
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function buildNextShifts(profile: any, limit = 4) {
  const now = new Date();

  const days = Array.isArray(profile.workDays) ? profile.workDays : [];
  const workDayNums = days.map((d: string) => DAY_INDEX[d]).filter((n: any) => Number.isInteger(n));

  const start = parseHHMM(profile.shiftStart) ?? { h: 9, min: 0 };
  const end = parseHHMM(profile.shiftEnd) ?? { h: 17, min: 0 };

  const results: Array<{
    workLocation: string | null;
    startAt: string;
    endAt: string;
  }> = [];

  if (workDayNums.length === 0) {
    // fallback: show tomorrow as a sample shift so UI doesn't look empty
    const s = addDays(now, 1);
    s.setHours(start.h, start.min, 0, 0);
    const e = new Date(s);
    e.setHours(end.h, end.min, 0, 0);
    return [{ workLocation: profile.primaryWorkLocation ?? null, startAt: s.toISOString(), endAt: e.toISOString() }];
  }

  // scan next 21 days to pick upcoming shifts
  for (let i = 0; i < 21 && results.length < limit; i++) {
    const day = addDays(now, i);
    if (!workDayNums.includes(day.getDay())) continue;

    const s = new Date(day);
    s.setHours(start.h, start.min, 0, 0);

    // if today & already passed, skip
    if (i === 0 && s <= now) continue;

    const e = new Date(day);
    e.setHours(end.h, end.min, 0, 0);

    results.push({
      workLocation: profile.primaryWorkLocation ?? null,
      startAt: s.toISOString(),
      endAt: e.toISOString(),
    });
  }

  return results;
}

// GET dashboard home data
r.get("/home", requireAuth, requireDriver, async (req: any, res) => {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: true },
  });

  if (!profile) return res.status(404).json({ error: "PROFILE_NOT_FOUND" });

  // NOTE: You don't have rides/payout tables yet, so we return zeros for now.
  // When you add Ride + Payout models later, we will compute real counts here.
  const stats = {
    completedRides: 0,
    ridesScheduled: 0,
    upcomingRide: 0,
    pendingPayoutCents: 0,
    totalEarnedCents: 0,
  };

  const nextShifts = buildNextShifts(profile, 4);

  return res.json({
    ok: true,
    driver: {
      fullName: profile.user.fullName,
      status: profile.driverStatus, // ACTIVE | INACTIVE | OCCUPIED
    },
    stats,
    nextShifts,
    currentRide: null, // later
    rideRequests: [], // later
  });
});

// Update driver status (tabs: active/occupied/inactive)
r.put("/status", requireAuth, requireDriver, async (req: any, res) => {
  const { status } = req.body as { status?: "ACTIVE" | "INACTIVE" | "OCCUPIED" };

  if (!status || !["ACTIVE", "INACTIVE", "OCCUPIED"].includes(status)) {
    return res.status(400).json({ error: "BAD_STATUS" });
  }

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: { driverStatus: status },
  });

  return res.json({ ok: true, status: profile.driverStatus });
});

export default r;
