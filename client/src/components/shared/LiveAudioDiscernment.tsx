import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Square, Play, Loader2, AlertTriangle, CheckCircle, 
  Edit3, Save, X, Radio, AlertCircle, Info, Volume2, Zap,
  Merge, Split, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveArtifact } from "@/lib/audio-storage";
import type { 
  AudioDiscernmentResult, 
  AudioSegment, 
  HmmDetail,
  QualityFlag 
} from "@shared/audio-types";
import { QUALITY_FLAG_DESCRIPTIONS } from "@shared/audio-types";

const CONSENT_STORAGE_KEY = "edcm-audio-consent-v1";

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

interface ConsentBannerProps {
  onConsent: () => void;
}

function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-medium text-amber-600">Audio Recording Consent</h4>
          <p className="text-sm text-muted-foreground">
            This feature will access your microphone to record and analyze conversation audio. 
            Audio is processed locally by default. We never perform emotion detection or 
            intent inference - only structural analysis (pacing, pauses, turn-taking).
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox 
              id="consent-ack" 
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              data-testid="checkbox-consent"
            />
            <Label htmlFor="consent-ack" className="text-sm cursor-pointer">
              I understand that my microphone will be accessed for recording
            </Label>
          </div>
        </div>
      </div>
      <Button 
        onClick={onConsent} 
        disabled={!acknowledged}
        size="sm"
        className="ml-8"
        data-testid="btn-consent"
      >
        Continue to Recording
      </Button>
    </div>
  );
}

interface HmmAlertPanelProps {
  hmm: boolean;
  hmmDetails?: HmmDetail[];
}

