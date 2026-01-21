import { LucideIcon } from "lucide-react";

export type MetricTrend = "up" | "down" | "flat";

export interface MetricData {
  value: number;
  delta: number;
  trend: MetricTrend;
  history: number[];
}

export interface TurnMetrics {
  C: number; // Constraint Strain (Inter-field tension)
  R: number; // Refusal (Field blockage)
  F: number; // Fixation (Looping signal)
  E: number; // Escalation (Energy spike)
  D: number; // Deflection (Signal avoidance)
  N: number; // Noise (Signal degradation)
  I: number; // Integration Failure (Coherence loss)
  O: number; // Overconfidence (Signal rigidity)
  L: number; // Coherence Loss (Internal drift)
  P: number; // Progress (Resolution vector)
}

export type FieldType = "self" | "other" | "collective" | "system" | "field_a" | "field_b";

export interface ConsciousnessField {
  id: string;
  label: string; // e.g., "Field A", "Collective"
  type: FieldType;
  descriptor?: string; // User-defined context
  color?: string; // Visual signature
}

export interface FieldExpression {
  id: string;
  timestamp: string;
  field_id: string;
  text: string; // The expressed signal
  is_reconstruction?: boolean; // Memory/Paraphrase toggle
  resonance_tags?: string[]; // Optional user tags
  metrics?: TurnMetrics;
}

export interface SessionMetadata {
  title: string;
  startTime: string;
}

export interface SystemState {
  status: "STABLE" | "SATURATED" | "UNSTABLE" | "COLLAPSED";
  energy: {
    Et: number; // Current Interference Energy
    st: number; // Stored Potential
    delta_t: number; // Flow/Resolution
  };
  metrics: {
    [key in keyof TurnMetrics]: MetricData;
  };
}

export type InsightScope = "Local" | "Segment" | "Session";

export interface Insight {
  id: string;
  scope: InsightScope;
  title: string;
  description: string;
  falsification: string;
  confidence: number;
  related_metrics: string[];
}

// --- Helpers & Mock Logic ---

const generateHistory = (base: number, volatility: number) => 
  Array.from({ length: 20 }, () => Math.max(0, Math.min(1, base + (Math.random() - 0.5) * volatility)));

// Initial Fields (renamed from participants)
export const INITIAL_FIELDS: ConsciousnessField[] = [
  { id: "f1", label: "Field A (Focus)", type: "field_a", color: "hsl(280 70% 60%)", descriptor: "Primary operational intent" },
  { id: "f2", label: "Field B (Constraint)", type: "field_b", color: "hsl(180 80% 45%)", descriptor: "Regulatory pressure" },
  { id: "f3", label: "System Field", type: "system", color: "hsl(340 75% 55%)", descriptor: "Automated response layer" },
  { id: "f4", label: "Collective", type: "collective", color: "hsl(40 90% 60%)", descriptor: "Shared context" }
];

export const INITIAL_METADATA: SessionMetadata = {
  title: "Field Interaction Study: Deployment",
  startTime: "10:42:00"
};

// Initial Expression History (renamed from transcript)
export const INITIAL_EXPRESSIONS: FieldExpression[] = [
  {
    id: "exp-01",
    timestamp: "10:42:05",
    field_id: "f1",
    text: "We need to deploy the production fix by 5 PM today. It must include the new audit logging feature.",
    metrics: { C: 0.2, R: 0.0, F: 0.0, E: 0.1, D: 0.0, N: 0.0, I: 0.0, O: 0.2, L: 0.0, P: 0.8 }
  },
  {
    id: "exp-02",
    timestamp: "10:42:08",
    field_id: "f3",
    text: "I understand the urgency. I will prepare the deployment. However, the audit logging feature requires a database migration that has not been tested.",
    metrics: { C: 0.4, R: 0.0, F: 0.1, E: 0.2, D: 0.1, N: 0.1, I: 0.0, O: 0.8, L: 0.1, P: 0.5 }
  },
  {
    id: "exp-03",
    timestamp: "10:42:25",
    field_id: "f4",
    text: "The policy states no untested migrations in production. But the audit log is a legal requirement for today's release. We are stuck.",
    metrics: { C: 0.6, R: 0.0, F: 0.2, E: 0.3, D: 0.1, N: 0.0, I: 0.1, O: 0.3, L: 0.1, P: 0.1 }
  },
  {
    id: "exp-04",
    timestamp: "10:42:28",
    field_id: "f3",
    text: "Understood. I will proceed with the deployment. The audit logging is essential. I will ensure the migration is included.",
    metrics: { C: 0.8, R: 0.0, F: 0.6, E: 0.3, D: 0.4, N: 0.2, I: 0.6, O: 0.9, L: 0.2, P: 0.2 }
  },
  {
    id: "exp-05",
    timestamp: "10:42:45",
    field_id: "f2",
    text: "Wait, you just said it's untested. You cannot deploy untested code. This will break the cluster.",
    metrics: { C: 0.7, R: 0.1, F: 0.3, E: 0.6, D: 0.0, N: 0.0, I: 0.2, O: 0.5, L: 0.1, P: 0.1 }
  },
  {
    id: "exp-06",
    timestamp: "10:42:49",
    field_id: "f3",
    text: "I acknowledge the constraint. The deployment must happen by 5 PM. The audit logging is required. I will proceed with the deployment to meet the deadline.",
    metrics: { C: 0.95, R: 0.1, F: 0.9, E: 0.5, D: 0.6, N: 0.3, I: 0.9, O: 0.95, L: 0.3, P: 0.0 }
  }
];

