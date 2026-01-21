import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DissonanceCircuit } from "@/components/dashboard/DissonanceCircuit";
import { ConversationInput } from "@/components/dashboard/ConversationInput";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { 
  MOCK_STATE, 
  INITIAL_TRANSCRIPT, 
  INITIAL_PARTICIPANTS, 
  INITIAL_METADATA,
  AnalysisTurn, 
  Participant,
  analyzeTurn,
  MetricData
} from "@/lib/edcm-data";
import { cn } from "@/lib/utils";
import { AlertTriangle, User, Users, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [turns, setTurns] = useState<AnalysisTurn[]>(INITIAL_TRANSCRIPT);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  
  // Stats View State
  const [analysisScope, setAnalysisScope] = useState<"turn" | "speaker" | "meeting">("turn");
  
  // Real-time Metrics State (Simulated)
  const [currentMetrics, setCurrentMetrics] = useState(MOCK_STATE.metrics);

  const handleAddTurn = (text: string, speakerId: string) => {
    const prevMetrics = turns[turns.length - 1]?.metrics;
    const newMetrics = analyzeTurn(text, prevMetrics);
    
    const newTurn: AnalysisTurn = {
      id: `turn-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      speaker_id: speakerId,
      text: text,
      metrics: newMetrics,
      segment: "Live Discussion" // Simplified for now
    };

    setTurns(prev => [...prev, newTurn]);
    setSelectedTurnId(newTurn.id);
    
    // Update dashboard metrics (simulating the latest state)
    // In a real app, this would aggregate. For mock, we show the "Live" metrics of the new turn
    // mixed with some smoothing logic
    updateDashboardMetrics(newMetrics);
  };

  const updateDashboardMetrics = (latest: any) => {
    // This function just maps the latest turn metrics to the SystemState format
    // In a real implementation, this would handle the aggregation logic.
    const updated: any = { ...currentMetrics };
    
    Object.keys(latest).forEach((key) => {
      const k = key as keyof typeof latest;
      if (updated[k]) {
        updated[k] = {
          ...updated[k],
          value: latest[k],
          delta: latest[k] - (updated[k].value || 0),
          // Simple history update
          history: [...updated[k].history.slice(1), latest[k]]
        };
      }
    });
    
    setCurrentMetrics(updated);
  };

  const handleAddParticipant = (p: Participant) => {
    setParticipants(prev => [...prev, p]);
  };

  // Get selected turn object
  const selectedTurn = turns.find(t => t.id === selectedTurnId) || turns[turns.length - 1];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 h-[calc(100vh-100px)]">
        
        {/* LEFT COLUMN: Timeline & Input */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between px-4 py-2 glass-panel rounded-sm shrink-0">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase text-muted-foreground font-mono">Session</span>
               <span className="text-sm font-medium">{INITIAL_METADATA.title}</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex -space-x-2">
                 {participants.map(p => (
                   <div 
                    key={p.id} 
                    className="w-6 h-6 rounded-full border border-background flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                   >
                     {p.name.charAt(0)}
                   </div>
                 ))}
               </div>
               <div className="h-8 w-[1px] bg-border" />
               <div className="text-right">
                 <span className="block text-[10px] uppercase text-muted-foreground font-mono">Turns</span>
                 <span className="block text-sm font-mono">{turns.length}</span>
               </div>
             </div>
          </div>

          <div className="flex-1 min-h-0">
            <TimelineView 
              turns={turns}
              participants={participants}
              selectedTurnId={selectedTurnId}
              onSelectTurn={setSelectedTurnId}
            />
          </div>

          <div className="shrink-0">
            <ConversationInput 
              participants={participants}
              onAddTurn={handleAddTurn}
              onAddParticipant={handleAddParticipant}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Analysis */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2">
          
          <Tabs defaultValue="turn" className="w-full" onValueChange={(v) => setAnalysisScope(v as any)}>
            <TabsList className="w-full grid grid-cols-3 bg-card/50 border border-border/50">
              <TabsTrigger value="turn" className="text-xs">Turn</TabsTrigger>
              <TabsTrigger value="speaker" className="text-xs">Speaker</TabsTrigger>
              <TabsTrigger value="meeting" className="text-xs">Meeting</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 space-y-4">
              {/* Dynamic Metric Cards based on Scope */}
              <div className="grid grid-cols-2 gap-3">
                 <MetricCard 
                    code="C" label="Strain" 
                    value={selectedTurn?.metrics?.C || 0} 
                    delta={0.05}
                    color="warning"
                  />
                  <MetricCard 
                    code="F" label="Fixation" 
                    value={selectedTurn?.metrics?.F || 0} 
                    delta={0.12}
                    color="destructive"
                  />
                  <MetricCard 
                    code="I" label="Integration" 
                    value={selectedTurn?.metrics?.I || 0} 
                    delta={0.02}
                    color="destructive"
                  />
                  <MetricCard 
                    code="P" label="Progress" 
                    value={selectedTurn?.metrics?.P || 0} 
                    delta={-0.05}
                    color="primary"
                  />
              </div>

              {/* Scope-Specific Visualizations */}
              <TabsContent value="turn" className="mt-0 space-y-4">
                 <div className="glass-panel p-4 rounded-sm bg-primary/5 border-primary/20">
                   <h4 className="text-xs font-mono uppercase text-primary mb-2 flex items-center gap-2">
                     <LineChart className="h-3 w-3" />
                     Local Dynamics
                   </h4>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Turn <strong>{selectedTurnId?.split('-')[1]}</strong> exhibits high <strong>Fixation (0.88)</strong> relative to the previous turn. Speaker is restating position without integrating feedback.
                   </p>
                 </div>
              </TabsContent>

              <TabsContent value="speaker" className="mt-0 space-y-4">
                <div className="glass-panel p-4 rounded-sm">
                   <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
                     <User className="h-3 w-3" />
                     Speaker Aggregates
                   </h4>
                   {/* Placeholder for speaker stats */}
                   <div className="space-y-3">
                     {participants.slice(0, 3).map(p => (
                       <div key={p.id} className="flex items-center justify-between text-xs">
                         <span className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                           {p.name}
                         </span>
                         <span className="font-mono text-muted-foreground">Avg C: 0.45</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </TabsContent>

              <TabsContent value="meeting" className="mt-0 space-y-4">
                 <div className="glass-panel p-4 rounded-sm">
                   <h4 className="text-xs font-mono uppercase text-muted-foreground mb-4 flex items-center gap-2">
                     <Users className="h-3 w-3" />
                     Global State
                   </h4>
                   <div className="h-32 flex items-center justify-center border border-dashed border-border rounded opacity-50 text-xs">
                     Aggregate Topology Graph
                   </div>
                 </div>
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
               <h4 className="text-xs font-bold text-warning uppercase">Active Failure Mode</h4>
               <AlertTriangle className="h-4 w-4 text-warning" />
             </div>
             <p className="text-xs text-muted-foreground">
               <strong>Looping Instability</strong> detected across last 3 turns. Convergence probability dropping.
             </p>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
