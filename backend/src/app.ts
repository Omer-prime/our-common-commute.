import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { notFound, errorHandler } from "./middleware/error.js";

import driverOnboarding from "./routes/driverOnboarding.js";
import driverDashboard from "./routes/driverDashboard.js";
import { driverTripsRouter } from "./routes/driverTrips.js";
import { driverProfileRouter } from "./routes/driverProfile.js";
import { driverNotificationsRouter } from "./routes/driverNotifications.js";
import { driverEarningsRouter } from "./routes/earnings.js";

import riderOnboarding from "./routes/riderOnboarding.js";
import { riderDashboardRouter } from "./routes/riderDashboard.js";
import { riderTripsRouter } from "./routes/riderTrips.js";
import riderMyRidesRouter from "./routes/riderMyRides.js";
import riderPaymentsRouter from "./routes/riderPayments.js";
import riderSupportRouter from "./routes/riderSupport.js";
import riderNotificationsRouter from "./routes/riderNotifications.js";

import adminNotificationsRouter from "./routes/adminNotifications.js";
import { adminDashboardRouter } from "./routes/adminDashboard.js";
import adminUsersRouter from "./routes/adminUsers.js";
import adminPaymentsRouter from "./routes/adminPayments.js";
import adminRideCostRoutes from "./routes/adminRideCost.js";
import  adminContentRouter  from "./routes/adminContent.js";
import adminReportsRouter from "./routes/adminReports.js";
import adminSettingsRouter from "./routes/adminSettings.js";
import riderProfileRouter from "./routes/riderProfile.js";
import publicContentRouter from "./routes/publicContent.js";




import { startAdminNotificationScheduler } from "./lib/adminNotificationScheduler.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(express.json({ limit: "7mb" }));
  app.use(morgan("dev"));
app.set("trust proxy", 1); // trust first proxy
  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
  });

  const allowed = (config.corsOrigin ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // postman/curl
        if (allowed.includes("*")) return cb(null, true);
        return allowed.includes(origin) ? cb(null, true) : cb(new Error("CORS_BLOCKED"));
      },
      credentials: true,
    })
  );

  // static
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // driver
  app.use("/driver/onboarding", driverOnboarding);
  app.use("/driver/profile", driverProfileRouter);
  app.use("/driver/trips", driverTripsRouter);
  app.use("/driver/dashboard", driverDashboard);
  app.use("/driver/notifications", driverNotificationsRouter);
  app.use("/driver/earnings", driverEarningsRouter);

  // rider
  app.use("/rider/onboarding", riderOnboarding);
  app.use("/rider/dashboard", riderDashboardRouter);
  app.use("/rider/trips", riderTripsRouter);
  app.use("/api/rider", riderMyRidesRouter);
  app.use("/api/rider/payments", riderPaymentsRouter);
  app.use("/api/rider/support", riderSupportRouter);
  app.use("/api/rider", riderNotificationsRouter);
app.use("/api/rider/profile", riderProfileRouter);
  // admin
 app.use("/admin/notifications", adminNotificationsRouter);
  app.use("/admin/dashboard", adminDashboardRouter);
  app.use("/admin/users", adminUsersRouter);
  app.use("/admin/payments", adminPaymentsRouter);
  app.use("/admin/ride-cost", adminRideCostRoutes);
   app.use("/admin/content", adminContentRouter);
   app.use("/admin/reports", adminReportsRouter);
   app.use("/admin/settings", adminSettingsRouter);

  // public site content
  app.use("/public/content", publicContentRouter);

  // ✅ start scheduler (no local function with same name anymore)
  startAdminNotificationScheduler();

  // core routes
  app.use("/health", healthRouter);
  app.use("/auth", authLimiter, authRouter);
  app.use("/me", meRouter);

  app.get("/", (_req, res) => {
    res.json({
      name: "OCC API",
      ok: true,
      routes: ["/health", "/auth/*", "/me"],
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
