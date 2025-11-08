import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { 
  ComparisonResult, 
  ComplianceBalanceResponse, 
  PoolCreationRequest,
  PoolCreationResponse 
} from "@shared/schema";

import { 
  TARGET_INTENSITY_2025,
  calculateComplianceBalance,
  calculatePercentDiff,
  isCompliant 
} from "./domain/compliance-service";

import { 
  allocatePoolBalances,
  validatePool 
} from "./domain/pooling-service";

export async function registerRoutes(app: Express): Promise<Server> {

  // ✅ Centralized error helper
  const handleError = (res: any, error: unknown, message: string) => {
    console.error(`❌ ${message}:`, error);
    res.status(500).json({ error: message });
  };

  // ✅ GET all routes
  app.get("/api/routes", async (req, res) => {
    try {
      const allRoutes = await storage.getAllRoutes();
      res.json(allRoutes);
    } catch (error) {
      handleError(res, error, "Failed to fetch routes");
    }
  });

  // ✅ Set baseline route
  app.post("/api/routes/:routeId/baseline", async (req, res) => {
    try {
      const { routeId } = req.params;
      const route = await storage.getRouteByRouteId(routeId);
      if (!route) return res.status(404).json({ error: "Route not found" });

      await storage.setBaseline(routeId);
      res.json({ success: true, routeId });
    } catch (error) {
      handleError(res, error, "Failed to set baseline");
    }
  });

  // ✅ Compare baseline vs other routes
  app.get("/api/routes/comparison", async (req, res) => {
    try {
      const baseline = await storage.getBaselineRoute();
      if (!baseline) return res.json([]);

      const allRoutes = await storage.getAllRoutes();

      const comparisons: ComparisonResult[] = allRoutes.map(route => {
        const percentDiff = route.isBaseline
          ? 0
          : calculatePercentDiff(route.ghgIntensity, baseline.ghgIntensity);

        return {
          route,
          baselineIntensity: baseline.ghgIntensity,
          percentDiff,
          compliant: isCompliant(route.ghgIntensity),
        };
      });

      res.json(comparisons);
    } catch (error) {
      handleError(res, error, "Failed to fetch comparison data");
    }
  });

  // ✅ Compliance balance endpoint
  app.get("/api/compliance/cb", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year)
        return res.status(400).json({ error: "shipId and year are required" });

      const shipRoute = await storage.getRouteByRouteId(shipId as string);
      if (!shipRoute)
        return res.json({ shipId, year: parseInt(year as string), cb: 0 });

      const cb = calculateComplianceBalance(
        shipRoute.ghgIntensity,
        shipRoute.fuelConsumption
      );

      const existing = await storage.getShipCompliance(
        shipId as string,
        parseInt(year as string)
      );

      if (existing)
        await storage.updateShipCompliance(existing.id, cb);
      else
        await storage.createShipCompliance({
          shipId: shipId as string,
          year: parseInt(year as string),
          cbGco2eq: cb,
        });

      res.json({ shipId, year: parseInt(year as string), cb });
    } catch (error) {
      handleError(res, error, "Failed to calculate compliance balance");
    }
  });

  // ✅ Adjusted CB after banking
  app.get("/api/compliance/adjusted-cb", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year)
        return res.status(400).json({ error: "shipId and year are required" });

      const compliance = await storage.getShipCompliance(
        shipId as string,
        parseInt(year as string)
      );
      const totalBanked = await storage.getTotalBanked(
        shipId as string,
        parseInt(year as string)
      );

      const baseCB = compliance?.cbGco2eq || 0;
      const adjustedCB = baseCB + totalBanked;

      res.json({
        shipId,
        year: parseInt(year as string),
        cb: adjustedCB,
        cbBefore: baseCB,
        applied: totalBanked,
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch adjusted CB");
    }
  });

  // ✅ Banking endpoints
  app.get("/api/banking/records", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year)
        return res.status(400).json({ error: "shipId and year are required" });

      const records = await storage.getBankEntries(
        shipId as string,
        parseInt(year as string)
      );
      res.json(records);
    } catch (error) {
      handleError(res, error, "Failed to fetch banking records");
    }
  });

  app.post("/api/banking/bank", async (req, res) => {
    try {
      const { shipId, year, amount } = req.body;
      if (!shipId || !year || !amount)
        return res.status(400).json({ error: "shipId, year, and amount are required" });

      if (amount <= 0)
        return res.status(400).json({ error: "Amount must be positive" });

      const compliance = await storage.getShipCompliance(shipId, year);
      const currentCB = compliance?.cbGco2eq || 0;

      if (currentCB <= 0)
        return res.status(400).json({ error: "Cannot bank surplus when CB <= 0" });

      if (amount > currentCB)
        return res.status(400).json({ error: "Amount exceeds available surplus" });

      const entry = await storage.createBankEntry({
        shipId,
        year,
        amountGco2eq: amount,
      });

      await storage.updateShipCompliance(compliance!.id, currentCB - amount);

      res.json({ success: true, entry });
    } catch (error) {
      handleError(res, error, "Failed to bank surplus");
    }
  });

  app.post("/api/banking/apply", async (req, res) => {
    try {
      const { shipId, year, amount } = req.body;
      if (!shipId || !year || !amount)
        return res.status(400).json({ error: "shipId, year, and amount are required" });

      if (amount <= 0)
        return res.status(400).json({ error: "Amount must be positive" });

      const totalBanked = await storage.getTotalBanked(shipId, year);
      if (amount > totalBanked)
        return res.status(400).json({ error: "Amount exceeds available banked surplus" });

      const entry = await storage.createBankEntry({
        shipId,
        year,
        amountGco2eq: -amount,
      });

      const compliance = await storage.getShipCompliance(shipId, year);
      if (compliance)
        await storage.updateShipCompliance(compliance.id, compliance.cbGco2eq + amount);

      res.json({ success: true, entry });
    } catch (error) {
      handleError(res, error, "Failed to apply banked surplus");
    }
  });

  // ✅ Pool creation
  app.post("/api/pools", async (req, res) => {
    try {
      const { year, members } = req.body as PoolCreationRequest;
      if (!year || !members || members.length < 2)
        return res.status(400).json({ error: "Pool requires year and at least 2 members" });

      const verifiedMembers = [];

      for (const member of members) {
        const route = await storage.getRouteByRouteId(member.shipId);
        if (!route)
          return res.status(400).json({ error: `Route not found for ship ${member.shipId}` });

        const actualCB = calculateComplianceBalance(
          route.ghgIntensity,
          route.fuelConsumption
        );

        const compliance = await storage.getShipCompliance(member.shipId, year);
        const cbToUse = compliance?.cbGco2eq ?? actualCB;

        verifiedMembers.push({ shipId: member.shipId, cbBefore: cbToUse });
      }

      const allocated = allocatePoolBalances(verifiedMembers);
      const validation = validatePool(allocated);
      if (!validation.valid)
        return res.status(400).json({ error: "Pool validation failed", errors: validation.errors });

      const pool = await storage.createPool({ year });
      for (const member of allocated) {
        await storage.createPoolMember({
          poolId: pool.id,
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: member.cbAfter,
        });
      }

      const totalSum = verifiedMembers.reduce((sum, m) => sum + m.cbBefore, 0);
      res.json({
        poolId: pool.id,
        members: allocated,
        totalSum,
        valid: true,
      });
    } catch (error) {
      handleError(res, error, "Failed to create pool");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
