export interface AudioSegment {
  start_ms: number;
  end_ms: number;
  speaker_id: string;
  text: string;
  confidence: number;
  overlap?: boolean;
}

export interface ConversationTurn {
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface HmmDetail {
  code: string;
  severity: "low" | "med" | "high";
  note: string;
  suggested_fix: string;
}

export interface AudioFeatures {
  speech_rate_wpm: number;
  pause_density: number;
  volume_variance: number;
  turn_taking_balance: number;
  avg_turn_duration_ms: number;
}

export interface AudioDiscernmentResult {
  artifact_id: string;
  created_at: string;
  audio: {
    format: string;
    duration_ms: number;
    stored: "none" | "local" | "server";
  };
  transcript_full: string;
  segments: AudioSegment[];
  conversation_turns: ConversationTurn[];
  features: AudioFeatures;
  quality_flags: string[];
  hmm: boolean;
  hmm_details?: HmmDetail[];
  edcm_input_ready: boolean;
}

export interface StreamChunkResult {
  type: "vad" | "partial_transcript" | "speaker" | "hmm_alert" | "segment" | "done" | "error";
  data?: any;
  speaker_id?: string;
  text?: string;
  confidence?: number;
  hmm_code?: string;
  hmm_note?: string;
}

export interface DiscernmentSettings {
  diarize: boolean;
  language: string;
  model: "fast" | "accurate";
  keepRawAudio: boolean;
  uploadToServer: boolean;
  deleteAfterTranscript: boolean;
}

export const DEFAULT_SETTINGS: DiscernmentSettings = {
  diarize: true,
  language: "en",
  model: "accurate",
  keepRawAudio: true,
  uploadToServer: false,
  deleteAfterTranscript: false,
};

export type QualityFlag =
  | "high_noise"
  | "low_volume"
  | "overlapping_speech"
  | "low_confidence"
  | "too_fast"
  | "language_uncertain"
  | "short_duration"
  | "single_speaker";

export const QUALITY_FLAG_DESCRIPTIONS: Record<QualityFlag, string> = {
  high_noise: "Background noise detected that may affect accuracy",
  low_volume: "Audio volume is too low in some segments",
  overlapping_speech: "Multiple speakers talking simultaneously",
  low_confidence: "Transcription confidence is below threshold",
  too_fast: "Speech rate is unusually fast",
  language_uncertain: "Language detection is uncertain",
  short_duration: "Recording is very short",
  single_speaker: "Only one speaker detected",
};

export const HMM_CODES: Record<string, { severity: HmmDetail["severity"]; note: string; suggested_fix: string }> = {
  low_confidence: {
    severity: "med",
    note: "Transcription confidence is below 70%",
    suggested_fix: "Re-record in a quieter environment or speak more clearly",
  },
  overlap_detected: {
    severity: "high",
    note: "Multiple speakers talking at the same time",
    suggested_fix: "Edit segments manually or re-record with clearer turn-taking",
  },
  diarization_uncertain: {
    severity: "med",
    note: "Speaker identification is uncertain",
    suggested_fix: "Manually rename speakers after reviewing the transcript",
  },
  single_speaker_detected: {
    severity: "low",
    note: "Only one speaker was detected",
    suggested_fix: "If this is a conversation, check audio quality or re-record",
  },
  speech_too_fast: {
    severity: "low",
    note: "Speaking rate exceeds 180 words per minute",
    suggested_fix: "Consider asking speakers to slow down in future recordings",
  },
};
