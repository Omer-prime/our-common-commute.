import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { generateOtpCode, hashOtp } from "../lib/otp.js";
import {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyRefresh,
  verifyReset,
} from "../lib/jwt.js";
import { config } from "../config.js";
import { sendMail } from "../lib/mailer.js";

export const authRouter = Router();

const RoleSchema = z.enum(["DRIVER", "RIDER", "ADMIN"]);

const SignupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: RoleSchema,
});

function driverNextPath(step: number, completedAt: Date | null) {
  if (completedAt) return "/driver/dashboard";
  switch (step) {
    case 1:
      return "/driver/onboarding/basic-details";
    case 2:
      return "/driver/onboarding/identity-id";
    case 3:
      return "/driver/onboarding/identity-selfie";
    case 4:
      return "/driver/onboarding/vehicle-docs";
    case 5:
      return "/driver/onboarding/vehicle-info";
    case 6:
      return "/driver/onboarding/work-schedule";
    case 7:
      return "/driver/onboarding/availability";
    case 8:
      return "/driver/onboarding/payout";
    case 9:
      return "/driver/onboarding/safety";
    default:
      return "/driver/onboarding/basic-details";
  }
}
function riderNextPath(step: number, completedAt: Date | null) {
  if (completedAt) return "/rider/dashboard";
  switch (step) {
    case 1:
      return "/rider/onboarding/basic-details";
    case 2:
      return "/rider/onboarding/otp-verification";
    case 3:
      return "/rider/onboarding/full-name";
    case 4:
      return "/rider/onboarding/location";
    case 5:
      return "/rider/onboarding/payment-method";
    case 6:
      return "/rider/onboarding/agreement";
    default:
      return "/rider/onboarding/basic-details";
  }
}
authRouter.post("/signup", async (req, res) => {
  const input = SignupSchema.safeParse(req.body);
  if (!input.success) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const { fullName, email, password, role } = input.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "EMAIL_ALREADY_USED" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          passwordHash: hashPassword(password),
          role,
        },
        select: { id: true, email: true, fullName: true, role: true },
      });

      // ✅ Create driver profile right AFTER user is created
      let nextPath: string | undefined = undefined;

      if (user.role === "DRIVER") {
        const profile = await tx.driverProfile.create({
          data: {
            userId: user.id,
            onboardingStep: 1,
            vehicle: { create: {} },
            documents: { create: {} },
          },
          select: { onboardingStep: true, onboardingCompletedAt: true },
        });

        nextPath = driverNextPath(
          profile.onboardingStep,
          profile.onboardingCompletedAt
        );
      }
      if (user.role === "RIDER") {
        const profile = await tx.riderProfile.create({
          data: {
            userId: user.id,
            onboardingStep: 1,
          },
          select: { onboardingStep: true, onboardingCompletedAt: true },
        });

        nextPath = riderNextPath(profile.onboardingStep, profile.onboardingCompletedAt);
      }
      const accessToken = signAccessToken(user.id, user.role);
      const jti = crypto.randomUUID();
      const refreshToken = signRefreshToken(user.id, jti);

      // store hashed refresh token
      const refreshHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const expiresAt = new Date(
        Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
      );

      await tx.refreshToken.create({
        data: { userId: user.id, tokenHash: refreshHash, expiresAt },
      });

      return { user, accessToken, refreshToken, nextPath };
    });

    return res.status(201).json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SIGNUP_FAILED" });
  }
});

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  role: RoleSchema.optional(),
});

