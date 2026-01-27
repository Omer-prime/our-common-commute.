import "dotenv/config";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function mustWhen(cond: boolean, name: string, fallbackName?: string): string {
  const primary = process.env[name];
  const fallback = fallbackName ? process.env[fallbackName] : undefined;

  if (cond && !(primary || fallback)) {
    throw new Error(`Missing env: ${name}${fallbackName ? ` (or ${fallbackName})` : ""}`);
  }

  return (primary || fallback || "").trim();
}

function asInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: string | undefined, fallback: boolean) {
  if (v == null) return fallback;
  const t = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(t)) return true;
  if (["0", "false", "no", "n", "off"].includes(t)) return false;
  return fallback;
}

const mailModeRaw = (process.env.MAIL_MODE ?? "console").trim().toLowerCase();
const mailMode: "console" | "smtp" = mailModeRaw === "smtp" ? "smtp" : "console";

// Support either SMTP_PORT or MAIL_PORT
const smtpPort = asInt(process.env.SMTP_PORT ?? process.env.MAIL_PORT, 587);

// Prefer explicit secure flags; otherwise default based on port
const smtpSecure =
  asBool(process.env.SMTP_SECURE ?? process.env.MAIL_SECURE, smtpPort === 465);

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: asInt(process.env.PORT, 4000),

  databaseUrl: must("DATABASE_URL"),

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",

  jwt: {
    accessSecret: must("JWT_ACCESS_SECRET"),
    refreshSecret: must("JWT_REFRESH_SECRET"),
    accessTtlMin: asInt(process.env.ACCESS_TOKEN_TTL_MIN, 15),
    refreshTtlDays: asInt(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  },

  otp: {
    secret: must("OTP_SECRET"),
    ttlMin: asInt(process.env.OTP_TTL_MIN, 10),
  },

  mail: {
    mode: mailMode,
    host: mustWhen(mailMode === "smtp", "SMTP_HOST", "MAIL_HOST"),
    port: smtpPort,
    secure: smtpSecure,
    user: mustWhen(mailMode === "smtp", "SMTP_USER", "MAIL_USER"),
    pass: mustWhen(mailMode === "smtp", "SMTP_PASS", "MAIL_PASS"),
    from: process.env.MAIL_FROM ?? process.env.SMTP_FROM ?? "no-reply@ourcommoncommute.com",
    fromName: process.env.MAIL_FROM_NAME ?? process.env.SMTP_FROM_NAME ?? "Our Common Commute",
  },
};
