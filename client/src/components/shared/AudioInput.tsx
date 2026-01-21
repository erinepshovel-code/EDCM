import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, Pause, Trash2, FileAudio, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioRecorder, transcribeAudio } from '@/audio/service';
import { AudioAnalysisResult } from '@/audio/types';
import { cn } from '@/lib/utils';

interface AudioInputProps {
  onTranscriptChange: (text: string) => void;
  onAnalysisComplete: (result: AudioAnalysisResult) => void;
}

export function AudioInput({ onTranscriptChange, onAnalysisComplete }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      const blob = await recorderRef.current.stop();
      handleNewAudio(blob);
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleNewAudio(file);
    }
  };

  const handleNewAudio = async (blob: Blob) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    
    // Auto-transcribe on new audio
    setIsProcessing(true);
    try {
      const result = await transcribeAudio(blob);
      onTranscriptChange(result.transcript);
      onAnalysisComplete(result);
    } catch (error) {
      console.error("Transcription failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };

  return (
    <div className="space-y-4 border border-border/50 bg-card/30 rounded-md p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FileAudio className="h-4 w-4" />
          Audio Input
        </h4>
        <span className="text-[10px] text-muted-foreground bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
          Analyzes structural dynamics only. Not emotion.
        </span>
      </div>

      {!audioBlob ? (
        <div className="flex gap-4">
          <Button 
            variant={isRecording ? "destructive" : "default"} 
            onClick={isRecording ? stopRecording : startRecording}
            className="flex-1"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2 fill-current" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" /> Record Audio
              </>
            )}
          </Button>
          
          <div className="relative">
            <input 
              type="file" 
              accept="audio/*,video/*" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload}
            />
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Upload File
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in">
          <audio 
            ref={audioRef} 
            src={audioUrl || ""} 
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
          
          <div className="flex items-center gap-3 bg-background/50 p-2 rounded border border-border/50">
            <Button size="icon" variant="ghost" onClick={togglePlayback} className="h-8 w-8">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            {/* Fake waveform viz */}
            <div className="flex-1 h-8 flex items-center gap-0.5 opacity-50">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-primary rounded-full transition-all duration-300"
                  style={{ 
                    height: `${Math.random() * 100}%`,
                    opacity: isPlaying ? 1 : 0.5
                  }} 
                />
              ))}
            </div>

            <Button size="icon" variant="ghost" onClick={clearAudio} className="h-8 w-8 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {isProcessing && (
            <div className="text-xs text-muted-foreground animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              Transcribing & extracting structural features...
            </div>
          )}
        </div>
      )}
      
      <div className="text-[10px] text-muted-foreground flex items-start gap-1.5 p-2 bg-background/30 rounded">
        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
        <p>
          Audio is processed locally for transcript & pacing extraction. We do not detect "anger" or "fear," only signal pressure and structural changes.
        </p>
      </div>
    </div>
  );
}
