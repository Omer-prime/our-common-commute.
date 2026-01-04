import "dotenv/config";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? "4000"),

  databaseUrl: must("DATABASE_URL"),

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",

  jwt: {
    accessSecret: must("JWT_ACCESS_SECRET"),
    refreshSecret: must("JWT_REFRESH_SECRET"),
    accessTtlMin: Number(process.env.ACCESS_TOKEN_TTL_MIN ?? "15"),
    refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30")
  },

  otp: {
    secret: must("OTP_SECRET"),
    ttlMin: Number(process.env.OTP_TTL_MIN ?? "10")
  },

  mail: {
    mode: process.env.MAIL_MODE ?? "console", // "console" | "smtp"
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? "587"),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "no-reply@ourcommoncommute.com"
  }
};
