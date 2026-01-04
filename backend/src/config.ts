import "dotenv/config";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function mustWhen(cond: boolean, name: string): string {
  const v = process.env[name];
  if (cond && !v) throw new Error(`Missing env: ${name}`);
  return v ?? "";
}

function asInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const mailModeRaw = (process.env.MAIL_MODE ?? "console").trim().toLowerCase();
const mailMode: "console" | "smtp" = mailModeRaw === "smtp" ? "smtp" : "console";

const smtpPort = asInt(process.env.SMTP_PORT, 587);
const smtpSecure = smtpPort === 465;

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
    host: mustWhen(mailMode === "smtp", "SMTP_HOST"),
    port: smtpPort,
    secure: smtpSecure,
    user: mustWhen(mailMode === "smtp", "SMTP_USER"),
    pass: mustWhen(mailMode === "smtp", "SMTP_PASS"),
    from: process.env.MAIL_FROM ?? "no-reply@ourcommoncommute.com",
  },
};
