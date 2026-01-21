import { EDCMResult, AnalysisOptions } from './types';

// Deterministic Pseudo-Random Number Generator for consistent "analysis" on same text
function pseudoRandom(seed: string) {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = (value << 5) - value + seed.charCodeAt(i);
    value |= 0;
  }
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function analyzeText(text: string, options: AnalysisOptions): EDCMResult {
  const rng = pseudoRandom(text + options.mode);
  
  // Base metrics based on text length and some keyword heuristics
  const lengthScore = Math.min(1, text.length / 500);
  let urgency = /asap|now|urgent|immediately|need/i.test(text) ? 0.8 : 0.2;
  let refusal = /no|cannot|won't|stop|don't/i.test(text) ? 0.6 : 0.1;
  const confusion = /what|huh|mean|clarify/i.test(text) ? 0.5 : 0.1;

  // Audio modifiers
  if (options.audioFeatures) {
    const { speechRate, pauseDensity, volumeVariance } = options.audioFeatures;
    // Fast speech (>150wpm) increases urgency and escalation
    if (speechRate > 150) urgency += 0.3;
    // Low pauses (<0.2) increases pressure/escalation
    if (pauseDensity < 0.2) urgency += 0.2;
    // High volume variance suggests emotional volatility (mapped to Escalation/Noise)
    if (volumeVariance > 0.6) refusal += 0.1;
  }

  // Generate deterministic noise
  const r = (min: number, max: number) => min + rng() * (max - min);

  return {
    metrics: {
      C: r(0.1, 0.4) + (lengthScore * 0.2), // Constraint accumulates with length
      R: r(0, 0.2) + refusal,
      D: r(0, 0.3),
      N: r(0, 0.2),
      L: r(0, 0.3) + (confusion * 0.5),
      O: r(0.3, 0.8),
      F: r(0, 0.4),
      E: r(0, 0.3) + urgency, // Audio urgency directly impacts E
      I: r(0, 0.2)
    },
    modifiers: {
      urgency: urgency,
      sentiment: r(-0.5, 0.5),
      drift: r(0, 0.3),
      filler: r(0, 0.2)
    },
    trends: {
      dC: r(-0.1, 0.2),
      dR: r(-0.05, 0.1),
      dD: r(-0.1, 0.1),
      dN: r(-0.05, 0.05),
      dL: r(0, 0.1),
      dO: r(-0.1, 0.1),
      dF: r(0, 0.1),
      dE: r(-0.1, 0.2),
      dI: r(0, 0.1)
    },
    progress: {
      decisions: Math.floor(r(0, 5)),
      commitments: Math.floor(r(0, 3)),
      artifacts: Math.floor(r(0, 2)),
      followthrough: r(0, 1),
      vector: r(0, 1)
    },
    annotations: {
      keySpans: []
    }
  };
}