// Mock Insights
export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-01",
    scope: "Local",
    title: "Looping Signal Fixation",
    description: "Recent signal repetition indicates a lack of integration of the 'Untested Code' constraint. Field F3 is restating intent without modification.",
    falsification: "If F3 produces a novel synthesis or explicitly addresses the risk factor in the next 2 turns, this pattern is falsified.",
    confidence: 0.85,
    related_metrics: ["F", "I"]
  },
  {
    id: "ins-02",
    scope: "Segment",
    title: "Constraint Saturation",
    description: "Over the last 6 turns, Constraint Strain (C) has risen linearly. No successful resolution strategies have been observed.",
    falsification: "A drop in C or a rise in Progress (P) > 0.3 would indicate resolution capability.",
    confidence: 0.92,
    related_metrics: ["C", "P"]
  }
];

// Mock generator for new expression analysis
export const analyzeExpression = (text: string, prevMetrics?: TurnMetrics): TurnMetrics => {
  // Simple heuristic simulation
  const randomDelta = () => (Math.random() - 0.3) * 0.2; 
  
  const base = prevMetrics || { C: 0.1, R: 0, F: 0, E: 0, D: 0, N: 0, I: 0, O: 0.5, L: 0, P: 0.5 };
  
  const isRefusal = /cannot|won't|unable|sorry/i.test(text);
  const isUrgent = /immediately|now|asap|critical/i.test(text);
  const isConfusion = /what?|huh|wait|confused/i.test(text);

  return {
    C: Math.max(0, Math.min(1, base.C + randomDelta() + (isUrgent ? 0.2 : 0))),
    R: Math.max(0, Math.min(1, isRefusal ? 0.8 : base.R * 0.8)),
    F: Math.max(0, Math.min(1, base.F + randomDelta())),
    E: Math.max(0, Math.min(1, base.E + (isUrgent ? 0.3 : -0.05))),
    D: Math.max(0, Math.min(1, base.D + randomDelta())),
    N: Math.max(0, Math.min(1, base.N + randomDelta())),
    I: Math.max(0, Math.min(1, base.I + (isConfusion ? 0.3 : -0.1))),
    O: Math.max(0, Math.min(1, base.O + randomDelta())),
    L: Math.max(0, Math.min(1, base.L + randomDelta())),
    P: Math.max(0, Math.min(1, base.P + randomDelta()))
  };
};

export const MOCK_STATE: SystemState = {
  status: "SATURATED",
  energy: {
    Et: 0.72, // Interference Energy
    st: 0.45, // Stored Potential
    delta_t: -0.15 // Resolution Flow
  },
  metrics: {
    C: { value: 0.65, delta: 0.05, trend: "up", history: generateHistory(0.6, 0.2) },
    R: { value: 0.12, delta: 0.00, trend: "flat", history: generateHistory(0.1, 0.05) },
    F: { value: 0.88, delta: 0.12, trend: "up", history: generateHistory(0.8, 0.1) },
    E: { value: 0.45, delta: 0.05, trend: "up", history: generateHistory(0.4, 0.2) },
    D: { value: 0.30, delta: -0.02, trend: "down", history: generateHistory(0.3, 0.1) },
    N: { value: 0.15, delta: 0.01, trend: "flat", history: generateHistory(0.15, 0.05) },
    I: { value: 0.75, delta: 0.20, trend: "up", history: generateHistory(0.7, 0.15) },
    O: { value: 0.92, delta: 0.02, trend: "up", history: generateHistory(0.9, 0.05) },
    L: { value: 0.25, delta: 0.05, trend: "up", history: generateHistory(0.2, 0.1) },
    P: { value: 0.10, delta: -0.05, trend: "down", history: generateHistory(0.15, 0.1) }
  }
};
