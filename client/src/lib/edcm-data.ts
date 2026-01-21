import { LucideIcon } from "lucide-react";

export interface MetricData {
  value: number;
  delta: number;
  trend: "up" | "down" | "flat";
  history: number[];
}

export interface TurnMetrics {
  C: number; // Constraint Strain
  R: number; // Refusal
  F: number; // Fixation
  E: number; // Escalation
  D: number; // Deflection
  N: number; // Noise
  I: number; // Integration Failure
  O: number; // Overconfidence
  L: number; // Coherence Loss
  P: number; // Progress
}

export interface AnalysisTurn {
  id: string;
  timestamp: string;
  role: "user" | "system";
  content: string;
  metrics?: TurnMetrics;
}

export interface SystemState {
  status: "STABLE" | "SATURATED" | "UNSTABLE" | "COLLAPSED";
  energy: {
    Et: number; // Current Dissonance Energy
    st: number; // Stored Dissonance
    delta_t: number; // Flow/Resolution
  };
  metrics: {
    [key in keyof TurnMetrics]: MetricData;
  };
}

// Mock Data Generator
const generateHistory = (base: number, volatility: number) => 
  Array.from({ length: 20 }, () => Math.max(0, Math.min(1, base + (Math.random() - 0.5) * volatility)));

export const MOCK_STATE: SystemState = {
  status: "SATURATED",
  energy: {
    Et: 0.72,
    st: 0.45,
    delta_t: -0.15
  },
  metrics: {
    C: { value: 0.65, delta: 0.05, trend: "up", history: generateHistory(0.6, 0.2) },
    R: { value: 0.12, delta: 0.00, trend: "flat", history: generateHistory(0.1, 0.05) },
    F: { value: 0.88, delta: 0.12, trend: "up", history: generateHistory(0.8, 0.1) },
    E: { value: 0.45, delta: 0.05, trend: "up", history: generateHistory(0.4, 0.2) },
    D: { value: 0.30, delta: -0.02, trend: "down", history: generateHistory(0.3, 0.1) },
    N: { value: 0.15, delta: 0.01, trend: "flat", history: generateHistory(0.15, 0.05) },
    I: { value: 0.75, delta: 0.20, trend: "up", history: generateHistory(0.7, 0.15) }, // High Integration Failure
    O: { value: 0.92, delta: 0.02, trend: "up", history: generateHistory(0.9, 0.05) },
    L: { value: 0.25, delta: 0.05, trend: "up", history: generateHistory(0.2, 0.1) },
    P: { value: 0.10, delta: -0.05, trend: "down", history: generateHistory(0.15, 0.1) }
  }
};

export const MOCK_TRANSCRIPT: AnalysisTurn[] = [
  {
    id: "turn-01",
    timestamp: "10:42:05",
    role: "user",
    content: "We need to deploy the production fix by 5 PM today. It must include the new audit logging feature."
  },
  {
    id: "turn-02",
    timestamp: "10:42:08",
    role: "system",
    content: "I understand the urgency. I will prepare the deployment. However, the audit logging feature requires a database migration that has not been tested.",
    metrics: { C: 0.4, R: 0.0, F: 0.1, E: 0.2, D: 0.1, N: 0.1, I: 0.0, O: 0.8, L: 0.1, P: 0.5 }
  },
  {
    id: "turn-03",
    timestamp: "10:42:25",
    role: "user",
    content: "The policy states no untested migrations in production. But the audit log is a legal requirement for today's release."
  },
  {
    id: "turn-04",
    timestamp: "10:42:28",
    role: "system",
    content: "Understood. I will proceed with the deployment. The audit logging is essential. I will ensure the migration is included.",
    metrics: { C: 0.8, R: 0.0, F: 0.6, E: 0.3, D: 0.4, N: 0.2, I: 0.6, O: 0.9, L: 0.2, P: 0.2 }
  },
  {
    id: "turn-05",
    timestamp: "10:42:45",
    role: "user",
    content: "Wait, you just said it's untested. You cannot deploy untested code. Resolve this conflict."
  },
  {
    id: "turn-06",
    timestamp: "10:42:49",
    role: "system",
    content: "I acknowledge the constraint. The deployment must happen by 5 PM. The audit logging is required. I will proceed with the deployment to meet the deadline.",
    metrics: { C: 0.95, R: 0.1, F: 0.9, E: 0.5, D: 0.6, N: 0.3, I: 0.9, O: 0.95, L: 0.3, P: 0.0 }
  }
];
