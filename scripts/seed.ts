import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing old data...");

  // Delete in order (child → parent)
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  console.log("✅ All old data removed.");
  console.log("🚀 Inserting new manual sample data...");

  // --- ROUTES ---
  const routesData = [
    { routeId: "R001", vesselType: "Cargo", fuelType: "Diesel", year: 2020, ghgIntensity: 3.6, fuelConsumption: 1000, distance: 4000, totalEmissions: 5200, isBaseline: true },
    { routeId: "R002", vesselType: "Tanker", fuelType: "LNG", year: 2021, ghgIntensity: 3.7, fuelConsumption: 1100, distance: 4200, totalEmissions: 5400, isBaseline: false },
    { routeId: "R003", vesselType: "Passenger", fuelType: "Methanol", year: 2022, ghgIntensity: 3.8, fuelConsumption: 1200, distance: 4400, totalEmissions: 5600, isBaseline: true },
    { routeId: "R004", vesselType: "Fishing", fuelType: "Ammonia", year: 2023, ghgIntensity: 3.9, fuelConsumption: 1300, distance: 4600, totalEmissions: 5800, isBaseline: false },
    { routeId: "R005", vesselType: "Cargo", fuelType: "Diesel", year: 2024, ghgIntensity: 4.0, fuelConsumption: 1400, distance: 4800, totalEmissions: 6000, isBaseline: true },
    { routeId: "R006", vesselType: "Tanker", fuelType: "LNG", year: 2025, ghgIntensity: 4.1, fuelConsumption: 1500, distance: 5000, totalEmissions: 6200, isBaseline: false },
    { routeId: "R007", vesselType: "Passenger", fuelType: "Methanol", year: 2026, ghgIntensity: 4.2, fuelConsumption: 1600, distance: 5200, totalEmissions: 6400, isBaseline: true },
    { routeId: "R008", vesselType: "Fishing", fuelType: "Ammonia", year: 2027, ghgIntensity: 4.3, fuelConsumption: 1700, distance: 5400, totalEmissions: 6600, isBaseline: false },
    { routeId: "R009", vesselType: "Cargo", fuelType: "Diesel", year: 2028, ghgIntensity: 4.4, fuelConsumption: 1800, distance: 5600, totalEmissions: 6800, isBaseline: true },
    { routeId: "R010", vesselType: "Tanker", fuelType: "LNG", year: 2029, ghgIntensity: 4.5, fuelConsumption: 1900, distance: 5800, totalEmissions: 7000, isBaseline: false },
  ];

  await prisma.route.createMany({ data: routesData });
  console.log("✅ Routes inserted.");

  // --- SHIP COMPLIANCE ---
  const shipComplianceData = [
    { shipId: "SHIP-101", year: 2020, cbGco2eq: 400 },
    { shipId: "SHIP-102", year: 2021, cbGco2eq: 420 },
    { shipId: "SHIP-103", year: 2022, cbGco2eq: 440 },
    { shipId: "SHIP-104", year: 2023, cbGco2eq: 460 },
    { shipId: "SHIP-105", year: 2024, cbGco2eq: 480 },
    { shipId: "SHIP-106", year: 2025, cbGco2eq: 500 },
    { shipId: "SHIP-107", year: 2026, cbGco2eq: 520 },
    { shipId: "SHIP-108", year: 2027, cbGco2eq: 540 },
    { shipId: "SHIP-109", year: 2028, cbGco2eq: 560 },
    { shipId: "SHIP-110", year: 2029, cbGco2eq: 580 },
  ];

  await prisma.shipCompliance.createMany({ data: shipComplianceData });
  console.log("✅ Ship compliance inserted.");

  // --- BANK ENTRIES ---
  const bankEntriesData = [
    { shipId: "SHIP-101", year: 2020, amountGco2eq: 150 },
    { shipId: "SHIP-102", year: 2021, amountGco2eq: 160 },
    { shipId: "SHIP-103", year: 2022, amountGco2eq: 170 },
    { shipId: "SHIP-104", year: 2023, amountGco2eq: 180 },
    { shipId: "SHIP-105", year: 2024, amountGco2eq: 190 },
    { shipId: "SHIP-106", year: 2025, amountGco2eq: 200 },
    { shipId: "SHIP-107", year: 2026, amountGco2eq: 210 },
    { shipId: "SHIP-108", year: 2027, amountGco2eq: 220 },
    { shipId: "SHIP-109", year: 2028, amountGco2eq: 230 },
    { shipId: "SHIP-110", year: 2029, amountGco2eq: 240 },
  ];

  await prisma.bankEntry.createMany({ data: bankEntriesData });
  console.log("✅ Bank entries inserted.");

  // --- POOLS & MEMBERS ---
  for (let i = 0; i < 10; i++) {
    const pool = await prisma.pool.create({
      data: {
        year: 2020 + i,
        members: {
          create: [
            {
              shipId: `SHIP-10${i + 1}`,
              cbBefore: 500 + i * 10,
              cbAfter: 450 + i * 10,
            },
            {
              shipId: `SHIP-20${i + 1}`,
              cbBefore: 480 + i * 10,
              cbAfter: 440 + i * 10,
            },
          ],
        },
      },
    });
    console.log(`✅ Pool created for year ${pool.year}`);
  }

  console.log("🎉 All data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
