// API routes implementation following hexagonal architecture
// Inbound HTTP adapter - handles requests and delegates to domain logic
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { 
  ComparisonResult, 
  ComplianceBalanceResponse, 
  PoolCreationRequest,
  PoolCreationResponse 
} from "@shared/schema";

// Import domain services (business logic layer)
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
  
  // GET /api/routes - Get all routes
  app.get("/api/routes", async (req, res) => {
    try {
      const allRoutes = await storage.getAllRoutes();
      res.json(allRoutes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  // POST /api/routes/:routeId/baseline - Set baseline route
  app.post("/api/routes/:routeId/baseline", async (req, res) => {
    try {
      const { routeId } = req.params;
      
      const route = await storage.getRouteByRouteId(routeId);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      
      await storage.setBaseline(routeId);
      res.json({ success: true, routeId });
    } catch (error) {
      res.status(500).json({ error: "Failed to set baseline" });
    }
  });

  // GET /api/routes/comparison - Get baseline vs comparison data
  app.get("/api/routes/comparison", async (req, res) => {
    try {
      const baseline = await storage.getBaselineRoute();
      
      if (!baseline) {
        return res.json([]);
      }
      
      const allRoutes = await storage.getAllRoutes();
      
      const comparisons: ComparisonResult[] = allRoutes.map(route => {
        const percentDiff = route.isBaseline 
          ? 0 
          : calculatePercentDiff(route.ghgIntensity, baseline.ghgIntensity);
        
        const compliant = isCompliant(route.ghgIntensity);
        
        return {
          route,
          baselineIntensity: baseline.ghgIntensity,
          percentDiff,
          compliant,
        };
      });
      
      res.json(comparisons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comparison data" });
    }
  });

  // GET /api/compliance/cb - Get compliance balance for a ship/year
  app.get("/api/compliance/cb", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year are required" });
      }
      
      // Map shipId to routeId (in this implementation, shipId corresponds to routeId)
      // This allows us to calculate CB from actual route data
      const shipRoute = await storage.getRouteByRouteId(shipId as string);
      
      if (!shipRoute) {
        // If no route found for this shipId, return 0 CB
        return res.json({ 
          shipId, 
          year: parseInt(year as string), 
          cb: 0 
        } as ComplianceBalanceResponse);
      }
      
      // Calculate CB using the ship's actual route data
      const cb = calculateComplianceBalance(shipRoute.ghgIntensity, shipRoute.fuelConsumption);
      
      // Store or update compliance record
      const existing = await storage.getShipCompliance(shipId as string, parseInt(year as string));
      if (existing) {
        await storage.updateShipCompliance(existing.id, cb);
      } else {
        await storage.createShipCompliance({
          shipId: shipId as string,
          year: parseInt(year as string),
          cbGco2eq: cb,
        });
      }
      
      res.json({ 
        shipId, 
        year: parseInt(year as string), 
        cb 
      } as ComplianceBalanceResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate compliance balance" });
    }
  });

  // GET /api/compliance/adjusted-cb - Get adjusted CB after banking
  app.get("/api/compliance/adjusted-cb", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year are required" });
      }
      
      const compliance = await storage.getShipCompliance(shipId as string, parseInt(year as string));
      const totalBanked = await storage.getTotalBanked(shipId as string, parseInt(year as string));
      
      const baseCB = compliance?.cbGco2eq || 0;
      const adjustedCB = baseCB + totalBanked;
      
      res.json({ 
        shipId, 
        year: parseInt(year as string), 
        cb: adjustedCB,
        cbBefore: baseCB,
        applied: totalBanked
      } as ComplianceBalanceResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch adjusted CB" });
    }
  });

  // GET /api/banking/records - Get banking records
  app.get("/api/banking/records", async (req, res) => {
    try {
      const { shipId, year } = req.query;
      
      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year are required" });
      }
      
      const records = await storage.getBankEntries(shipId as string, parseInt(year as string));
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banking records" });
    }
  });

  // POST /api/banking/bank - Bank positive CB
  app.post("/api/banking/bank", async (req, res) => {
    try {
      const { shipId, year, amount } = req.body;
      
      if (!shipId || !year || !amount) {
        return res.status(400).json({ error: "shipId, year, and amount are required" });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }
      
      // Check current CB
      const compliance = await storage.getShipCompliance(shipId, year);
      const currentCB = compliance?.cbGco2eq || 0;
      
      if (currentCB <= 0) {
        return res.status(400).json({ error: "Cannot bank surplus when CB <= 0" });
      }
      
      if (amount > currentCB) {
        return res.status(400).json({ error: "Amount exceeds available surplus" });
      }
      
      // Create bank entry
      const entry = await storage.createBankEntry({
        shipId,
        year,
        amountGco2eq: amount,
      });
      
      // Update compliance balance
      if (compliance) {
        await storage.updateShipCompliance(compliance.id, currentCB - amount);
      }
      
      res.json({ success: true, entry });
    } catch (error) {
      res.status(500).json({ error: "Failed to bank surplus" });
    }
  });

  // POST /api/banking/apply - Apply banked surplus to deficit
  app.post("/api/banking/apply", async (req, res) => {
    try {
      const { shipId, year, amount } = req.body;
      
      if (!shipId || !year || !amount) {
        return res.status(400).json({ error: "shipId, year, and amount are required" });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }
      
      // Check available banked amount
      const totalBanked = await storage.getTotalBanked(shipId, year);
      
      if (amount > totalBanked) {
        return res.status(400).json({ error: "Amount exceeds available banked surplus" });
      }
      
      // Create negative bank entry to represent application
      const entry = await storage.createBankEntry({
        shipId,
        year,
        amountGco2eq: -amount,
      });
      
      // Update compliance balance
      const compliance = await storage.getShipCompliance(shipId, year);
      if (compliance) {
        await storage.updateShipCompliance(compliance.id, compliance.cbGco2eq + amount);
      }
      
      res.json({ success: true, entry });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply banked surplus" });
    }
  });

  // POST /api/pools - Create compliance pool
  app.post("/api/pools", async (req, res) => {
    try {
      const { year, members } = req.body as PoolCreationRequest;
      
      if (!year || !members || members.length < 2) {
        return res.status(400).json({ error: "Pool requires year and at least 2 members" });
      }
      
      // Re-fetch and verify CB values from database (don't trust client data)
      const verifiedMembers = [];
      for (const member of members) {
        // Get the ship's route to calculate actual CB
        const route = await storage.getRouteByRouteId(member.shipId);
        if (!route) {
          return res.status(400).json({ 
            error: `Route not found for ship ${member.shipId}` 
          });
        }
        
        // Calculate authoritative CB from stored route data
        const actualCB = calculateComplianceBalance(route.ghgIntensity, route.fuelConsumption);
        
        // Check if there's stored compliance record
        const compliance = await storage.getShipCompliance(member.shipId, year);
        const cbToUse = compliance?.cbGco2eq ?? actualCB;
        
        verifiedMembers.push({
          shipId: member.shipId,
          cbBefore: cbToUse, // Use verified CB from database
        });
      }
      
      // Allocate using greedy algorithm with verified data
      const allocated = allocatePoolBalances(verifiedMembers);
      
      // Validate pooling rules
      const validation = validatePool(allocated);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: "Pool validation failed", 
          errors: validation.errors 
        });
      }
      
      // Create pool and members
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
      
      const response: PoolCreationResponse = {
        poolId: pool.id,
        members: allocated,
        totalSum,
        valid: true,
      };
      
      res.json(response);
    } catch (error) {
      console.error("Pool creation error:", error);
      res.status(500).json({ error: "Failed to create pool" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
