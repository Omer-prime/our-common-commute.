import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs/promises";

import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

type AuthedReq = Request & { user?: { id: string; role?: string } };

function clampInt(v: any, fallback: number, min = 1, max = 200) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function ensureString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

async function requireAdmin(req: AuthedReq, res: Response, next: NextFunction) {
  try {
    // requireAuth should set req.user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Missing JWT" });
    }

    // enforce ADMIN from DB (don’t trust token role only)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (user.role !== "ADMIN") return res.status(403).json({ ok: false, error: "Forbidden" });

    // normalize req.user
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
}

async function getOrCreateGlobalSettings() {
  return prisma.adminSettings.upsert({
    where: { key: "GLOBAL" },
    create: {
      key: "GLOBAL",
      compliance: {
        requiredDocuments: ["Passport", "ID card", "National Passport"],
        verificationLevel: "Advanced",
        aml: { flagAboveUsd: 5000, dailyLimitUsd: 10 },
        require2FAForWithdrawal: true,
      },
      notifications: {
        alerts: {
          transaction: true,
          price: true,
          security: true,
          system: true,
          referrals: true,
        },
        deliveryEnabled: true,
        deliveryChannel: "push",
      },
      customization: {
        logos: { lightUrl: null, darkUrl: null },
        currency: { enabled: ["USD", "CAD", "EUR", "GBP"], default: "USD" },
        language: { enabled: ["English"], default: "English" },
        widgets: { enabled: ["portfolio", "referrals", "crypto", "recent"] },
      },
    },
    update: {},
    select: {
      id: true,
      key: true,
      compliance: true,
      notifications: true,
      customization: true,
      updatedAt: true,
    },
  });
}

