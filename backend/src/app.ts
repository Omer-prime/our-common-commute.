import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { notFound, errorHandler } from "./middleware/error.js";
import path from "path";
import driverOnboarding from "./routes/driverOnboarding.js";
import driverDashboard from "./routes/driverDashboard.js";
import {driverTripsRouter} from "./routes/driverTrips.js";
import {driverProfileRouter} from "./routes/driverProfile.js";
import {driverNotificationsRouter} from "./routes/driverNotifications.js";
import {driverEarningsRouter} from "./routes/earnings.js";
import riderOnboarding from "./routes/riderOnboarding.js";
import { riderDashboardRouter } from "./routes/riderDashboard.js";
import { riderTripsRouter } from "./routes/riderTrips.js";

export function createApp() {
  const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
  app.use(express.json({ limit: "7mb" }));
  app.use(morgan("dev"));

  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 30
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

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/driver/onboarding", driverOnboarding);
app.use("/driver/profile", driverProfileRouter);
app.use("/driver/trips", driverTripsRouter);
app.use("/driver/dashboard", driverDashboard);
app.use("/driver/notifications", driverNotificationsRouter);
app.use("/driver/earnings", driverEarningsRouter);



app.use("/rider/onboarding", riderOnboarding);
app.use("/rider/dashboard", riderDashboardRouter);
app.use("/rider/trips", riderTripsRouter);
  app.use("/health", healthRouter);
  app.use("/auth", authLimiter, authRouter);
  app.use("/me", meRouter);
  app.get("/", (_req, res) => {
  res.json({
    name: "OCC API",
    ok: true,
    routes: ["/health", "/auth/*", "/me"]
  });
});
  app.use(notFound);
  app.use(errorHandler);




  return app;
}
