import { EDCMResult } from './types';

// Projection Types
export type DatingPace = 'Steady' | 'Rising' | 'Skewed';
export type DatingBalance = 'Mutual' | 'Uneven' | 'Avoidant';
export type DatingClarity = 'Clear' | 'Mixed' | 'Foggy';

export type PoliticalPressure = 'Low' | 'Rising' | 'High';
export type PoliticalClarity = 'Clear' | 'Mixed' | 'Obscured';
export type PoliticalResponsibility = 'Acknowledged' | 'Displaced' | 'Externalized';

export interface DatingProjection {
  pace: DatingPace;
  balance: DatingBalance;
  clarity: DatingClarity;
}

export interface PoliticalProjection {
  pressure: PoliticalPressure;
  clarity: PoliticalClarity;
  responsibility: PoliticalResponsibility;
}

// Weights Configuration (Editable)
const WEIGHTS = {
  dating: {
    pace: { E: 0.3, urgency: 0.3, dE: 0.2, R: 0.1, F: 0.1 },
    balance: { L: 0.4, D: 0.3, R: 0.3 },
    clarity: { O: 0.2, D: 0.3, N: 0.3, C: 0.2 }
  },
  politics: {
    pressure: { E: 0.4, urgency: 0.3, R: 0.1, dE: 0.2 },
    clarity: { O: 0.2, D: 0.3, N: 0.3, C: 0.2 },
    responsibility: { L: 0.3, R: 0.3, D: 0.4 }
  }
};

// Helper to compute weighted score
function weightedScore(result: EDCMResult, weights: Record<string, number>): number {
  let score = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    let value = 0;
    // Map keys to result paths
    if (key === 'urgency' || key === 'sentiment' || key === 'drift' || key === 'filler') {
      value = result.modifiers[key as keyof typeof result.modifiers];
    } else if (key.startsWith('d')) {
      value = result.trends[key as keyof typeof result.trends];
    } else {
      value = result.metrics[key as keyof typeof result.metrics];
    }
    
    // Normalize trends to 0-1 approx for scoring if needed, but here we assume raw inputs are largely 0-1
    // Trends can be negative, so we map -0.2 to 0.2 range roughly to 0-1 impact if significant
    if (key.startsWith('d')) value = (value + 0.2) * 2.5; // Approximate normalization

    score += value * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? score / totalWeight : 0;
}

export function projectDating(result: EDCMResult): DatingProjection {
  const paceScore = weightedScore(result, WEIGHTS.dating.pace);
  const balanceScore = weightedScore(result, WEIGHTS.dating.balance);
  const clarityScore = weightedScore(result, WEIGHTS.dating.clarity);

  return {
    pace: paceScore > 0.6 ? 'Skewed' : paceScore > 0.4 ? 'Rising' : 'Steady',
    balance: balanceScore > 0.6 ? 'Avoidant' : balanceScore > 0.4 ? 'Uneven' : 'Mutual',
    clarity: clarityScore > 0.6 ? 'Foggy' : clarityScore > 0.4 ? 'Mixed' : 'Clear'
  };
}

export function projectPolitical(result: EDCMResult): PoliticalProjection {
  const pressureScore = weightedScore(result, WEIGHTS.politics.pressure);
  const clarityScore = weightedScore(result, WEIGHTS.politics.clarity);
  const respScore = weightedScore(result, WEIGHTS.politics.responsibility);

  return {
    pressure: pressureScore > 0.6 ? 'High' : pressureScore > 0.4 ? 'Rising' : 'Low',
    clarity: clarityScore > 0.6 ? 'Obscured' : clarityScore > 0.4 ? 'Mixed' : 'Clear',
    responsibility: respScore > 0.6 ? 'Externalized' : respScore > 0.4 ? 'Displaced' : 'Acknowledged'
  };
}
