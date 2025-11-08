// scripts/migrate.ts
import { pool, executeSQL } from "../db";
import { routes, shipCompliance, bankEntries, pools, poolMembers } from "@shared/schema";
import { db } from "../db";

async function createTables() {
  console.log("🚀 Creating tables...");

  try {
    // Drop tables if they exist (for clean setup)
    await executeSQL(`
      DROP TABLE IF EXISTS pool_members CASCADE;
      DROP TABLE IF EXISTS pools CASCADE;
      DROP TABLE IF EXISTS bank_entries CASCADE;
      DROP TABLE IF EXISTS ship_compliance CASCADE;
      DROP TABLE IF EXISTS routes CASCADE;
    `);

    // Create routes table
    await executeSQL(`
      CREATE TABLE routes (
        id SERIAL PRIMARY KEY,
        route_id VARCHAR(50) NOT NULL UNIQUE,
        vessel_type VARCHAR(100) NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        ghg_intensity REAL NOT NULL,
        fuel_consumption REAL NOT NULL,
        distance REAL NOT NULL,
        total_emissions REAL NOT NULL,
        is_baseline BOOLEAN NOT NULL DEFAULT false
      );
    `);

    // Create ship_compliance table
    await executeSQL(`
      CREATE TABLE ship_compliance (
        id SERIAL PRIMARY KEY,
        ship_id VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        cb_gco2eq REAL NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create bank_entries table
    await executeSQL(`
      CREATE TABLE bank_entries (
        id SERIAL PRIMARY KEY,
        ship_id VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        amount_gco2eq REAL NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create pools table
    await executeSQL(`
      CREATE TABLE pools (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create pool_members table
    await executeSQL(`
      CREATE TABLE pool_members (
        id SERIAL PRIMARY KEY,
        pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
        ship_id VARCHAR(50) NOT NULL,
        cb_before REAL NOT NULL,
        cb_after REAL NOT NULL,
        UNIQUE(pool_id, ship_id)
      );
    `);

    console.log("✅ Tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function seedData() {
  console.log("🌱 Seeding data...");

  // Insert 15 routes
  const routeData = [
    { routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
    { routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
    { routeId: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
    { routeId: "R004", vesselType: "RoRo", fuelType: "HFO", year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800, totalEmissions: 4300, isBaseline: false },
    { routeId: "R005", vesselType: "Container", fuelType: "LNG", year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900, totalEmissions: 4400, isBaseline: false },
    { routeId: "R006", vesselType: "BulkCarrier", fuelType: "VLSFO", year: 2024, ghgIntensity: 87.8, fuelConsumption: 4700, distance: 11200, totalEmissions: 4100, isBaseline: false },
    { routeId: "R007", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 92.1, fuelConsumption: 5200, distance: 12600, totalEmissions: 4750, isBaseline: false },
    { routeId: "R008", vesselType: "Tanker", fuelType: "LNG", year: 2025, ghgIntensity: 86.5, fuelConsumption: 4600, distance: 11000, totalEmissions: 3950, isBaseline: false },
    { routeId: "R009", vesselType: "RoRo", fuelType: "MGO", year: 2024, ghgIntensity: 94.2, fuelConsumption: 5300, distance: 12800, totalEmissions: 4950, isBaseline: false },
    { routeId: "R010", vesselType: "Container", fuelType: "VLSFO", year: 2025, ghgIntensity: 88.9, fuelConsumption: 4850, distance: 11600, totalEmissions: 4280, isBaseline: false },
    { routeId: "R011", vesselType: "BulkCarrier", fuelType: "HFO", year: 2024, ghgIntensity: 95.0, fuelConsumption: 5400, distance: 13000, totalEmissions: 5100, isBaseline: false },
    { routeId: "R012", vesselType: "Tanker", fuelType: "VLSFO", year: 2025, ghgIntensity: 87.2, fuelConsumption: 4650, distance: 11100, totalEmissions: 4020, isBaseline: false },
    { routeId: "R013", vesselType: "Container", fuelType: "MGO", year: 2024, ghgIntensity: 89.8, fuelConsumption: 4920, distance: 11750, totalEmissions: 4350, isBaseline: false },
    { routeId: "R014", vesselType: "RoRo", fuelType: "LNG", year: 2025, ghgIntensity: 85.7, fuelConsumption: 4550, distance: 10800, totalEmissions: 3880, isBaseline: false },
    { routeId: "R015", vesselType: "BulkCarrier", fuelType: "MGO", year: 2024, ghgIntensity: 91.5, fuelConsumption: 5050, distance: 12100, totalEmissions: 4580, isBaseline: false },
  ];

  for (const route of routeData) {
    await db.insert(routes).values(route);
    console.log(`  ✓ Inserted route ${route.routeId}`);
  }

  // Insert 15 ship compliance records
  const complianceData = [
    { shipId: "R001", year: 2024, cbGco2eq: 32500000 },
    { shipId: "R002", year: 2024, cbGco2eq: 61500000 },
    { shipId: "R003", year: 2024, cbGco2eq: -21500000 },
    { shipId: "R004", year: 2025, cbGco2eq: 2850000 },
    { shipId: "R005", year: 2025, cbGco2eq: -12500000 },
    { shipId: "R006", year: 2024, cbGco2eq: 78500000 },
    { shipId: "R007", year: 2024, cbGco2eq: -18500000 },
    { shipId: "R008", year: 2025, cbGco2eq: 115000000 },
    { shipId: "R009", year: 2024, cbGco2eq: -32500000 },
    { shipId: "R010", year: 2025, cbGco2eq: 45500000 },
    { shipId: "R011", year: 2024, cbGco2eq: -48500000 },
    { shipId: "R012", year: 2025, cbGco2eq: 89500000 },
    { shipId: "R013", year: 2024, cbGco2eq: 18500000 },
    { shipId: "R014", year: 2025, cbGco2eq: 152000000 },
    { shipId: "R015", year: 2024, cbGco2eq: -9500000 },
  ];

  for (const compliance of complianceData) {
    await db.insert(shipCompliance).values(compliance);
    console.log(`  ✓ Inserted compliance for ship ${compliance.shipId}`);
  }

  // Insert 15 bank entries
  const bankData = [
    { shipId: "R001", year: 2024, amountGco2eq: 10000000 },
    { shipId: "R002", year: 2024, amountGco2eq: 20000000 },
    { shipId: "R006", year: 2024, amountGco2eq: 15000000 },
    { shipId: "R008", year: 2025, amountGco2eq: 30000000 },
    { shipId: "R010", year: 2025, amountGco2eq: 12000000 },
    { shipId: "R012", year: 2025, amountGco2eq: 25000000 },
    { shipId: "R013", year: 2024, amountGco2eq: 8000000 },
    { shipId: "R014", year: 2025, amountGco2eq: 40000000 },
    { shipId: "R001", year: 2024, amountGco2eq: -5000000 },
    { shipId: "R003", year: 2024, amountGco2eq: -10000000 },
    { shipId: "R005", year: 2025, amountGco2eq: -8000000 },
    { shipId: "R007", year: 2024, amountGco2eq: -12000000 },
    { shipId: "R009", year: 2024, amountGco2eq: -15000000 },
    { shipId: "R011", year: 2024, amountGco2eq: -20000000 },
    { shipId: "R015", year: 2024, amountGco2eq: -6000000 },
  ];

  for (const bankEntry of bankData) {
    await db.insert(bankEntries).values(bankEntry);
    console.log(`  ✓ Inserted bank entry for ship ${bankEntry.shipId}`);
  }

  // Insert 3 pools
  const poolData = [
    { year: 2024 },
    { year: 2025 },
    { year: 2024 },
  ];

  const createdPools = [];
  for (const pool of poolData) {
    const [createdPool] = await db.insert(pools).values(pool).returning();
    createdPools.push(createdPool);
    console.log(`  ✓ Created pool for year ${pool.year}`);
  }

  // Insert 15 pool members
  const poolMembersData = [
    // Pool 1 - 2024
    { poolId: createdPools[0].id, shipId: "R001", cbBefore: 32500000, cbAfter: 15000000 },
    { poolId: createdPools[0].id, shipId: "R002", cbBefore: 61500000, cbAfter: 40000000 },
    { poolId: createdPools[0].id, shipId: "R003", cbBefore: -21500000, cbAfter: 0 },
    { poolId: createdPools[0].id, shipId: "R006", cbBefore: 78500000, cbAfter: 55000000 },
    { poolId: createdPools[0].id, shipId: "R007", cbBefore: -18500000, cbAfter: 0 },
    
    // Pool 2 - 2025
    { poolId: createdPools[1].id, shipId: "R004", cbBefore: 2850000, cbAfter: 0 },
    { poolId: createdPools[1].id, shipId: "R005", cbBefore: -12500000, cbAfter: 0 },
    { poolId: createdPools[1].id, shipId: "R008", cbBefore: 115000000, cbAfter: 95000000 },
    { poolId: createdPools[1].id, shipId: "R010", cbBefore: 45500000, cbAfter: 30000000 },
    { poolId: createdPools[1].id, shipId: "R012", cbBefore: 89500000, cbAfter: 72000000 },
    
    // Pool 3 - 2024
    { poolId: createdPools[2].id, shipId: "R009", cbBefore: -32500000, cbAfter: 0 },
    { poolId: createdPools[2].id, shipId: "R011", cbBefore: -48500000, cbAfter: 0 },
    { poolId: createdPools[2].id, shipId: "R013", cbBefore: 18500000, cbAfter: 0 },
    { poolId: createdPools[2].id, shipId: "R014", cbBefore: 152000000, cbAfter: 122000000 },
    { poolId: createdPools[2].id, shipId: "R015", cbBefore: -9500000, cbAfter: 0 },
  ];

  for (const member of poolMembersData) {
    await db.insert(poolMembers).values(member);
    console.log(`  ✓ Added ship ${member.shipId} to pool ${member.poolId}`);
  }

  console.log("✅ Data seeded successfully!");
}

async function main() {
  try {
    await createTables();
    await seedData();
    
    console.log("\n🎉 Database setup completed!");
    console.log("📊 Summary:");
    console.log("   - 15 routes inserted");
    console.log("   - 15 ship compliance records inserted");
    console.log("   - 15 bank entries inserted");
    console.log("   - 3 pools created");
    console.log("   - 15 pool members added");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

main();