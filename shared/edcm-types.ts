export type Mode = "dating" | "political" | "consciousness" | "general";

export type ConversationTurn = {
  speaker: "A" | "B" | "C" | "unknown";
  text: string;
  ts?: string;
};

export type QualityFlag =
  | "LOW_CONFIDENCE_PARSE"
  | "INSUFFICIENT_CONTEXT"
  | "POSSIBLE_INTENT_INFERENCE_RISK"
  | "MODEL_DRIFT_RISK"
  | "NON_EDCM_REQUEST"
  | "MISSING_SPEAKER_TAGS"
  | "OVER_SHORT_SAMPLE";

export type HmmItem = {
  id: string;
  issue: string;
  evidence: string[];
  suggested_fix: string[];
  severity: "low" | "medium" | "high";
  tags: string[];
};

export type EDCMMetrics = {
  constraint_strain_C: number;
  refusal_density_R: number;
  deflection_D: number;
  noise_N: number;

  fixation_F?: number;
  escalation_E?: number;
  integration_failure_I?: number;

  progress_vector?: {
    decisions: number;
    commitments: number;
    artifacts: number;
    followthrough_score: number;
  };
};

export type EDCMResult = {
  mode: Mode;
  conversation_turns: ConversationTurn[];
  metrics: EDCMMetrics;
  quality_flags: QualityFlag[];
  hmmm_items: HmmItem[];
  edcm_summary: string;
  fix_actions: string[];
  edcm_result: null | {
    version: "edcm-app-v0";
    metrics: EDCMMetrics;
  };
};

export type EDCMRequestBody = {
  mode?: Mode;
  text?: string;
  turns?: ConversationTurn[];
  enable_analysis?: boolean;
};

export type SyncMode = "off" | "metrics_only" | "include_text";

export type AnalyticsEvent = {
  id: string;
  created_at: string;
  session_id: string;
  mode: Mode;

  turn_count: number;
  char_count: number;

  metrics: EDCMMetrics;
  quality_flags: QualityFlag[];
  hmmm_count: number;
  hmmm_tags: string[];

  app_version: string;
  spec_version: "edcm-app-v0";
  analysis_model?: string;

  raw_text?: string;
};

export type AnalyticsIn = {
  sync_mode: SyncMode;
  allow_text_upload: boolean;
  event: AnalyticsEvent;
};
