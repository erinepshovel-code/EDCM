export interface AudioFeatures {
  duration: number;
  speechRate: number; // words per minute
  pauseDensity: number; // ratio of silence to speech
  volumeVariance: number; // normalized 0-1
  pitchVariance: number; // normalized 0-1
  interruptions: number; // count
  turnTakingImbalance: number; // 0-1 (1 = one speaker dominates)
}

export interface AudioAnalysisResult {
  transcript: string;
  features: AudioFeatures;
  segments: Array<{
    speaker: string;
    start: number;
    end: number;
    text: string;
  }>;
}

export interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
}
