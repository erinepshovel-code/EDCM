import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DissonanceCircuit } from "@/components/dashboard/DissonanceCircuit";
import { ConversationInput } from "@/components/dashboard/ConversationInput";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { 
  MOCK_STATE, 
  INITIAL_EXPRESSIONS, 
  INITIAL_FIELDS, 
  INITIAL_METADATA,
  FieldExpression, 
  ConsciousnessField,
  analyzeExpression,
  MetricData,
  MOCK_INSIGHTS
} from "@/lib/edcm-data";
import { cn } from "@/lib/utils";
import { AlertTriangle, User, Users, LineChart, Brain, Share2, Network, Sliders } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [expressions, setExpressions] = useState<FieldExpression[]>(INITIAL_EXPRESSIONS);
  const [fields, setFields] = useState<ConsciousnessField[]>(INITIAL_FIELDS);
  const [selectedExpressionId, setSelectedExpressionId] = useState<string | null>(null);
  const [analysisWindow, setAnalysisWindow] = useState([20]);
  
  // Stats View State
  const [analysisScope, setAnalysisScope] = useState<"expression" | "field" | "system">("expression");
  
  // Real-time Metrics State (Simulated)
  const [currentMetrics, setCurrentMetrics] = useState(MOCK_STATE.metrics);

  const handleAddExpression = (text: string, fieldId: string, isReconstruction: boolean) => {
    const prevMetrics = expressions[expressions.length - 1]?.metrics;
    const newMetrics = analyzeExpression(text, prevMetrics);
    
    const newExpression: FieldExpression = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      field_id: fieldId,
      text: text,
      metrics: newMetrics,
      is_reconstruction: isReconstruction
    };

    setExpressions(prev => [...prev, newExpression]);
    setSelectedExpressionId(newExpression.id);
    
    updateDashboardMetrics(newMetrics);
  };

  const updateDashboardMetrics = (latest: any) => {
    const updated: any = { ...currentMetrics };
    Object.keys(latest).forEach((key) => {
      const k = key as keyof typeof latest;
      if (updated[k]) {
        updated[k] = {
          ...updated[k],
          value: latest[k],
          delta: latest[k] - (updated[k].value || 0),
          history: [...updated[k].history.slice(1), latest[k]]
        };
      }
    });
    setCurrentMetrics(updated);
  };

  const handleAddField = (f: ConsciousnessField) => {
    setFields(prev => [...prev, f]);
  };

  const selectedExpression = expressions.find(e => e.id === selectedExpressionId) || expressions[expressions.length - 1];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 h-[calc(100vh-100px)]">
        
        {/* LEFT COLUMN: Timeline & Input */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between px-4 py-2 glass-panel rounded-sm shrink-0">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-muted-foreground font-mono">Observation Context</span>
               <span className="text-sm font-medium">{INITIAL_METADATA.title}</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex -space-x-2">
                 {fields.map(f => (
                   <div 
                    key={f.id} 
                    className="w-6 h-6 rounded-full border border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: f.color }}
                    title={f.label}
                   >
                     {f.label.charAt(0)}
                   </div>
                 ))}
               </div>
               <div className="h-8 w-[1px] bg-border" />
               <div className="text-right">
                 <span className="block text-[10px] uppercase text-muted-foreground font-mono">Signals</span>
                 <span className="block text-sm font-mono">{expressions.length}</span>
               </div>
             </div>
          </div>

          <div className="flex-1 min-h-0">
            <TimelineView 
              expressions={expressions}
              fields={fields}
              selectedExpressionId={selectedExpressionId}
              onSelectExpression={setSelectedExpressionId}
            />
          </div>

          <div className="shrink-0">
            <ConversationInput 
              fields={fields}
              onAddExpression={handleAddExpression}
              onAddField={handleAddField}
            />
            <div className="text-center mt-2">
               <p className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">
                 Note: This tool observes patterns in expressed signals. Meaning is co-created by the observer.
               </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Analysis */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2">
          
          {/* Analysis Window Control */}
          <div className="glass-panel p-4 rounded-sm">
             <div className="flex justify-between items-center mb-3">
               <h4 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                 <Sliders className="h-3 w-3" />
                 Analysis Window
               </h4>
               <Badge variant="outline" className="font-mono text-[10px]">
                 Last {analysisWindow[0]} Turns
               </Badge>
             </div>
             <Slider 
               defaultValue={[20]} 
               max={100} 
               min={5} 
               step={5} 
               value={analysisWindow} 
               onValueChange={setAnalysisWindow}
               className="mb-1"
             />
             <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
               <span>Local (5)</span>
               <span>Session (100)</span>
             </div>
          </div>

          <Tabs defaultValue="expression" className="w-full" onValueChange={(v) => setAnalysisScope(v as any)}>
            <TabsList className="w-full grid grid-cols-3 bg-card/50 border border-border/50">
              <TabsTrigger value="expression" className="text-xs">Expression</TabsTrigger>
              <TabsTrigger value="field" className="text-xs">Field</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 space-y-4">
              {/* Dynamic Metric Cards based on Scope */}
              <div className="grid grid-cols-2 gap-3">
                 <MetricCard 
                    code="C" label="Strain" 
                    value={selectedExpression?.metrics?.C || 0} 
                    delta={0.05}
                    color="warning"
                  />
                  <MetricCard 
                    code="F" label="Fixation" 
                    value={selectedExpression?.metrics?.F || 0} 
                    delta={0.12}
                    color="destructive"
                  />
                  <MetricCard 
                    code="I" label="Integration" 
                    value={selectedExpression?.metrics?.I || 0} 
                    delta={0.02}
                    color="destructive"
                  />
                  <MetricCard 
                    code="P" label="Resolution" 
                    value={selectedExpression?.metrics?.P || 0} 
                    delta={-0.05}
                    color="primary"
                  />
              </div>

              {/* Scope-Specific Visualizations */}
              <TabsContent value="expression" className="mt-0 space-y-4">
                 <div className="glass-panel p-4 rounded-sm bg-primary/5 border-primary/20">
                   <h4 className="text-xs font-mono uppercase text-primary mb-2 flex items-center gap-2">
                     <LineChart className="h-3 w-3" />
                     Signal Dynamics
                   </h4>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Signal <strong>{selectedExpressionId?.split('-')[1]}</strong> indicates high <strong>Fixation (0.88)</strong>. The field is reinforcing a prior pattern without integrating new interference.
                   </p>
                 </div>
                 
                 {/* Local Insight */}
                 {MOCK_INSIGHTS.filter(i => i.scope === "Local").map(insight => (
                   <InsightCard key={insight.id} insight={insight} />
                 ))}
              </TabsContent>

              <TabsContent value="field" className="mt-0 space-y-4">
                <div className="glass-panel p-4 rounded-sm">
                   <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
                     <Brain className="h-3 w-3" />
                     Field Coherence
                   </h4>
                   {/* Field stats */}
                   <div className="space-y-3">
                     {fields.slice(0, 3).map(f => (
                       <div key={f.id} className="flex items-center justify-between text-xs">
                         <span className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                           {f.label}
                         </span>
                         <span className="font-mono text-muted-foreground">Stability: 0.65</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </TabsContent>

              <TabsContent value="system" className="mt-0 space-y-4">
                 <div className="glass-panel p-4 rounded-sm">
                   <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
                     <Network className="h-3 w-3" />
                     Emergent Patterns
                   </h4>
                   <div className="h-32 flex items-center justify-center border border-dashed border-border rounded opacity-50 text-xs text-center px-4">
                     Multi-field interference pattern detecting phase-cancellation in operational domain.
                   </div>
                 </div>

                 {/* Segment Insight */}
                 {MOCK_INSIGHTS.filter(i => i.scope === "Segment").map(insight => (
                   <InsightCard key={insight.id} insight={insight} />
                 ))}
              </TabsContent>
            </div>
          </Tabs>

          <div className="h-[280px] shrink-0">
            <DissonanceCircuit 
              Et={MOCK_STATE.energy.Et} 
              st={MOCK_STATE.energy.st} 
              delta_t={MOCK_STATE.energy.delta_t}
            />
          </div>

          <div className="glass-panel p-4 rounded-sm border-l-2 border-l-warning">
             <div className="flex justify-between items-start mb-2">
               <h4 className="text-xs font-bold text-warning uppercase">Active Resonance Pattern</h4>
               <Share2 className="h-4 w-4 text-warning" />
             </div>
             <p className="text-xs text-muted-foreground">
               <strong>Looping Instability</strong> detected across last 3 signals. Field coherence is decoupling from shared context.
             </p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
