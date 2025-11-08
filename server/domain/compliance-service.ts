// Domain Service: Compliance Balance Calculations
// Pure business logic - no framework dependencies

import type { Route } from "@shared/schema";

// Domain constants - FuelEU Maritime Regulation
export const TARGET_INTENSITY_2025 = 89.3368; // gCO2e/MJ - 2% below 91.16
export const ENERGY_CONVERSION_FACTOR = 41000; // MJ per tonne of fuel

/**
 * Calculate compliance balance using FuelEU formula
 * CB = (Target - Actual) × Energy in scope
 * Positive CB = Surplus, Negative CB = Deficit
 */
export function calculateComplianceBalance(
  ghgIntensity: number,
  fuelConsumption: number
): number {
  const energyInScope = fuelConsumption * ENERGY_CONVERSION_FACTOR; // MJ
  const cb = (TARGET_INTENSITY_2025 - ghgIntensity) * energyInScope; // gCO2eq
  return cb;
}

/**
 * Calculate percentage difference for comparison
 * Formula: ((comparison / baseline) − 1) × 100
 */
export function calculatePercentDiff(
  comparisonIntensity: number,
  baselineIntensity: number
): number {
  return ((comparisonIntensity / baselineIntensity) - 1) * 100;
}

/**
 * Check if a route is compliant with target intensity
 */
export function isCompliant(ghgIntensity: number): boolean {
  return ghgIntensity <= TARGET_INTENSITY_2025;
}
