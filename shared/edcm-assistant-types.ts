import type { ConversationTurn, HmmDetail, AudioFeatures } from "./audio-types";
import type { EDCMResult } from "../client/src/edcm/types";

export type AssistantMode = "ingest" | "analyze" | "interpret" | "compare" | "report";

export interface HmmmItem {
  id: string;
  category: "assumption" | "uncertainty" | "quality_flag" | "next_action";
  severity: "low" | "med" | "high";
  message: string;
  source: string;
  suggested_fix?: string;
  fix_action?: HmmmFixAction;
  resolved: boolean;
}

export interface HmmmFixAction {
  type: "edit_turn" | "merge_turns" | "split_turn" | "rename_speaker" | "delete_turn" | "manual_review";
  target_id?: string;
  description: string;
}

export interface AnalysisArtifact {
  id: string;
  name: string;
  created_at: string;
  source: "paste" | "upload" | "audio" | "import";
  conversation_turns: ConversationTurn[];
  raw_text?: string;
  features?: AudioFeatures;
  quality_flags: string[];
  hmm_items: HmmmItem[];
  edcm_result?: EDCMResult | null;
  analysis_complete: boolean;
}

export interface AssistantRequest {
  mode: AssistantMode;
  artifact_id?: string;
  compare_artifact_id?: string;
  input_text?: string;
  conversation_id: number;
}

export interface AssistantOutput {
  mode: AssistantMode;
  conversation_turns?: ConversationTurn[];
  quality_flags?: string[];
  hmm_items: HmmmItem[];
  edcm_result?: EDCMResult | null;
  interpretation?: string;
  comparison?: {
    summary: string;
    deltas: Array<{ metric: string; change: string; significance: string }>;
  };
  report?: {
    title: string;
    summary: string;
    key_findings: string[];
    risk_points: Array<{ description: string; severity: string }>;
    recommendations: string[];
  };
  explanation: string;
  data_sources: string[];
  inferences: string[];
}

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  mode?: AssistantMode;
  structured_output?: AssistantOutput;
  timestamp: string;
}

export const ASSISTANT_MODE_DESCRIPTIONS: Record<AssistantMode, { label: string; description: string }> = {
  ingest: {
    label: "Ingest",
    description: "Paste text, upload transcript, or load artifact; convert to conversation turns",
  },
  analyze: {
    label: "Analyze",
    description: "Run EDCM pipeline on selected artifact",
  },
  interpret: {
    label: "Interpret",
    description: "Summarize results, highlight observable patterns, propose next steps",
  },
  compare: {
    label: "Compare",
    description: "Compare two artifacts and explain structural differences",
  },
  report: {
    label: "Report",
    description: "Generate exportable analysis brief",
  },
};