async function saveDataUrlImage(dataUrl: string, filenamePrefix: string) {
  const m = /^data:(image\/png|image\/jpeg|image\/jpg);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error("Invalid image format. Use png/jpg data URL.");

  const mime = m[1]!.toLowerCase();
  const base64 = m[2]!;
  const ext = mime.includes("png") ? "png" : "jpg";

  const buf = Buffer.from(base64, "base64");
  if (!buf.length) throw new Error("Empty image");

  const dir = path.join(process.cwd(), "uploads", "admin-logos");
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${filenamePrefix}-${Date.now()}.${ext}`;
  const abs = path.join(dir, fileName);
  await fs.writeFile(abs, buf);

  return `/uploads/admin-logos/${fileName}`;
}

const router = Router();

// ✅ Protect everything: first JWT auth, then role auth
router.use(requireAuth);
router.use(requireAdmin);

/* -------------------------------------------------------------------------- */
/* Admin Management                                                           */
/* -------------------------------------------------------------------------- */

router.get("/admins/overview", async (_req, res) => {
  const total = await prisma.user.count({ where: { role: "ADMIN" } });

  const active = await prisma.adminAccount.count({
    where: { status: "ACTIVE", user: { role: "ADMIN" } },
  });

  const inactive = await prisma.adminAccount.count({
    where: { status: "INACTIVE", user: { role: "ADMIN" } },
  });

  const adminsWithoutAccount = await prisma.user.count({
    where: { role: "ADMIN", adminAccount: null },
  });

  res.json({
    ok: true,
    stats: {
      totalAdmins: total,
      activeAdmins: active + adminsWithoutAccount,
      inactiveAdmins: inactive,
    },
  });
});

router.get("/admins/list", async (req, res) => {
  const q = ensureString(req.query.q);
  const page = clampInt(req.query.page, 1, 1, 99999);
  const limit = clampInt(req.query.limit, 10, 1, 100);
  const skip = (page - 1) * limit;

  const where = {
    role: "ADMIN" as const,
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            {
              adminAccount: {
                adminRoleName: { contains: q, mode: "insensitive" as const },
              },
            },
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
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        adminAccount: {
          select: { adminRoleName: true, status: true, lastLoginAt: true },
        },
      },
    }),
  ]);

  const rows = users.map((u) => ({
    id: u.id,
    name: u.fullName,
    role: u.adminAccount?.adminRoleName ?? "Super admin",
    lastLoginAt: u.adminAccount?.lastLoginAt ?? null,
    status: u.adminAccount?.status === "INACTIVE" ? "Pending" : "Completed",
    email: u.email,
  }));

  res.json({ ok: true, page, limit, total, rows });
});

router.post("/admins", async (req, res) => {
  const fullName = ensureString(req.body?.fullName);
  const email = ensureString(req.body?.email).toLowerCase();
  const password = ensureString(req.body?.password);
  const adminRoleName = ensureString(req.body?.adminRoleName) || "Super admin";

  if (!fullName || !email || !password) {
    return res.status(400).json({ ok: false, error: "fullName, email, password are required" });
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return res.status(409).json({ ok: false, error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "ADMIN",
      adminAccount: {
        create: { adminRoleName, status: "ACTIVE" },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      adminAccount: { select: { adminRoleName: true, status: true, lastLoginAt: true } },
    },
  });

  res.status(201).json({ ok: true, admin: user });
});

router.patch("/admins/:id", async (req, res) => {
  const id = ensureString(req.params.id);
  const adminRoleName = ensureString(req.body?.adminRoleName);
  const status = ensureString(req.body?.status); // ACTIVE | INACTIVE

  if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user || user.role !== "ADMIN") return res.status(404).json({ ok: false, error: "Admin not found" });

  const updated = await prisma.adminAccount.upsert({
    where: { userId: id },
    create: {
      userId: id,
      adminRoleName: adminRoleName || "Super admin",
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
    update: {
      ...(adminRoleName ? { adminRoleName } : {}),
      ...(status ? { status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" } : {}),
    },
    select: { adminRoleName: true, status: true, lastLoginAt: true },
  });

  res.json({ ok: true, adminAccount: updated });
});

/* -------------------------------------------------------------------------- */
/* Compliance                                                                 */
/* -------------------------------------------------------------------------- */

router.get("/compliance", async (_req, res) => {
  const s = await getOrCreateGlobalSettings();
  res.json({ ok: true, compliance: s.compliance });
});

router.put("/compliance", async (req, res) => {
  const requiredDocuments = Array.isArray(req.body?.requiredDocuments)
    ? req.body.requiredDocuments.filter((x: any) => typeof x === "string").map((x: string) => x.trim())
    : undefined;

  const verificationLevel = ensureString(req.body?.verificationLevel) || undefined;
  const flagAboveUsd = req.body?.aml?.flagAboveUsd;
  const dailyLimitUsd = req.body?.aml?.dailyLimitUsd;

  const require2FAForWithdrawal =
    typeof req.body?.require2FAForWithdrawal === "boolean" ? req.body.require2FAForWithdrawal : undefined;

  const current = await getOrCreateGlobalSettings();
  const next = {
    ...(current.compliance as any),
    ...(requiredDocuments ? { requiredDocuments } : {}),
    ...(verificationLevel ? { verificationLevel } : {}),
    ...(flagAboveUsd != null || dailyLimitUsd != null
      ? {
          aml: {
            ...(current.compliance as any)?.aml,
            ...(flagAboveUsd != null ? { flagAboveUsd: Number(flagAboveUsd) } : {}),
            ...(dailyLimitUsd != null ? { dailyLimitUsd: Number(dailyLimitUsd) } : {}),
          },
        }
      : {}),
    ...(require2FAForWithdrawal != null ? { require2FAForWithdrawal } : {}),
  };

  const saved = await prisma.adminSettings.update({
    where: { key: "GLOBAL" },
    data: { compliance: next },
    select: { compliance: true, updatedAt: true },
  });

  res.json({ ok: true, compliance: saved.compliance });
});

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

router.get("/notifications", async (_req, res) => {
  const s = await getOrCreateGlobalSettings();
  res.json({ ok: true, notifications: s.notifications });
});

router.put("/notifications", async (req, res) => {
  const current = await getOrCreateGlobalSettings();
  const prev = (current.notifications as any) || {};

  const alerts = req.body?.alerts;
  const deliveryEnabled = typeof req.body?.deliveryEnabled === "boolean" ? req.body.deliveryEnabled : undefined;

  const deliveryChannel = ensureString(req.body?.deliveryChannel); // push|email|sms
  const validChannel = ["push", "email", "sms"].includes(deliveryChannel) ? deliveryChannel : undefined;

  const next = {
    ...prev,
    ...(alerts && typeof alerts === "object"
      ? {
          alerts: {
            ...(prev.alerts || {}),
            ...(typeof alerts.transaction === "boolean" ? { transaction: alerts.transaction } : {}),
            ...(typeof alerts.price === "boolean" ? { price: alerts.price } : {}),
            ...(typeof alerts.security === "boolean" ? { security: alerts.security } : {}),
            ...(typeof alerts.system === "boolean" ? { system: alerts.system } : {}),
            ...(typeof alerts.referrals === "boolean" ? { referrals: alerts.referrals } : {}),
          },
        }
      : {}),
    ...(deliveryEnabled != null ? { deliveryEnabled } : {}),
    ...(validChannel ? { deliveryChannel: validChannel } : {}),
  };

  const saved = await prisma.adminSettings.update({
    where: { key: "GLOBAL" },
    data: { notifications: next },
    select: { notifications: true },
  });

  res.json({ ok: true, notifications: saved.notifications });
});

/* -------------------------------------------------------------------------- */
/* Customization                                                              */
/* -------------------------------------------------------------------------- */

router.get("/customization", async (_req, res) => {
  const s = await getOrCreateGlobalSettings();
  res.json({ ok: true, customization: s.customization });
});

router.put("/customization", async (req, res) => {
  const current = await getOrCreateGlobalSettings();
  const prev = (current.customization as any) || {};

  const currency = req.body?.currency;
  const language = req.body?.language;
  const widgets = req.body?.widgets;

  const next = {
    ...prev,
    ...(currency && typeof currency === "object"
      ? {
          currency: {
            ...(prev.currency || {}),
            ...(Array.isArray(currency.enabled) ? { enabled: currency.enabled } : {}),
            ...(typeof currency.default === "string" ? { default: currency.default } : {}),
          },
        }
      : {}),
    ...(language && typeof language === "object"
      ? {
          language: {
            ...(prev.language || {}),
            ...(Array.isArray(language.enabled) ? { enabled: language.enabled } : {}),
            ...(typeof language.default === "string" ? { default: language.default } : {}),
          },
        }
      : {}),
    ...(widgets && typeof widgets === "object"
      ? {
          widgets: {
            ...(prev.widgets || {}),
            ...(Array.isArray(widgets.enabled) ? { enabled: widgets.enabled } : {}),
          },
        }
      : {}),
  };

  const saved = await prisma.adminSettings.update({
    where: { key: "GLOBAL" },
    data: { customization: next },
    select: { customization: true },
  });

  res.json({ ok: true, customization: saved.customization });
});

router.post("/customization/logo", async (req, res) => {
  const mode = ensureString(req.body?.mode); // light | dark
  const dataUrl = ensureString(req.body?.dataUrl);

  if (!["light", "dark"].includes(mode)) {
    return res.status(400).json({ ok: false, error: "mode must be 'light' or 'dark'" });
  }
  if (!dataUrl) return res.status(400).json({ ok: false, error: "dataUrl is required" });

  const url = await saveDataUrlImage(dataUrl, mode);

  const current = await getOrCreateGlobalSettings();
  const prev = (current.customization as any) || {};
  const logos = { ...(prev.logos || {}), ...(mode === "light" ? { lightUrl: url } : { darkUrl: url }) };

  const saved = await prisma.adminSettings.update({
    where: { key: "GLOBAL" },
    data: { customization: { ...prev, logos } },
    select: { customization: true },
  });

  res.json({ ok: true, url, customization: saved.customization });
});

export default router;
