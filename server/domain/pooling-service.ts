// Domain Service: Pooling Logic (Article 21)
// Pure business logic - no framework dependencies

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter?: number;
}

export interface PoolValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Greedy allocation algorithm for pooling
 * Sort members by CB (descending), transfer surplus to deficits
 * Article 21 - FuelEU Maritime Regulation
 */
export function allocatePoolBalances(
  members: Array<{ shipId: string; cbBefore: number }>
): Array<{ shipId: string; cbBefore: number; cbAfter: number }> {
  const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);
  const results = sorted.map(m => ({ ...m, cbAfter: m.cbBefore }));
  
  let surplusIdx = 0;
  let deficitIdx = results.length - 1;
  
  while (surplusIdx < deficitIdx) {
    const surplus = results[surplusIdx];
    const deficit = results[deficitIdx];
    
    if (surplus.cbAfter <= 0) {
      surplusIdx++;
      continue;
    }
    
    if (deficit.cbAfter >= 0) {
      deficitIdx--;
      continue;
    }
    
    const transferAmount = Math.min(surplus.cbAfter, Math.abs(deficit.cbAfter));
    
    surplus.cbAfter -= transferAmount;
    deficit.cbAfter += transferAmount;
    
    if (surplus.cbAfter <= 0) surplusIdx++;
    if (deficit.cbAfter >= 0) deficitIdx--;
  }
  
  return results;
}

/**
 * Validate pooling rules per Article 21
 * Rules:
 * 1. Sum of all CBs must be >= 0
 * 2. Deficit ships cannot exit worse than entry
 * 3. Surplus ships cannot exit with negative CB
 */
export function validatePool(
  members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>
): PoolValidationResult {
  const totalSum = members.reduce((sum, m) => sum + m.cbBefore, 0);
  const errors: string[] = [];
  
  // Rule 1: Sum must be >= 0
  if (totalSum < 0) {
    errors.push("Total pool sum must be >= 0");
  }
  
  // Rule 2: Deficit ships cannot exit worse
  for (const member of members) {
    if (member.cbBefore < 0 && member.cbAfter < member.cbBefore) {
      errors.push(`Ship ${member.shipId} would exit worse than entry`);
    }
  }
  
  // Rule 3: Surplus ships cannot exit negative
  for (const member of members) {
    if (member.cbBefore > 0 && member.cbAfter < 0) {
      errors.push(`Ship ${member.shipId} would exit with negative CB`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
