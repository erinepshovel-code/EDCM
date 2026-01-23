import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Play, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioSegment {
  start_ms: number;
  end_ms: number;
  speaker_id: string;
  text: string;
  confidence: number;
}

interface AudioFeatures {
  speech_rate_wpm: number;
  pause_density: number;
  volume_variance: number;
  turn_taking_balance: number;
  avg_turn_duration_ms: number;
}

interface DiscernmentResult {
  transcript_full: string;
  segments: AudioSegment[];
  features: AudioFeatures;
  quality_flags: string[];
  duration_ms: number;
  processed_at: string;
}

function mapPaceState(wpm: number): { label: string; color: string } {
  if (wpm < 120) return { label: "Slow", color: "text-blue-500" };
  if (wpm < 150) return { label: "Steady", color: "text-emerald-500" };
  if (wpm < 180) return { label: "Rising", color: "text-amber-500" };
  return { label: "Rapid", color: "text-red-500" };
}

function mapBalanceState(balance: number): { label: string; color: string } {
  if (balance >= 0.4 && balance <= 0.6) return { label: "Balanced", color: "text-emerald-500" };
  if (balance >= 0.3 && balance <= 0.7) return { label: "Slightly Skewed", color: "text-amber-500" };
  return { label: "One-Sided", color: "text-red-500" };
}

function mapPauseDensity(density: number): { label: string; color: string } {
  if (density > 0.3) return { label: "Reflective", color: "text-emerald-500" };
  if (density > 0.15) return { label: "Moderate", color: "text-blue-500" };
  return { label: "Pressured", color: "text-amber-500" };
}

export function LiveAudioDiscernment() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const analyzeMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append("audio", blob);

      const res = await fetch("/api/audio/discern", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Audio analysis failed");
      return res.json() as Promise<DiscernmentResult>;
    },
  });

  const result = analyzeMutation.data;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Live Audio Discernment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {!recording ? (
            <Button onClick={startRecording} variant="outline" size="sm" data-testid="btn-start-recording">
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" size="sm" data-testid="btn-stop-recording">
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
          
          {recording && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording...
            </div>
          )}
        </div>

        {audioUrl && (
          <div className="space-y-3">
            <audio controls src={audioUrl} className="w-full h-10" data-testid="audio-playback" />
            <Button 
              onClick={() => audioBlob && analyzeMutation.mutate(audioBlob)}
              disabled={analyzeMutation.isPending}
              size="sm"
              data-testid="btn-analyze-audio"
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Analyze Conversation
            </Button>
          </div>
        )}

        {analyzeMutation.isError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Analysis failed. Please try again.
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Pace</div>
                <div className={cn("font-medium", mapPaceState(result.features.speech_rate_wpm).color)}>
                  {mapPaceState(result.features.speech_rate_wpm).label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {result.features.speech_rate_wpm} wpm
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                <div className={cn("font-medium", mapBalanceState(result.features.turn_taking_balance).color)}>
                  {mapBalanceState(result.features.turn_taking_balance).label}
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Pausing</div>
                <div className={cn("font-medium", mapPauseDensity(result.features.pause_density).color)}>
                  {mapPauseDensity(result.features.pause_density).label}
                </div>
              </div>
            </div>

            {result.quality_flags.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="text-xs font-medium text-amber-500 mb-1">Pattern Notes</div>
                <div className="text-sm text-muted-foreground">
                  {result.quality_flags.map(flag => flag.replace(/_/g, " ")).join(", ")}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Transcript Segments</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.segments.map((seg, i) => (
                  <div key={i} className="p-2 bg-muted/20 rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">{seg.speaker_id}</span>
                      <span className="text-xs text-muted-foreground">
                        {(seg.start_ms / 1000).toFixed(1)}s - {(seg.end_ms / 1000).toFixed(1)}s
                      </span>
                      {seg.confidence > 0.8 && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                    </div>
                    <p className="text-muted-foreground">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
