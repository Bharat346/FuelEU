import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Routes table - stores vessel route data with emissions metrics
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  routeId: varchar("route_id", { length: 50 }).notNull().unique(),
  vesselType: varchar("vessel_type", { length: 100 }).notNull(),
  fuelType: varchar("fuel_type", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  ghgIntensity: real("ghg_intensity").notNull(), // gCO2e/MJ
  fuelConsumption: real("fuel_consumption").notNull(), // tonnes
  distance: real("distance").notNull(), // km
  totalEmissions: real("total_emissions").notNull(), // tonnes
  isBaseline: boolean("is_baseline").notNull().default(false),
});

// Ship compliance table - stores computed compliance balance records
export const shipCompliance = pgTable("ship_compliance", {
  id: serial("id").primaryKey(),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  cbGco2eq: real("cb_gco2eq").notNull(), // Compliance Balance in gCO2eq
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Bank entries table - stores banked surplus amounts
export const bankEntries = pgTable("bank_entries", {
  id: serial("id").primaryKey(),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  amountGco2eq: real("amount_gco2eq").notNull(), // Banked amount in gCO2eq
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Pools table - registry of compliance pools
export const pools = pgTable("pools", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Pool members table - tracks ship participation in pools with before/after CB
export const poolMembers = pgTable("pool_members", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => pools.id),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  cbBefore: real("cb_before").notNull(), // CB before pooling
  cbAfter: real("cb_after").notNull(), // CB after pooling allocation
});

// Relations
export const poolsRelations = relations(pools, ({ many }) => ({
  members: many(poolMembers),
}));

export const poolMembersRelations = relations(poolMembers, ({ one }) => ({
  pool: one(pools, {
    fields: [poolMembers.poolId],
    references: [pools.id],
  }),
}));

// Insert schemas
export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
});

export const insertShipComplianceSchema = createInsertSchema(shipCompliance).omit({
  id: true,
  createdAt: true,
});

export const insertBankEntrySchema = createInsertSchema(bankEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPoolSchema = createInsertSchema(pools).omit({
  id: true,
  createdAt: true,
});

export const insertPoolMemberSchema = createInsertSchema(poolMembers).omit({
  id: true,
});

// Types
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type ShipCompliance = typeof shipCompliance.$inferSelect;
export type InsertShipCompliance = z.infer<typeof insertShipComplianceSchema>;

export type BankEntry = typeof bankEntries.$inferSelect;
export type InsertBankEntry = z.infer<typeof insertBankEntrySchema>;

export type Pool = typeof pools.$inferSelect;
export type InsertPool = z.infer<typeof insertPoolSchema>;

export type PoolMember = typeof poolMembers.$inferSelect;
export type InsertPoolMember = z.infer<typeof insertPoolMemberSchema>;

// API response types
export type ComparisonResult = {
  route: Route;
  baselineIntensity: number;
  percentDiff: number;
  compliant: boolean;
};

export type ComplianceBalanceResponse = {
  shipId: string;
  year: number;
  cb: number;
  cbBefore?: number;
  cbAfter?: number;
  applied?: number;
};

export type PoolCreationRequest = {
  year: number;
  members: Array<{
    shipId: string;
    cbBefore: number;
  }>;
};

export type PoolCreationResponse = {
  poolId: number;
  members: Array<{
    shipId: string;
    cbBefore: number;
    cbAfter: number;
  }>;
  totalSum: number;
  valid: boolean;
  errors?: string[];
};
