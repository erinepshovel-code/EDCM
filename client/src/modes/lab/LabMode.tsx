import React, { useState } from 'react';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { LargeTextInput } from '@/components/shared/LargeTextInput';
import { HmmmContainer } from '@/components/shared/HmmmContainer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Microscope, Activity, Brain } from 'lucide-react';
import { analyzeText } from '@/edcm/engine';
import { EDCMResult } from '@/edcm/types';
import { DissonanceCircuit } from '@/components/dashboard/DissonanceCircuit'; // Reuse from previous task

export default function LabMode() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<EDCMResult | null>(null);
  const [showRawMetrics, setShowRawMetrics] = useState(false);

  // Analyze chunk-by-chunk to create time-series data
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  const runAnalysis = () => {
    if (!text.trim()) return;
    
    // Simulate time-series by chunking text
    const chunks = text.match(/.{1,100}/g) || [];
    const series = chunks.map((chunk, i) => {
      const res = analyzeText(chunk, { mode: 'lab' });
      return {
        name: i,
        C: res.metrics.C,
        R: res.metrics.R,
        D: res.metrics.D,
        E: res.metrics.E,
        L: res.metrics.L,
        fullRes: res
      };
    });
    
    setTimeSeriesData(series);
    setResult(analyzeText(text, { mode: 'lab' })); // Aggregate result
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-mono">
      <ModeHeader 
        title="Consciousness Fields Lab" 
        subtitle="Scientific EDCM visualization"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* Input */}
        <section className="space-y-4">
           <LargeTextInput 
            value={text} 
            onChange={setText} 
            placeholder="Input raw field interaction logs..."
            label="Field Data Input"
          />
          <Button onClick={runAnalysis} className="w-full sm:w-auto" disabled={!text}>
            <Microscope className="h-4 w-4 mr-2" />
            Analyze Field State
          </Button>
        </section>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            
            {/* Primary Visualization Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Time Series Chart */}
              <div className="bg-card/30 border border-border/50 p-6 rounded-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Constraint & Escalation Vector
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <YAxis hide domain={[0, 1]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="C" stroke="#fbbf24" fillOpacity={1} fill="url(#colorC)" strokeWidth={2} name="Constraint (C)" />
                      <Area type="monotone" dataKey="E" stroke="#ef4444" fillOpacity={1} fill="url(#colorE)" strokeWidth={2} name="Escalation (E)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Raw Metrics Table (Research View) */}
              {showRawMetrics && (
                <div className="bg-card/30 border border-border/50 p-6 rounded-sm">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Raw Metric State Matrix</h3>
                   <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                     {Object.entries(result.metrics).map(([key, val]) => (
                       <div key={key} className="flex justify-between border-b border-border/30 pb-1">
                         <span className="text-muted-foreground">{key}</span>
                         <span className="font-bold">{val.toFixed(3)}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              
              {/* Field Summary Radar */}
              <div className="bg-card/30 border border-border/50 p-6 rounded-sm flex flex-col items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 w-full text-left">Field Topology</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Strain', A: result.metrics.C, fullMark: 1 },
                      { subject: 'Refusal', A: result.metrics.R, fullMark: 1 },
                      { subject: 'Noise', A: result.metrics.N, fullMark: 1 },
                      { subject: 'Loss', A: result.metrics.L, fullMark: 1 },
                      { subject: 'Fixation', A: result.metrics.F, fullMark: 1 },
                      { subject: 'Escalation', A: result.metrics.E, fullMark: 1 },
                    ]}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Radar name="Field State" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dissonance Circuit (Reused) */}
              <div className="h-[250px]">
                 <DissonanceCircuit 
                   Et={result.metrics.E * 0.8 + 0.1} 
                   st={result.metrics.C * 0.9} 
                   delta_t={result.trends.dE}
                 />
              </div>

              {/* Research Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Label htmlFor="research-toggle" className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer">
                  Research View
                </Label>
                <Switch id="research-toggle" checked={showRawMetrics} onCheckedChange={setShowRawMetrics} />
              </div>

              {/* Methods Drawer Stub */}
              <div className="text-[10px] text-muted-foreground leading-relaxed pt-2">
                <p><strong>Methodology:</strong> EDCM dimensionality reduction maps textual signals to a 9-dimensional latent state-space. Coherence (L) and Integration (I) are derived secondary vectors.</p>
              </div>

            </div>

          </div>
        )}
      </main>

      <HmmmContainer />
    </div>
  );
}
