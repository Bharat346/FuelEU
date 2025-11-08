// Storage interface implementation following hexagonal architecture
// Core domain layer - implements persistence ports
import { 
  routes, 
  shipCompliance, 
  bankEntries, 
  pools, 
  poolMembers,
  type Route, 
  type InsertRoute,
  type ShipCompliance,
  type InsertShipCompliance,
  type BankEntry,
  type InsertBankEntry,
  type Pool,
  type InsertPool,
  type PoolMember,
  type InsertPoolMember
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Storage interface - defines ports for data operations
export interface IStorage {
  // Routes
  getAllRoutes(): Promise<Route[]>;
  getRouteById(id: number): Promise<Route | undefined>;
  getRouteByRouteId(routeId: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  setBaseline(routeId: string): Promise<void>;
  getBaselineRoute(): Promise<Route | undefined>;

  // Ship Compliance
  getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | undefined>;
  createShipCompliance(compliance: InsertShipCompliance): Promise<ShipCompliance>;
  updateShipCompliance(id: number, cbGco2eq: number): Promise<void>;

  // Bank Entries
  getBankEntries(shipId: string, year: number): Promise<BankEntry[]>;
  createBankEntry(entry: InsertBankEntry): Promise<BankEntry>;
  getTotalBanked(shipId: string, year: number): Promise<number>;

  // Pools
  createPool(pool: InsertPool): Promise<Pool>;
  createPoolMember(member: InsertPoolMember): Promise<PoolMember>;
  getPoolMembers(poolId: number): Promise<PoolMember[]>;
}

// DatabaseStorage - adapter implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // Routes
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes).orderBy(routes.year, routes.routeId);
  }

  async getRouteById(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async getRouteByRouteId(routeId: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.routeId, routeId));
    return route || undefined;
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  async setBaseline(routeId: string): Promise<void> {
    // First, unset all baselines
    await db.update(routes).set({ isBaseline: false });
    
    // Then set the specified route as baseline
    await db
      .update(routes)
      .set({ isBaseline: true })
      .where(eq(routes.routeId, routeId));
  }

  async getBaselineRoute(): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.isBaseline, true));
    return route || undefined;
  }

  // Ship Compliance
  async getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | undefined> {
    const [compliance] = await db
      .select()
      .from(shipCompliance)
      .where(and(eq(shipCompliance.shipId, shipId), eq(shipCompliance.year, year)))
      .orderBy(desc(shipCompliance.createdAt))
      .limit(1);
    return compliance || undefined;
  }

  async createShipCompliance(compliance: InsertShipCompliance): Promise<ShipCompliance> {
    const [newCompliance] = await db
      .insert(shipCompliance)
      .values(compliance)
      .returning();
    return newCompliance;
  }

  async updateShipCompliance(id: number, cbGco2eq: number): Promise<void> {
    await db
      .update(shipCompliance)
      .set({ cbGco2eq })
      .where(eq(shipCompliance.id, id));
  }

  // Bank Entries
  async getBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
    return await db
      .select()
      .from(bankEntries)
      .where(and(eq(bankEntries.shipId, shipId), eq(bankEntries.year, year)))
      .orderBy(desc(bankEntries.createdAt));
  }

  async createBankEntry(entry: InsertBankEntry): Promise<BankEntry> {
    const [bankEntry] = await db
      .insert(bankEntries)
      .values(entry)
      .returning();
    return bankEntry;
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const entries = await this.getBankEntries(shipId, year);
    return entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
  }

  // Pools
  async createPool(pool: InsertPool): Promise<Pool> {
    const [newPool] = await db
      .insert(pools)
      .values(pool)
      .returning();
    return newPool;
  }

  async createPoolMember(member: InsertPoolMember): Promise<PoolMember> {
    const [poolMember] = await db
      .insert(poolMembers)
      .values(member)
      .returning();
    return poolMember;
  }

  async getPoolMembers(poolId: number): Promise<PoolMember[]> {
    return await db
      .select()
      .from(poolMembers)
      .where(eq(poolMembers.poolId, poolId));
  }
}

export const storage = new DatabaseStorage();
