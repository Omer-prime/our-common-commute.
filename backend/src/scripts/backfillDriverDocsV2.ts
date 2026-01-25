import { prisma } from "../prisma.js";

const MAP = [
  ["governmentIdUrl", "GOVERNMENT_ID"],
  ["selfieUrl", "SELFIE"],
  ["licenseUrl", "DRIVER_LICENSE"],
  ["insuranceUrl", "VEHICLE_INSURANCE"],
  ["vehicleImageUrl", "VEHICLE_IMAGE"],
] as const;

async function main() {
  const OR = MAP.map(([k]) => ({ [k]: { not: null } })) as any;

  const rows = await prisma.driverDocuments.findMany({
    where: { OR },
    select: {
      driverId: true, // this should be DriverProfile.id
      governmentIdUrl: true,
      selfieUrl: true,
      licenseUrl: true,
      insuranceUrl: true,
      vehicleImageUrl: true,
    },
  });

  let upserts = 0;

  for (const row of rows) {
    for (const [field, type] of MAP) {
      const url = (row as any)[field] as string | null;
      if (!url) continue;

      await prisma.driverDocument.upsert({
        where: { driverId_type: { driverId: row.driverId, type } },
        create: { driverId: row.driverId, type, url, status: "PENDING" },
        update: { url, status: "PENDING" },
      });

      upserts++;
    }
  }

  console.log(`Backfill done. driverDocuments rows=${rows.length}, upserts=${upserts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
