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
import { eq, and, desc, sql } from "drizzle-orm";

// Custom error classes
export class StorageError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Storage interface - defines ports for data operations
export interface IStorage {
  // Routes
  getAllRoutes(): Promise<Route[]>;
  getRouteById(id: string): Promise<Route>;
  getRouteByRouteId(routeId: string): Promise<Route>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route>;
  deleteRoute(id: string): Promise<void>;
  setBaseline(routeId: string): Promise<void>;
  getBaselineRoute(): Promise<Route | undefined>;
  getRoutesByYear(year: number): Promise<Route[]>;

  // Ship Compliance
  getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | undefined>;
  getShipComplianceHistory(shipId: string, limit?: number): Promise<ShipCompliance[]>;
  createShipCompliance(compliance: InsertShipCompliance): Promise<ShipCompliance>;
  updateShipCompliance(id: string, updates: Partial<ShipCompliance>): Promise<ShipCompliance>;
  deleteShipCompliance(id: string): Promise<void>;

  // Bank Entries
  getBankEntries(shipId: string, year: number): Promise<BankEntry[]>;
  getBankEntryById(id: string): Promise<BankEntry>;
  createBankEntry(entry: InsertBankEntry): Promise<BankEntry>;
  updateBankEntry(id: string, updates: Partial<InsertBankEntry>): Promise<BankEntry>;
  deleteBankEntry(id: string): Promise<void>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  getBankSummary(shipId: string, startYear: number, endYear: number): Promise<{ year: number; total: number }[]>;

  // Pools
  createPool(pool: InsertPool): Promise<Pool>;
  getPoolById(id: string): Promise<Pool>;
  getAllPools(): Promise<Pool[]>;
  updatePool(id: string, updates: Partial<InsertPool>): Promise<Pool>;
  deletePool(id: string): Promise<void>;
  createPoolMember(member: InsertPoolMember): Promise<PoolMember>;
  getPoolMembers(poolId: string): Promise<PoolMember[]>;
  getPoolMemberById(id: string): Promise<PoolMember>;
  removePoolMember(id: string): Promise<void>;
  getPoolsByShip(shipId: string): Promise<Pool[]>;
}