function HmmAlertPanel({ hmm, hmmDetails }: HmmAlertPanelProps) {
  if (!hmm || !hmmDetails?.length) return null;

  const severityColors = {
    low: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    med: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    high: "bg-red-500/10 border-red-500/30 text-red-600",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span>Attention Needed</span>
        <Badge variant="outline" className="ml-auto">hmm</Badge>
      </div>
      <div className="space-y-2">
        {hmmDetails.map((detail, i) => (
          <div 
            key={i} 
            className={cn("p-3 rounded-lg border", severityColors[detail.severity])}
            data-testid={`hmm-alert-${detail.code}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">{detail.note}</div>
                <div className="text-xs opacity-80">{detail.suggested_fix}</div>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs shrink-0",
                  detail.severity === "high" && "bg-red-500/20",
                  detail.severity === "med" && "bg-amber-500/20",
                  detail.severity === "low" && "bg-blue-500/20"
                )}
              >
                {detail.severity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SegmentEditorProps {
  segments: AudioSegment[];
  onSegmentsChange: (segments: AudioSegment[]) => void;
}

function SegmentEditor({ segments, onSegmentsChange }: SegmentEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editSpeaker, setEditSpeaker] = useState("");

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(segments[index].text);
    setEditSpeaker(segments[index].speaker_id);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...segments];
    updated[editingIndex] = {
      ...updated[editingIndex],
      text: editText,
      speaker_id: editSpeaker,
    };
    onSegmentsChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
    setEditSpeaker("");
  };

  const mergeWithNext = (index: number) => {
    if (index >= segments.length - 1) return;
    const updated = [...segments];
    const current = updated[index];
    const next = updated[index + 1];
    updated[index] = {
      ...current,
      end_ms: next.end_ms,
      text: current.text + " " + next.text,
      confidence: Math.min(current.confidence, next.confidence),
    };
    updated.splice(index + 1, 1);
    onSegmentsChange(updated);
  };

  const splitSegment = (index: number) => {
    const seg = segments[index];
    const words = seg.text.split(" ");
    if (words.length < 2) return;
    
    const midpoint = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, midpoint).join(" ");
    const secondHalf = words.slice(midpoint).join(" ");
    const midTime = seg.start_ms + (seg.end_ms - seg.start_ms) / 2;

    const updated = [...segments];
    updated.splice(index, 1, 
      { ...seg, end_ms: midTime, text: firstHalf },
      { ...seg, start_ms: midTime, text: secondHalf }
    );
    onSegmentsChange(updated);
  };

  const deleteSegment = (index: number) => {
    const updated = segments.filter((_, i) => i !== index);
    onSegmentsChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center justify-between">
        <span>Transcript Segments ({segments.length})</span>
        <span className="text-xs text-muted-foreground/70">Hover for actions</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {segments.map((seg, i) => (
          <div 
            key={i} 
            className="p-2 bg-muted/20 rounded text-sm group"
            data-testid={`segment-${i}`}
          >
            {editingIndex === i ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={editSpeaker}
                    onChange={(e) => setEditSpeaker(e.target.value)}
                    className="w-32 h-7 text-xs"
                    placeholder="Speaker name"
                    data-testid="input-edit-speaker"
                  />
                  <div className="flex gap-1 ml-auto">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-edit-text"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">{seg.speaker_id}</span>
                  <span className="text-xs text-muted-foreground">
                    {(seg.start_ms / 1000).toFixed(1)}s - {(seg.end_ms / 1000).toFixed(1)}s
                  </span>
                  {seg.confidence > 0.8 && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                  {seg.overlap && <Badge variant="outline" className="text-xs h-4">overlap</Badge>}
                  <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-5 w-5 p-0"
                      onClick={() => startEdit(i)}
                      title="Edit"
                      data-testid={`btn-edit-segment-${i}`}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    {i < segments.length - 1 && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 w-5 p-0"
                        onClick={() => mergeWithNext(i)}
                        title="Merge with next"
                        data-testid={`btn-merge-segment-${i}`}
                      >
                        <Merge className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-5 w-5 p-0"
                      onClick={() => splitSegment(i)}
                      title="Split segment"
                      data-testid={`btn-split-segment-${i}`}
                    >
                      <Split className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-5 w-5 p-0 text-destructive"
                      onClick={() => deleteSegment(i)}
                      title="Delete"
                      data-testid={`btn-delete-segment-${i}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground">{seg.text}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface QualityFlagsDisplayProps {
  flags: string[];
}

function QualityFlagsDisplay({ flags }: QualityFlagsDisplayProps) {
  if (!flags.length) return null;

  return (
    <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
      <div className="text-xs font-medium text-muted-foreground mb-2">Quality Notes</div>
      <div className="flex flex-wrap gap-1">
        {flags.map((flag) => (
          <Badge 
            key={flag} 
            variant="outline" 
            className="text-xs"
            title={QUALITY_FLAG_DESCRIPTIONS[flag as QualityFlag] || flag}
            data-testid={`quality-flag-${flag}`}
          >
            {flag.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function LiveAudioDiscernment() {
  const [hasConsented, setHasConsented] = useState(() => {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "true";
  });
  const [activeTab, setActiveTab] = useState<"record" | "live">("record");
  const [recording, setRecording] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [editableSegments, setEditableSegments] = useState<AudioSegment[]>([]);
  const [streamSessionId, setStreamSessionId] = useState<string | null>(null);
  const [streamResult, setStreamResult] = useState<AudioDiscernmentResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamIntervalRef = useRef<NodeJS.Timer | null>(null);

  const handleConsent = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "true");
    setHasConsented(true);
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

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

  const startStreaming = async () => {
    try {
      const res = await fetch("/api/audio/stream/start", { method: "POST" });
      const data = await res.json();
      setStreamSessionId(data.session_id);
      setStreaming(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && data.session_id) {
          const formData = new FormData();
          formData.append("session_id", data.session_id);
          formData.append("chunk", e.data);
          await fetch("/api/audio/stream/chunk", {
            method: "POST",
            body: formData,
          }).catch(console.error);
        }
      };

      recorder.start(1000);
    } catch (err) {
      console.error("Streaming failed:", err);
      setStreaming(false);
    }
  };

  const stopStreaming = async () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setStreaming(false);

    if (streamSessionId) {
      const res = await fetch("/api/audio/stream/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: streamSessionId }),
      });
      const result = await res.json() as AudioDiscernmentResult;
      if (result.segments) {
        setEditableSegments(result.segments);
        setStreamResult(result);
        saveArtifact(result).catch(console.error);
      }
    }
    setStreamSessionId(null);
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
      return res.json() as Promise<AudioDiscernmentResult>;
    },
    onSuccess: (data) => {
      setEditableSegments(data.segments);
      setStreamResult(null);
      saveArtifact(data).catch(console.error);
    },
  });

  const result = streamResult || analyzeMutation.data;

  if (!hasConsented) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Live Audio Discernment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsentBanner onConsent={handleConsent} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Live Audio Discernment
          {result?.edcm_input_ready && (
            <Badge variant="default" className="ml-auto bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Ready for EDCM
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "record" | "live")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record" data-testid="tab-record">
              <Volume2 className="h-4 w-4 mr-2" />
              Record & Analyze
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">
              <Radio className="h-4 w-4 mr-2" />
              Live Stream
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 pt-2">
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
          </TabsContent>

          <TabsContent value="live" className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              {!streaming ? (
                <Button onClick={startStreaming} variant="outline" size="sm" data-testid="btn-start-stream">
                  <Radio className="h-4 w-4 mr-2" />
                  Start Live Stream
                </Button>
              ) : (
                <Button onClick={stopStreaming} variant="destructive" size="sm" data-testid="btn-stop-stream">
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Analyze
                </Button>
              )}
              
              {streaming && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Streaming live...
                </div>
              )}
            </div>
            
            {streaming && (
              <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                Audio is being captured and will be analyzed when you stop.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {analyzeMutation.isError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Analysis failed. Please try again.
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2 border-t border-border">
            <HmmAlertPanel hmm={result.hmm} hmmDetails={result.hmm_details} />

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

            <QualityFlagsDisplay flags={result.quality_flags} />
            
            <SegmentEditor 
              segments={editableSegments} 
              onSegmentsChange={setEditableSegments} 
            />

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">
                Duration: {(result.audio.duration_ms / 1000).toFixed(1)}s | 
                Segments: {result.segments.length} |
                Artifact: {result.artifact_id.slice(0, 8)}...
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
