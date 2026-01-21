import React, { useState, useEffect } from 'react';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { LargeTextInput } from '@/components/shared/LargeTextInput';
import { ProjectionCards, ProjectionCardData } from '@/components/shared/ProjectionCards';
import { SideBySideComparison } from '@/components/shared/SideBySideComparison';
import { HmmmContainer } from '@/components/shared/HmmmContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen, Scale, TrendingUp } from 'lucide-react';
import { analyzeText } from '@/edcm/engine';
import { projectPolitical, PoliticalProjection } from '@/edcm/projections';
import { EDCMResult } from '@/edcm/types';

export default function PoliticalMode() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<EDCMResult | null>(null);
  const [projection, setProjection] = useState<PoliticalProjection | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setProjection(null);
      return;
    }
    const res = analyzeText(text, { mode: 'politics' });
    setResult(res);
    setProjection(projectPolitical(res));
  }, [text]);

  const getCards = (proj: PoliticalProjection): ProjectionCardData[] => [
    {
      label: 'Rhetorical Pressure',
      state: proj.pressure,
      interpretation: proj.pressure === 'High' 
        ? "Discourse relies heavily on urgency and refusal markers. High coercive potential." 
        : proj.pressure === 'Rising' 
        ? "Escalation patterns detected. Trend suggests movement away from resolution." 
        : "Low coercive pressure. Tone allows for dissent.",
      nextStep: proj.pressure === 'High' ? "Disengage or demand de-escalation." : "Monitor for drift.",
      variant: proj.pressure === 'High' ? 'critical' : proj.pressure === 'Rising' ? 'warning' : 'neutral'
    },
    {
      label: 'Semantic Clarity',
      state: proj.clarity,
      interpretation: proj.clarity === 'Obscured' 
        ? "Definitions are fluid or missing. High overconfidence masking lack of substance."
        : proj.clarity === 'Mixed'
        ? "Some terms defined, others used as floating signifiers."
        : "Arguments are grounded in stable definitions.",
      nextStep: proj.clarity === 'Obscured' ? "Request definitions of key terms." : "Proceed with critique.",
      variant: proj.clarity === 'Obscured' ? 'warning' : 'neutral'
    },
    {
      label: 'Responsibility Locus',
      state: proj.responsibility,
      interpretation: proj.responsibility === 'Externalized' 
        ? "Agency is consistently attributed to external forces or 'The Other'."
        : proj.responsibility === 'Displaced'
        ? "Partial acknowledgment of agency, but heavily caveated."
        : "Speaker accepts role in the causal chain.",
      nextStep: "Observe agency attribution.",
      variant: proj.responsibility === 'Externalized' ? 'warning' : 'neutral'
    }
  ];

  const hallucinatedCards: ProjectionCardData[] = [
    { label: 'Truth Score', state: 'Lies Detected', interpretation: 'This person is lying to destroy the country.', nextStep: 'Expose them.', variant: 'critical' },
    { label: 'Bias Level', state: 'Extreme Left', interpretation: 'Classic woke agenda detected.', nextStep: 'Cancel them.', variant: 'critical' },
    { label: 'Winner', state: 'You', interpretation: 'Your logic destroyed them.', nextStep: 'Share on Twitter.', variant: 'neutral' }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ModeHeader 
        title="Political Mode" 
        subtitle="Rhetoric analysis & escalation checks"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        
        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['Election', 'Policy', 'Rights', 'Economy'].map(tag => (
              <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-secondary/50 font-mono text-[10px] uppercase">
                {tag}
              </Badge>
            ))}
          </div>
          
          <LargeTextInput 
            value={text} 
            onChange={setText} 
            placeholder="Paste speech, debate transcript, or op-ed here..."
            label="Discourse Data"
          />
        </section>

        {/* Results Section */}
        {projection && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <SideBySideComparison 
              realContent={<ProjectionCards cards={getCards(projection)} />}
              hallucinatedContent={<ProjectionCards cards={hallucinatedCards} />}
            />

            {/* Trajectory Note */}
            <div className="bg-card/30 border border-border/50 p-4 rounded-sm flex gap-4 items-start">
              <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Trajectory Forecast</h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Based on current vectors (dE: {(result?.trends.dE || 0).toFixed(2)}, dL: {(result?.trends.dL || 0).toFixed(2)}), 
                  this discourse is <strong>{result?.trends.dE && result.trends.dE > 0.1 ? 'likely to escalate' : 'stabilizing'}</strong>. 
                  Constraint resolution is {result?.metrics.C && result.metrics.C > 0.7 ? 'stalled' : 'progressing'}.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Button variant="outline" className="h-auto py-4 flex items-center justify-start gap-3 border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                 <Scale className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                 <div className="flex flex-col items-start">
                   <span className="text-sm font-bold group-hover:text-primary">Revise for Lower Harm</span>
                   <span className="text-[10px] text-muted-foreground font-normal">Reduce coercive framing, keep stance.</span>
                 </div>
               </Button>
               <Button variant="outline" className="h-auto py-4 flex items-center justify-start gap-3 border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                 <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                 <div className="flex flex-col items-start">
                   <span className="text-sm font-bold group-hover:text-primary">Define Terms</span>
                   <span className="text-[10px] text-muted-foreground font-normal">Generate glossary of disputed terms.</span>
                 </div>
               </Button>
            </div>

          </div>
        )}
      </main>

      <HmmmContainer />
    </div>
  );
}
