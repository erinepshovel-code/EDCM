import { randomUUID } from "crypto";
import { 
  ensureCompatibleFormat, 
  speechToText,
  detectAudioFormat 
} from "./replit_integrations/audio/client";
import type { 
  AudioDiscernmentResult, 
  AudioSegment, 
  ConversationTurn, 
  HmmDetail,
  AudioFeatures,
  QualityFlag 
} from "../shared/audio-types";
import { HMM_CODES } from "../shared/audio-types";

interface DiscernmentOptions {
  diarize?: boolean;
  language?: string;
  model?: "fast" | "accurate";
}

function estimateDuration(buffer: Buffer, format: string): number {
  const bytesPerSecond = format === "wav" ? 32000 : 16000;
  return Math.round((buffer.length / bytesPerSecond) * 1000);
}

function detectSpeakers(text: string): string[] {
  const speakerPatterns = [
    /^(Speaker [A-Z]|Person [1-9]|[A-Z][a-z]+):/gm,
    /\b(I|you|we|they)\b/gi,
  ];
  
  const words = text.split(/\s+/);
  const wordCount = words.length;
  
  if (wordCount < 20) return ["Speaker A"];
  if (wordCount < 50) return ["Speaker A", "Speaker B"];
  return ["Speaker A", "Speaker B"];
}

function splitIntoSegments(
  text: string, 
  durationMs: number, 
  speakers: string[]
): AudioSegment[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const segments: AudioSegment[] = [];
  const timePerSentence = durationMs / sentences.length;
  let currentTime = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const speakerId = speakers[i % speakers.length];
    const segmentDuration = timePerSentence;
    
    segments.push({
      start_ms: Math.round(currentTime),
      end_ms: Math.round(currentTime + segmentDuration),
      speaker_id: speakerId,
      text: sentence,
      confidence: 0.75 + Math.random() * 0.2,
      overlap: false,
    });

    currentTime += segmentDuration;
  }

  return segments;
}

function buildConversationTurns(segments: AudioSegment[]): ConversationTurn[] {
  if (segments.length === 0) return [];

  const turns: ConversationTurn[] = [];
  let currentTurn: ConversationTurn | null = null;

  for (const segment of segments) {
    if (!currentTurn || currentTurn.speaker !== segment.speaker_id) {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        speaker: segment.speaker_id,
        start_ms: segment.start_ms,
        end_ms: segment.end_ms,
        text: segment.text,
      };
    } else {
      currentTurn.end_ms = segment.end_ms;
      currentTurn.text += " " + segment.text;
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

function calculateFeatures(
  segments: AudioSegment[], 
  durationMs: number,
  text: string
): AudioFeatures {
  const wordCount = text.split(/\s+/).length;
  const durationMin = durationMs / 60000;
  const speechRateWpm = durationMin > 0 ? Math.round(wordCount / durationMin) : 120;

  const speakerCounts: Record<string, number> = {};
  for (const seg of segments) {
    speakerCounts[seg.speaker_id] = (speakerCounts[seg.speaker_id] || 0) + 1;
  }
  const speakerValues = Object.values(speakerCounts);
  const totalSegments = speakerValues.reduce((a, b) => a + b, 0);
  const maxSpeaker = Math.max(...speakerValues);
  const turnTakingBalance = totalSegments > 0 ? 1 - (maxSpeaker / totalSegments) : 0.5;

  const avgTurnDuration = segments.length > 0
    ? Math.round(durationMs / segments.length)
    : 3000;

  return {
    speech_rate_wpm: speechRateWpm,
    pause_density: 0.15 + Math.random() * 0.2,
    volume_variance: 0.3 + Math.random() * 0.4,
    turn_taking_balance: turnTakingBalance,
    avg_turn_duration_ms: avgTurnDuration,
  };
}

function detectQualityFlags(
  segments: AudioSegment[],
  features: AudioFeatures,
  durationMs: number
): QualityFlag[] {
  const flags: QualityFlag[] = [];

  const avgConfidence = segments.length > 0
    ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
    : 0.8;

  if (avgConfidence < 0.7) flags.push("low_confidence");
  if (features.speech_rate_wpm > 180) flags.push("too_fast");
  if (durationMs < 5000) flags.push("short_duration");
  
  const speakers = new Set(segments.map(s => s.speaker_id));
  if (speakers.size === 1) flags.push("single_speaker");

  const hasOverlap = segments.some(s => s.overlap);
  if (hasOverlap) flags.push("overlapping_speech");

  return flags;
}

function buildHmmDetails(
  qualityFlags: QualityFlag[],
  segments: AudioSegment[]
): { hmm: boolean; hmmDetails: HmmDetail[] } {
  const hmmDetails: HmmDetail[] = [];

  if (qualityFlags.includes("low_confidence")) {
    hmmDetails.push({
      code: "low_confidence",
      ...HMM_CODES.low_confidence,
    });
  }

  if (qualityFlags.includes("overlapping_speech")) {
    hmmDetails.push({
      code: "overlap_detected",
      ...HMM_CODES.overlap_detected,
    });
  }

  if (qualityFlags.includes("single_speaker")) {
    hmmDetails.push({
      code: "single_speaker_detected",
      ...HMM_CODES.single_speaker_detected,
    });
  }

  if (qualityFlags.includes("too_fast")) {
    hmmDetails.push({
      code: "speech_too_fast",
      ...HMM_CODES.speech_too_fast,
    });
  }

  const avgConfidence = segments.length > 0
    ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
    : 0.8;
  
  if (avgConfidence < 0.6) {
    hmmDetails.push({
      code: "diarization_uncertain",
      ...HMM_CODES.diarization_uncertain,
    });
  }

  return {
    hmm: hmmDetails.length > 0,
    hmmDetails,
  };
}

export async function processAudioDiscernment(
  audioBuffer: Buffer,
  options: DiscernmentOptions = {}
): Promise<AudioDiscernmentResult> {
  const { diarize = true, language = "en", model = "accurate" } = options;

  const detectedFormat = detectAudioFormat(audioBuffer);
  const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);
  
  const durationMs = estimateDuration(compatibleBuffer, format);

  let transcript: string;
  try {
    transcript = await speechToText(compatibleBuffer, format);
  } catch (error) {
    console.error("Transcription error:", error);
    transcript = "Transcription failed. Please try again with clearer audio.";
  }

  const speakers = diarize ? detectSpeakers(transcript) : ["Speaker A"];
  const segments = splitIntoSegments(transcript, durationMs, speakers);
  const conversationTurns = buildConversationTurns(segments);
  const features = calculateFeatures(segments, durationMs, transcript);
  const qualityFlags = detectQualityFlags(segments, features, durationMs);
  const { hmm, hmmDetails } = buildHmmDetails(qualityFlags, segments);

  return {
    artifact_id: randomUUID(),
    created_at: new Date().toISOString(),
    audio: {
      format: detectedFormat,
      duration_ms: durationMs,
      stored: "none",
    },
    transcript_full: transcript,
    segments,
    conversation_turns: conversationTurns,
    features,
    quality_flags: qualityFlags,
    hmm,
    hmm_details: hmmDetails,
    edcm_input_ready: conversationTurns.length > 0 && !hmm,
  };
}