// DatabaseStorage - adapter implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // Routes
  async getAllRoutes(): Promise<Route[]> {
    try {
      return await db.select().from(routes).orderBy(routes.year, routes.routeId);
    } catch (error) {
      throw new StorageError('Failed to fetch routes', error);
    }
  }

  async getRouteById(id: string): Promise<Route> {
    try {
      const [route] = await db.select().from(routes).where(eq(routes.id, id));
      if (!route) {
        throw new NotFoundError('Route', id);
      }
      return route;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to fetch route with ID ${id}`, error);
    }
  }

  async getRouteByRouteId(routeId: string): Promise<Route> {
    try {
      const [route] = await db.select().from(routes).where(eq(routes.routeId, routeId));
      if (!route) {
        throw new NotFoundError('Route', routeId);
      }
      return route;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to fetch route with routeId ${routeId}`, error);
    }
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    try {
      // Validate required fields
      if (!insertRoute.routeId?.trim()) {
        throw new ValidationError('Route ID is required');
      }
      if (!insertRoute.year || insertRoute.year < 2000 || insertRoute.year > 2100) {
        throw new ValidationError('Valid year is required (2000-2100)');
      }

      const [route] = await db
        .insert(routes)
        .values(insertRoute)
        .returning();

      if (!route) {
        throw new StorageError('Failed to create route - no data returned');
      }

      return route;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError('Failed to create route', error);
    }
  }

  async updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route> {
    try {
      const [route] = await db
        .update(routes)
        .set(updates)
        .where(eq(routes.id, id))
        .returning();

      if (!route) {
        throw new NotFoundError('Route', id);
      }

      return route;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to update route with ID ${id}`, error);
    }
  }

  async deleteRoute(id: string): Promise<void> {
    try {
      const [route] = await db
        .delete(routes)
        .where(eq(routes.id, id))
        .returning();

      if (!route) {
        throw new NotFoundError('Route', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to delete route with ID ${id}`, error);
    }
  }

  async setBaseline(routeId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // First, unset all baselines
        await tx.update(routes).set({ isBaseline: false });

        // Then set the specified route as baseline
        const [updated] = await tx
          .update(routes)
          .set({ isBaseline: true })
          .where(eq(routes.routeId, routeId))
          .returning();

        if (!updated) {
          throw new NotFoundError('Route', routeId);
        }
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to set baseline route ${routeId}`, error);
    }
  }

  async getBaselineRoute(): Promise<Route | undefined> {
    try {
      const [route] = await db.select().from(routes).where(eq(routes.isBaseline, true));
      return route || undefined;
    } catch (error) {
      throw new StorageError('Failed to fetch baseline route', error);
    }
  }

  async getRoutesByYear(year: number): Promise<Route[]> {
    try {
      return await db
        .select()
        .from(routes)
        .where(eq(routes.year, year))
        .orderBy(routes.routeId);
    } catch (error) {
      throw new StorageError(`Failed to fetch routes for year ${year}`, error);
    }
  }

  // Ship Compliance
  async getShipCompliance(shipId: string, year: number): Promise<ShipCompliance | undefined> {
    try {
      const [compliance] = await db
        .select()
        .from(shipCompliance)
        .where(and(eq(shipCompliance.shipId, shipId), eq(shipCompliance.year, year)));

      return compliance || undefined;
    } catch (error) {
      throw new StorageError(`Failed to fetch compliance for ship ${shipId}, year ${year}`, error);
    }
  }

  async getShipComplianceHistory(shipId: string, limit: number = 10): Promise<ShipCompliance[]> {
    try {
      return await db
        .select()
        .from(shipCompliance)
        .where(eq(shipCompliance.shipId, shipId))
        .orderBy(desc(shipCompliance.year), desc(shipCompliance.createdAt))
        .limit(limit);
    } catch (error) {
      throw new StorageError(`Failed to fetch compliance history for ship ${shipId}`, error);
    }
  }

  async createShipCompliance(compliance: InsertShipCompliance): Promise<ShipCompliance> {
    try {
      if (!compliance.shipId?.trim()) {
        throw new ValidationError('Ship ID is required');
      }
      if (!compliance.year || compliance.year < 2000 || compliance.year > 2100) {
        throw new ValidationError('Valid year is required (2000-2100)');
      }

      const [newCompliance] = await db
        .insert(shipCompliance)
        .values(compliance)
        .returning();

      if (!newCompliance) {
        throw new StorageError('Failed to create ship compliance - no data returned');
      }

      return newCompliance;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError('Failed to create ship compliance', error);
    }
  }

  async updateShipCompliance(id: string, updates: Partial<ShipCompliance>): Promise<ShipCompliance> {
    try {
      const [compliance] = await db
        .update(shipCompliance)
        .set(updates)
        .where(eq(shipCompliance.id, id))
        .returning();

      if (!compliance) {
        throw new NotFoundError('Ship compliance record', id);
      }

      return compliance;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to update ship compliance with ID ${id}`, error);
    }
  }

  async deleteShipCompliance(id: string): Promise<void> {
    try {
      const [compliance] = await db
        .delete(shipCompliance)
        .where(eq(shipCompliance.id, id))
        .returning();

      if (!compliance) {
        throw new NotFoundError('Ship compliance record', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to delete ship compliance with ID ${id}`, error);
    }
  }

  // Bank Entries
  async getBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
    try {
      return await db
        .select()
        .from(bankEntries)
        .where(and(eq(bankEntries.shipId, shipId), eq(bankEntries.year, year)))
        .orderBy(desc(bankEntries.createdAt));
    } catch (error) {
      throw new StorageError(`Failed to fetch bank entries for ship ${shipId}, year ${year}`, error);
    }
  }

  async getBankEntryById(id: string): Promise<BankEntry> {
    try {
      const [entry] = await db.select().from(bankEntries).where(eq(bankEntries.id, id));
      if (!entry) {
        throw new NotFoundError('Bank entry', id);
      }
      return entry;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to fetch bank entry with ID ${id}`, error);
    }
  }

  async createBankEntry(entry: InsertBankEntry): Promise<BankEntry> {
    try {
      if (!entry.shipId?.trim()) {
        throw new ValidationError('Ship ID is required');
      }
      if (!entry.year || entry.year < 2000 || entry.year > 2100) {
        throw new ValidationError('Valid year is required (2000-2100)');
      }

      const [bankEntry] = await db
        .insert(bankEntries)
        .values(entry)
        .returning();

      if (!bankEntry) {
        throw new StorageError('Failed to create bank entry - no data returned');
      }

      return bankEntry;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError('Failed to create bank entry', error);
    }
  }

  async updateBankEntry(id: string, updates: Partial<InsertBankEntry>): Promise<BankEntry> {
    try {
      const [entry] = await db
        .update(bankEntries)
        .set(updates)
        .where(eq(bankEntries.id, id))
        .returning();

      if (!entry) {
        throw new NotFoundError('Bank entry', id);
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to update bank entry with ID ${id}`, error);
    }
  }

  async deleteBankEntry(id: string): Promise<void> {
    try {
      const [entry] = await db
        .delete(bankEntries)
        .where(eq(bankEntries.id, id))
        .returning();

      if (!entry) {
        throw new NotFoundError('Bank entry', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to delete bank entry with ID ${id}`, error);
    }
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    try {
      const result = await db
        .select({ total: sql<number>`SUM(${bankEntries.amountGco2eq})` })
        .from(bankEntries)
        .where(and(eq(bankEntries.shipId, shipId), eq(bankEntries.year, year)));

      return result[0]?.total || 0;
    } catch (error) {
      throw new StorageError(`Failed to calculate total banked for ship ${shipId}, year ${year}`, error);
    }
  }

  async getBankSummary(shipId: string, startYear: number, endYear: number): Promise<{ year: number; total: number }[]> {
    try {
      return await db
        .select({
          year: bankEntries.year,
          total: sql<number>`SUM(${bankEntries.amountGco2eq})`
        })
        .from(bankEntries)
        .where(and(
          eq(bankEntries.shipId, shipId),
          sql`${bankEntries.year} >= ${startYear} AND ${bankEntries.year} <= ${endYear}`
        ))
        .groupBy(bankEntries.year)
        .orderBy(bankEntries.year);
    } catch (error) {
      throw new StorageError(`Failed to fetch bank summary for ship ${shipId}`, error);
    }
  }

  // Pools
  async createPool(pool: InsertPool): Promise<Pool> {
    try {
      if (!pool.year || pool.year < 2000 || pool.year > 2100) {
        throw new ValidationError('Valid year is required (2000-2100)');
      }

      const [newPool] = await db
        .insert(pools)
        .values(pool)
        .returning();

      if (!newPool) {
        throw new StorageError('Failed to create pool - no data returned');
      }

      return newPool;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError('Failed to create pool', error);
    }
  }

  async getPoolById(id: string): Promise<Pool> {
    try {
      const [pool] = await db.select().from(pools).where(eq(pools.id, id));
      if (!pool) {
        throw new NotFoundError('Pool', id);
      }
      return pool;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to fetch pool with ID ${id}`, error);
    }
  }

  async getAllPools(): Promise<Pool[]> {
    try {
      return await db.select().from(pools).orderBy(pools.year, pools.createdAt);
    } catch (error) {
      throw new StorageError('Failed to fetch pools', error);
    }
  }

  async updatePool(id: string, updates: Partial<InsertPool>): Promise<Pool> {
    try {
      const [pool] = await db
        .update(pools)
        .set(updates)
        .where(eq(pools.id, id))
        .returning();

      if (!pool) {
        throw new NotFoundError('Pool', id);
      }

      return pool;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to update pool with ID ${id}`, error);
    }
  }

  async deletePool(id: string): Promise<void> {
    try {
      // Pool members will be automatically deleted due to onDelete: Cascade
      const [pool] = await db
        .delete(pools)
        .where(eq(pools.id, id))
        .returning();

      if (!pool) {
        throw new NotFoundError('Pool', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to delete pool with ID ${id}`, error);
    }
  }

  async createPoolMember(member: InsertPoolMember): Promise<PoolMember> {
    try {
      if (!member.poolId) {
        throw new ValidationError('Pool ID is required');
      }
      if (!member.shipId?.trim()) {
        throw new ValidationError('Ship ID is required');
      }

      // Check if pool exists
      await this.getPoolById(member.poolId);

      const [poolMember] = await db
        .insert(poolMembers)
        .values(member)
        .returning();

      if (!poolMember) {
        throw new StorageError('Failed to create pool member - no data returned');
      }

      return poolMember;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      throw new StorageError('Failed to create pool member', error);
    }
  }

  async getPoolMembers(poolId: string): Promise<PoolMember[]> {
    try {
      return await db
        .select()
        .from(poolMembers)
        .where(eq(poolMembers.poolId, poolId))
        .orderBy(poolMembers.createdAt);
    } catch (error) {
      throw new StorageError(`Failed to fetch members for pool ${poolId}`, error);
    }
  }

  async getPoolMemberById(id: string): Promise<PoolMember> {
    try {
      const [member] = await db.select().from(poolMembers).where(eq(poolMembers.id, id));
      if (!member) {
        throw new NotFoundError('Pool member', id);
      }
      return member;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to fetch pool member with ID ${id}`, error);
    }
  }

  async removePoolMember(id: string): Promise<void> {
    try {
      const [member] = await db
        .delete(poolMembers)
        .where(eq(poolMembers.id, id))
        .returning();

      if (!member) {
        throw new NotFoundError('Pool member', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError(`Failed to remove pool member with ID ${id}`, error);
    }
  }

  async getPoolsByShip(shipId: string): Promise<Pool[]> {
    try {
      return await db
        .select({
          id: pools.id,
          year: pools.year,
          createdAt: pools.createdAt
        })
        .from(pools)
        .innerJoin(poolMembers, eq(pools.id, poolMembers.poolId))
        .where(eq(poolMembers.shipId, shipId))
        .orderBy(pools.year, pools.createdAt);
    } catch (error) {
      throw new StorageError(`Failed to fetch pools for ship ${shipId}`, error);
    }
  }
}

export const storage = new DatabaseStorage();