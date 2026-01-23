import type { 
  AudioDiscernmentResult, 
  ConversationTurn, 
  AudioFeatures 
} from "@shared/audio-types";
import { analyzeText } from "./engine";
import type { EDCMResult } from "./types";

export interface EDCMInputFromAudio {
  text: string;
  turns: ConversationTurn[];
  features: AudioFeatures;
  speakerCount: number;
}

export function convertAudioResultToEDCMInput(
  result: AudioDiscernmentResult
): EDCMInputFromAudio | null {
  if (!result.edcm_input_ready) {
    return null;
  }

  const speakers = new Set(result.conversation_turns.map(t => t.speaker));

  return {
    text: result.transcript_full,
    turns: result.conversation_turns,
    features: result.features,
    speakerCount: speakers.size,
  };
}

export function analyzeAudioForEDCM(
  result: AudioDiscernmentResult,
  mode: "dating" | "politics" | "lab" = "dating"
): EDCMResult | null {
  const input = convertAudioResultToEDCMInput(result);
  if (!input) {
    return null;
  }

  const edcmResult = analyzeText(input.text, {
    mode,
    audioFeatures: {
      speechRate: input.features.speech_rate_wpm,
      pauseDensity: input.features.pause_density,
      volumeVariance: input.features.volume_variance,
      pitchVariance: 0.5,
    },
  });

  return edcmResult;
}

export function generateAudioBasedProjections(
  result: AudioDiscernmentResult,
  mode: "dating" | "politics" | "lab"
): string[] {
  const projections: string[] = [];
  const { features, hmm, hmm_details } = result;

  if (features.speech_rate_wpm > 160) {
    projections.push("Rapid speech rate detected - may indicate urgency or pressure");
  }

  if (features.turn_taking_balance < 0.3 || features.turn_taking_balance > 0.7) {
    projections.push("Conversation balance is skewed - one speaker dominates");
  }

  if (features.pause_density < 0.1) {
    projections.push("Low pause density - limited space for reflection");
  }

  if (hmm && hmm_details) {
    for (const detail of hmm_details) {
      if (detail.severity === "high") {
        projections.push(`Attention: ${detail.note}`);
      }
    }
  }

  if (mode === "dating") {
    if (features.turn_taking_balance < 0.35) {
      projections.push("Pattern: One person speaking significantly more than the other");
    }
  }

  if (mode === "politics") {
    if (features.speech_rate_wpm > 170) {
      projections.push("Rapid delivery may reduce listener processing time");
    }
  }

  return projections;
}
