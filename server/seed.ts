// Database seeding script - populates initial KPI data
// Seed data from assignment specification
import { db } from "./db";
import { routes } from "@shared/schema";

const kpiRoutes = [
  {
    routeId: "R001",
    vesselType: "Container",
    fuelType: "HFO",
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true, // Set R001 as default baseline
  },
  {
    routeId: "R002",
    vesselType: "BulkCarrier",
    fuelType: "LNG",
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false,
  },
  {
    routeId: "R003",
    vesselType: "Tanker",
    fuelType: "MGO",
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumption: 5100,
    distance: 12500,
    totalEmissions: 4700,
    isBaseline: false,
  },
  {
    routeId: "R004",
    vesselType: "RoRo",
    fuelType: "HFO",
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumption: 4900,
    distance: 11800,
    totalEmissions: 4300,
    isBaseline: false,
  },
  {
    routeId: "R005",
    vesselType: "Container",
    fuelType: "LNG",
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumption: 4950,
    distance: 11900,
    totalEmissions: 4400,
    isBaseline: false,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing routes
    await db.delete(routes);
    console.log("  ✓ Cleared existing routes");

    // Insert KPI routes
    for (const route of kpiRoutes) {
      await db.insert(routes).values(route);
      console.log(`  ✓ Inserted route ${route.routeId}`);
    }

    console.log("✅ Database seeded successfully!");
    console.log(`   Total routes: ${kpiRoutes.length}`);
    console.log(`   Baseline route: ${kpiRoutes.find(r => r.isBaseline)?.routeId}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
