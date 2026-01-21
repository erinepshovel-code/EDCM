export interface EDCMMetrics {
  C: number; // Constraint Strain
  R: number; // Refusal
  D: number; // Deflection
  N: number; // Noise
  L: number; // Coherence Loss
  O: number; // Overconfidence
  F: number; // Fixation
  E: number; // Escalation
  I: number; // Integration Failure
}

export interface EDCMModifiers {
  urgency: number;
  sentiment: number;
  drift: number;
  filler: number;
}

export interface EDCMTrends {
  dC: number;
  dR: number;
  dD: number;
  dN: number;
  dL: number;
  dO: number;
  dF: number;
  dE: number;
  dI: number;
}

export interface EDCMProgress {
  decisions: number;
  commitments: number;
  artifacts: number;
  followthrough: number;
  vector: number;
}

export interface EDCMResult {
  metrics: EDCMMetrics;
  modifiers: EDCMModifiers;
  trends: EDCMTrends;
  progress: EDCMProgress;
  annotations: { keySpans: Array<{ start: number; end: number; label: string }> };
}

export interface AnalysisOptions {
  mode: 'dating' | 'politics' | 'lab';
  contextTags?: string[];
  isMultiParty?: boolean;
  audioFeatures?: {
    speechRate: number;
    pauseDensity: number;
    volumeVariance: number;
    pitchVariance: number;
  };
}
