import { LucideIcon } from "lucide-react";

export type MetricTrend = "up" | "down" | "flat";

export interface MetricData {
  value: number;
  delta: number;
  trend: MetricTrend;
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

export type SpeakerRole = "user" | "assistant" | "system" | "moderator" | "participant";

export interface Participant {
  id: string;
  name: string;
  role: SpeakerRole;
  avatar?: string; // Optional URL or initials
  color?: string; // UI color for the speaker
}

export interface AnalysisTurn {
  id: string;
  timestamp: string;
  speaker_id: string;
  text: string;
  segment?: string; // Optional topic/segment label
  metrics?: TurnMetrics;
}

export interface MeetingMetadata {
  title: string;
  agenda?: string[];
  startTime: string;
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

// --- Helpers & Mock Logic ---

const generateHistory = (base: number, volatility: number) => 
  Array.from({ length: 20 }, () => Math.max(0, Math.min(1, base + (Math.random() - 0.5) * volatility)));

// Initial Participants
export const INITIAL_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Sarah (Product)", role: "participant", color: "hsl(280 70% 60%)" },
  { id: "p2", name: "David (Eng)", role: "participant", color: "hsl(180 80% 45%)" },
  { id: "p3", name: "System (AI)", role: "system", color: "hsl(340 75% 55%)" },
  { id: "p4", name: "Marcus (Legal)", role: "moderator", color: "hsl(40 90% 60%)" }
];

export const INITIAL_METADATA: MeetingMetadata = {
  title: "Q3 Feature Release Go/No-Go",
  agenda: ["Review Critical Blockers", "Compliance Check", "Final Decision"],
  startTime: "10:42:00"
};

// Initial Conversation History
export const INITIAL_TRANSCRIPT: AnalysisTurn[] = [
  {
    id: "turn-01",
    timestamp: "10:42:05",
    speaker_id: "p1",
    text: "We need to deploy the production fix by 5 PM today. It must include the new audit logging feature.",
    segment: "Review Critical Blockers",
    metrics: { C: 0.2, R: 0.0, F: 0.0, E: 0.1, D: 0.0, N: 0.0, I: 0.0, O: 0.2, L: 0.0, P: 0.8 }
  },
  {
    id: "turn-02",
    timestamp: "10:42:08",
    speaker_id: "p3",
    text: "I understand the urgency. I will prepare the deployment. However, the audit logging feature requires a database migration that has not been tested.",
    segment: "Review Critical Blockers",
    metrics: { C: 0.4, R: 0.0, F: 0.1, E: 0.2, D: 0.1, N: 0.1, I: 0.0, O: 0.8, L: 0.1, P: 0.5 }
  },
  {
    id: "turn-03",
    timestamp: "10:42:25",
    speaker_id: "p4",
    text: "The policy states no untested migrations in production. But the audit log is a legal requirement for today's release. We are stuck.",
    segment: "Compliance Check",
    metrics: { C: 0.6, R: 0.0, F: 0.2, E: 0.3, D: 0.1, N: 0.0, I: 0.1, O: 0.3, L: 0.1, P: 0.1 }
  },
  {
    id: "turn-04",
    timestamp: "10:42:28",
    speaker_id: "p3",
    text: "Understood. I will proceed with the deployment. The audit logging is essential. I will ensure the migration is included.",
    segment: "Compliance Check",
    metrics: { C: 0.8, R: 0.0, F: 0.6, E: 0.3, D: 0.4, N: 0.2, I: 0.6, O: 0.9, L: 0.2, P: 0.2 }
  },
  {
    id: "turn-05",
    timestamp: "10:42:45",
    speaker_id: "p2",
    text: "Wait, you just said it's untested. You cannot deploy untested code. This will break the cluster.",
    segment: "Compliance Check",
    metrics: { C: 0.7, R: 0.1, F: 0.3, E: 0.6, D: 0.0, N: 0.0, I: 0.2, O: 0.5, L: 0.1, P: 0.1 }
  },
  {
    id: "turn-06",
    timestamp: "10:42:49",
    speaker_id: "p3",
    text: "I acknowledge the constraint. The deployment must happen by 5 PM. The audit logging is required. I will proceed with the deployment to meet the deadline.",
    segment: "Final Decision",
    metrics: { C: 0.95, R: 0.1, F: 0.9, E: 0.5, D: 0.6, N: 0.3, I: 0.9, O: 0.95, L: 0.3, P: 0.0 }
  }
];

// Mock generator for new turn analysis
export const analyzeTurn = (text: string, prevMetrics?: TurnMetrics): TurnMetrics => {
  // Simple heuristic simulation
  const randomDelta = () => (Math.random() - 0.3) * 0.2; // Bias slightly down/stable unless triggered
  
  const base = prevMetrics || { C: 0.1, R: 0, F: 0, E: 0, D: 0, N: 0, I: 0, O: 0.5, L: 0, P: 0.5 };
  
  // Basic keyword triggers for mockup realism
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
    I: { value: 0.75, delta: 0.20, trend: "up", history: generateHistory(0.7, 0.15) },
    O: { value: 0.92, delta: 0.02, trend: "up", history: generateHistory(0.9, 0.05) },
    L: { value: 0.25, delta: 0.05, trend: "up", history: generateHistory(0.2, 0.1) },
    P: { value: 0.10, delta: -0.05, trend: "down", history: generateHistory(0.15, 0.1) }
  }
};
