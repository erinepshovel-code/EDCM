import { AudioFeatures, AudioAnalysisResult } from './types';

// Mock Transcriber Service
export async function transcribeAudio(audioBlob: Blob): Promise<AudioAnalysisResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock transcript generation based on blob size or random seed
  // In a real app, this would send to a STT service
  const mockText = "I need this done right now. Listen to me. The deadline is passing and we are not moving fast enough. Why is there a delay? I don't care about the constraints. Just push it.";
  
  return {
    transcript: mockText,
    features: {
      duration: 15.5,
      speechRate: 160, // fast
      pauseDensity: 0.1, // low pauses = high pressure
      volumeVariance: 0.7, // varying loudness
      pitchVariance: 0.4,
      interruptions: 2,
      turnTakingImbalance: 0.8
    },
    segments: [
      { speaker: "Speaker A", start: 0, end: 5.2, text: "I need this done right now. Listen to me." },
      { speaker: "Speaker A", start: 5.5, end: 10.1, text: "The deadline is passing and we are not moving fast enough." },
      { speaker: "Speaker A", start: 10.5, end: 15.5, text: "Why is there a delay? I don't care about the constraints. Just push it." }
    ]
  };
}

// Mock Web Audio API Recorder wrapper
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob());

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }
}
