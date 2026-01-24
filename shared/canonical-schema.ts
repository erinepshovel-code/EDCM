export type SourceTier = "clipboard" | "message_sync" | "live_audio" | "political_ingest" | "paste";

export type DataDomain = "relationship" | "political" | "mixed";

export type ConsentLevel = "implicit" | "explicit" | "none";

export type TierLevel = "free" | "paid_basic" | "paid_pro";

export interface CanonicalMessage {
  speaker: "A" | "B" | "C" | "unknown";
  timestamp: string;
  content: string;
  source_tier: SourceTier;
  confidence: number;
}

export interface CanonicalMetadata {
  tier: TierLevel;
  privacy_mode: boolean;
  consent_level: ConsentLevel;
  data_domain: DataDomain;
}

export interface CanonicalConversation {
  conversation_id: string;
  timestamp_range: [string, string];
  participants: string[];
  messages: CanonicalMessage[];
  metadata: CanonicalMetadata;
}

export interface CanonicalAnalysisResult {
  conversation: CanonicalConversation;
  metrics: {
    constraint_strain_C: number;
    refusal_density_R: number;
    deflection_D: number;
    noise_N: number;
    escalation_E?: number;
    fixation_F?: number;
    integration_failure_I?: number;
  };
  quality_flags: string[];
  hmmm_items: Array<{
    id: string;
    issue: string;
    evidence: string[];
    suggested_fix: string[];
    severity: "low" | "medium" | "high";
    tags: string[];
  }>;
  summary: string;
  fix_actions: string[];
}

export function toCanonicalConversation(params: {
  id?: string;
  messages: Array<{ speaker: string; text: string; timestamp?: string }>;
  source: SourceTier;
  domain: DataDomain;
  tier?: TierLevel;
  consent?: ConsentLevel;
}): CanonicalConversation {
  const now = new Date().toISOString();
  const participants = Array.from(new Set(params.messages.map(m => m.speaker)));
  
  const canonicalMessages: CanonicalMessage[] = params.messages.map((m, idx) => ({
    speaker: (m.speaker as "A" | "B" | "C" | "unknown") || "unknown",
    timestamp: m.timestamp || now,
    content: m.text,
    source_tier: params.source,
    confidence: m.speaker === "unknown" ? 0.5 : 0.9,
  }));

  const timestamps = canonicalMessages.map(m => m.timestamp).sort();
  
  return {
    conversation_id: params.id || crypto.randomUUID(),
    timestamp_range: [timestamps[0] || now, timestamps[timestamps.length - 1] || now],
    participants,
    messages: canonicalMessages,
    metadata: {
      tier: params.tier || "free",
      privacy_mode: true,
      consent_level: params.consent || "explicit",
      data_domain: params.domain,
    },
  };
}