authRouter.post("/login", async (req, res) => {
  const input = LoginSchema.safeParse(req.body);
  if (!input.success) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const { email, password, role } = input.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  if (role && user.role !== role) {
    return res.status(403).json({ error: "ROLE_MISMATCH" });
  }

  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const accessToken = signAccessToken(user.id, user.role);
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, jti);

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
  );

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: refreshHash, expiresAt },
  });

  // ✅ Return where to go after login
  let nextPath: string | undefined = undefined;

  if (user.role === "DRIVER") {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingStep: true, onboardingCompletedAt: true },
    });

    // if for some reason profile not created (old users), create it
    if (!profile) {
      const created = await prisma.driverProfile.create({
        data: {
          userId: user.id,
          onboardingStep: 1,
          vehicle: { create: {} },
          documents: { create: {} },
        },
        select: { onboardingStep: true, onboardingCompletedAt: true },
      });
      nextPath = driverNextPath(created.onboardingStep, created.onboardingCompletedAt);
    } else {
      nextPath = driverNextPath(profile.onboardingStep, profile.onboardingCompletedAt);
    }
  }
  if (user.role === "RIDER") {
    const profile = await prisma.riderProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingStep: true, onboardingCompletedAt: true },
    });

    if (!profile) {
      const created = await prisma.riderProfile.create({
        data: { userId: user.id, onboardingStep: 1 },
        select: { onboardingStep: true, onboardingCompletedAt: true },
      });
      nextPath = riderNextPath(created.onboardingStep, created.onboardingCompletedAt);
    } else {
      nextPath = riderNextPath(profile.onboardingStep, profile.onboardingCompletedAt);
    }
  }
  return res.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    accessToken,
    refreshToken,
    nextPath,
  });
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

authRouter.post("/refresh", async (req, res) => {
  const input = RefreshSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "VALIDATION_ERROR" });

  const { refreshToken } = input.data;

  let payload: any;
  try {
    payload = verifyRefresh(refreshToken);
    if (payload.typ !== "refresh") throw new Error("bad token");
  } catch {
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: refreshHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!stored) return res.status(401).json({ error: "INVALID_REFRESH" });

  const newAccess = signAccessToken(stored.userId, stored.user.role);
  return res.json({ accessToken: newAccess });
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

authRouter.post("/logout", async (req, res) => {
  const input = LogoutSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "VALIDATION_ERROR" });

  const refreshHash = crypto
    .createHash("sha256")
    .update(input.data.refreshToken)
    .digest("hex");

  await prisma.refreshToken.updateMany({
    where: { tokenHash: refreshHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return res.json({ ok: true });
});

const ForgotSchema = z.object({
  email: z.string().email().toLowerCase(),
});

authRouter.post("/forgot-password", async (req, res) => {
  const input = ForgotSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "VALIDATION_ERROR" });

  const { email } = input.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // always return ok (don’t leak whether email exists)
  if (!user) return res.json({ ok: true });

  const otp = generateOtpCode(6);
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + config.otp.ttlMin * 60 * 1000);

  const record = await prisma.passwordResetOtp.create({
    data: { userId: user.id, otpHash, expiresAt },
  });

  await sendMail(
    user.email,
    "Your password reset code",
    `Your OTP code is: ${otp}\n\nIt expires in ${config.otp.ttlMin} minutes.`
  );

  const devOtp = config.nodeEnv === "development" ? otp : undefined;
  return res.json({ ok: true, otpId: record.id, devOtp });
});

const VerifyOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/),
});

authRouter.post("/verify-reset-otp", async (req, res) => {
  const input = VerifyOtpSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "VALIDATION_ERROR" });

  const { email, otp } = input.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "INVALID_OTP" });

  const otpHash = hashOtp(otp);

  const latest = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
      otpHash,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return res.status(401).json({ error: "INVALID_OTP" });

  await prisma.passwordResetOtp.update({
    where: { id: latest.id },
    data: { usedAt: new Date() },
  });

  const resetToken = signResetToken(user.id, latest.id);
  return res.json({ resetToken });
});

const ResetSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: z.string().min(8),
});

authRouter.post("/reset-password", async (req, res) => {
  const input = ResetSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "VALIDATION_ERROR" });

  const { resetToken, newPassword } = input.data;

  let payload: any;
  try {
    payload = verifyReset(resetToken);
    if (payload.typ !== "reset") throw new Error("bad token");
  } catch {
    return res.status(401).json({ error: "INVALID_RESET_TOKEN" });
  }

  await prisma.user.update({
    where: { id: payload.sub },
    data: { passwordHash: hashPassword(newPassword) },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: payload.sub, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return res.json({ ok: true });
});
