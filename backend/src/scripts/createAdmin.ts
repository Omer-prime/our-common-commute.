import { prisma } from "../prisma.js";
import { hashPassword } from "../lib/password.js";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@occ.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const fullName = process.env.ADMIN_NAME || "Admin";

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash: hashPassword(password),
      role: "ADMIN",
    },
    create: {
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: "ADMIN",
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  console.log("✅ Admin ready:", admin);
  console.log("Login with:", { email, password });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
