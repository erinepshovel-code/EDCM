import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X, Mic, Keyboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioInput } from '@/components/shared/AudioInput';
import { AudioAnalysisResult } from '@/audio/types';

interface LargeTextInputProps {
  value: string;
  onChange: (val: string) => void;
  onAudioAnalysis?: (features: any) => void; // Callback to pass audio features up
  placeholder?: string;
  label?: string;
}

export function LargeTextInput({ value, onChange, onAudioAnalysis, placeholder, label }: LargeTextInputProps) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const [activeTab, setActiveTab] = useState("text");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange(text);
    };
    reader.readAsText(file);
  };

  const handleAudioComplete = (result: AudioAnalysisResult) => {
    // When audio is done, we update the text and pass the features
    onChange(result.transcript); // Or append if user prefers? sticking to replace for simplicity
    if (onAudioAnalysis) {
      onAudioAnalysis(result.features);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        {label && <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</label>}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-7">
          <TabsList className="h-7 p-0 bg-transparent gap-2">
            <TabsTrigger value="text" className="h-7 text-xs px-2 data-[state=active]:bg-card border border-transparent data-[state=active]:border-border">
              <Keyboard className="h-3 w-3 mr-1.5" /> Text
            </TabsTrigger>
            <TabsTrigger value="audio" className="h-7 text-xs px-2 data-[state=active]:bg-card border border-transparent data-[state=active]:border-border">
              <Mic className="h-3 w-3 mr-1.5" /> Audio
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative">
        {activeTab === 'text' && (
          <div className="group relative">
             <div className="absolute top-2 right-2 flex gap-2 z-10">
               <div className="relative">
                 <input 
                   type="file" 
                   accept=".txt,.md,.json" 
                   className="absolute inset-0 opacity-0 cursor-pointer" 
                   onChange={handleFileUpload}
                 />
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                   <Upload className="h-3 w-3" />
                 </Button>
               </div>
               {value && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onChange('')}>
                   <X className="h-3 w-3" />
                 </Button>
               )}
            </div>
            
            <Textarea 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[200px] font-mono text-sm leading-relaxed resize-y p-4 bg-card/50 hover:bg-card/80 transition-colors border-border/50 focus-visible:ring-primary/20"
            />
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
              {wordCount} words
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="min-h-[200px] bg-card/50 border border-border/50 rounded-md p-4 flex flex-col gap-4">
            <AudioInput 
              onTranscriptChange={onChange} 
              onAnalysisComplete={handleAudioComplete}
            />
            {value && (
              <div className="flex-1 mt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Transcript Preview</label>
                <div className="p-3 bg-background/50 rounded border border-border/50 text-sm font-mono text-muted-foreground max-h-[150px] overflow-y-auto">
                  {value}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
