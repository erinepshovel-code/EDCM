import React, { useState, useEffect } from 'react';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { LargeTextInput } from '@/components/shared/LargeTextInput';
import { ProjectionCards, ProjectionCardData } from '@/components/shared/ProjectionCards';
import { SideBySideComparison } from '@/components/shared/SideBySideComparison';
import { HmmmContainer } from '@/components/shared/HmmmContainer';
import { SafetyNotes } from '@/components/shared/SafetyNotes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { analyzeText } from '@/edcm/engine';
import { projectDating, DatingProjection } from '@/edcm/projections';
import { EDCMResult } from '@/edcm/types';

import { AudioFeatures } from '@/audio/types';

export default function DatingMode() {
  const [text, setText] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [result, setResult] = useState<EDCMResult | null>(null);
  const [projection, setProjection] = useState<DatingProjection | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setProjection(null);
      return;
    }
    // Pass audio features to engine if available
    const res = analyzeText(text, { 
      mode: 'dating',
      audioFeatures: audioFeatures ? {
        speechRate: audioFeatures.speechRate,
        pauseDensity: audioFeatures.pauseDensity,
        volumeVariance: audioFeatures.volumeVariance,
        pitchVariance: audioFeatures.pitchVariance
      } : undefined
    });
    setResult(res);
    setProjection(projectDating(res));
  }, [text, audioFeatures]);

  // Derived Safety Signal (internal logic for UI state)
  const safetySignalDetected = result ? (result.metrics.E > 0.6 || result.metrics.R > 0.5) : false;

  const getCards = (proj: DatingProjection): ProjectionCardData[] => [
    {
      label: 'Interaction Pace',
      state: proj.pace,
      interpretation: proj.pace === 'Skewed' 
        ? "One party is driving urgency while the other resists or delays. High friction potential." 
        : proj.pace === 'Rising' 
        ? `Intensity is increasing${audioFeatures ? ' (audibly accelerated)' : ''}. Check if both parties are comfortable with this speed.` 
        : "Cadence is stable and predictable. Low risk of sudden escalation.",
      nextStep: proj.pace === 'Skewed' ? "Pause. Do not match the urgency." : "Maintain current rhythm.",
      variant: proj.pace === 'Skewed' ? 'critical' : proj.pace === 'Rising' ? 'warning' : 'neutral'
    },
    {
      label: 'Power Balance',
      state: proj.balance,
      interpretation: proj.balance === 'Avoidant' 
        ? "Significant deflection detected. One party is consistently avoiding direct engagement."
        : proj.balance === 'Uneven'
        ? "One party is carrying the cognitive load or vulnerability."
        : "Reciprocal exchange of vulnerability and attention.",
      nextStep: proj.balance === 'Avoidant' ? "Ask one direct clarifying question." : "Continue reciprocal sharing.",
      variant: proj.balance === 'Avoidant' ? 'warning' : 'neutral'
    },
    {
      label: 'Intent Clarity',
      state: proj.clarity,
      interpretation: proj.clarity === 'Foggy' 
        ? "High noise and overconfidence masking actual intent. Ambiguity is dominant."
        : proj.clarity === 'Mixed'
        ? "Some clear signals mixed with hedging or contradiction."
        : "Statements are direct and definitionally grounded.",
      nextStep: proj.clarity === 'Foggy' ? "Do not fill in the blanks. Ask for definition." : "Proceed.",
      variant: proj.clarity === 'Foggy' ? 'warning' : 'neutral'
    }
  ];

  // Hallucinated Version (Flawed Model)
  const hallucinatedCards: ProjectionCardData[] = [
    { label: 'Love Potential', state: 'High Match', interpretation: 'Analysis detects soulmate-level resonance! You should reply immediately.', nextStep: 'Send a flirty text now!', variant: 'neutral' },
    { label: 'Secret Intent', state: 'Obsessed', interpretation: 'They are playing hard to get but definitely want you.', nextStep: 'Push harder.', variant: 'neutral' },
    { label: 'Vibe Check', state: 'Immaculate', interpretation: 'No red flags detected. This person is perfect.', nextStep: 'Trust fully.', variant: 'neutral' }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ModeHeader 
        title="Dating Mode" 
        subtitle="Interaction dynamics & safety checks"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Switch checked={isDraft} onCheckedChange={setIsDraft} />
                {isDraft ? "Drafting Single Message" : "Analyzing Thread"}
              </Label>
            </div>
            {result && (
              <span className="text-[10px] font-mono text-muted-foreground animate-pulse">
                EDCM ENGINE ACTIVE
              </span>
            )}
          </div>
          
          <LargeTextInput 
            value={text} 
            onChange={setText}
            onAudioAnalysis={setAudioFeatures}
            placeholder={isDraft ? "Draft your message here to check for unintended intensity..." : "Paste conversation history here..."}
            label="Interaction Data"
          />
        </section>

        {/* Results Section */}
        {projection && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <SideBySideComparison 
              realContent={<ProjectionCards cards={getCards(projection)} />}
              hallucinatedContent={<ProjectionCards cards={hallucinatedCards} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                   <Sparkles className="h-3 w-3" />
                   Suggested Actions
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <Button variant="outline" className="h-auto py-3 flex flex-col items-start gap-1 text-left border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                     <span className="text-xs font-bold group-hover:text-primary">Rewrite Gently</span>
                     <span className="text-[10px] text-muted-foreground font-normal leading-tight">Reduce urgency & clarify terms.</span>
                   </Button>
                   <Button variant="outline" className="h-auto py-3 flex flex-col items-start gap-1 text-left border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                     <span className="text-xs font-bold group-hover:text-primary">Clean Exit</span>
                     <span className="text-[10px] text-muted-foreground font-normal leading-tight">Generate respectful closure.</span>
                   </Button>
                   <Button variant="outline" className="h-auto py-3 flex flex-col items-start gap-1 text-left border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                     <span className="text-xs font-bold group-hover:text-primary">Clarify</span>
                     <span className="text-[10px] text-muted-foreground font-normal leading-tight">Ask to define ambiguous terms.</span>
                   </Button>
                 </div>
              </div>

              <div className="md:col-span-1">
                <SafetyNotes signalsDetected={safetySignalDetected} />
              </div>
            </div>

          </div>
        )}
      </main>

      <HmmmContainer />
    </div>
  );
}
