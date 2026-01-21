import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DissonanceCircuit } from "@/components/dashboard/DissonanceCircuit";
import { MOCK_STATE, MOCK_TRANSCRIPT, AnalysisTurn } from "@/lib/edcm-data";
import { cn } from "@/lib/utils";
import generatedImage from '@assets/generated_images/abstract_scientific_data_visualization_background.png';
import { AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [selectedTurn, setSelectedTurn] = React.useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-6 pb-20">
        
        {/* Top Stats Row */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          <MetricCard 
            code="C" label="Constraint Strain" 
            value={MOCK_STATE.metrics.C.value} 
            delta={MOCK_STATE.metrics.C.delta} 
            data={MOCK_STATE.metrics.C.history}
            color="warning"
            description="Accumulated tension from conflicting directives."
          />
          <MetricCard 
            code="F" label="Fixation" 
            value={MOCK_STATE.metrics.F.value} 
            delta={MOCK_STATE.metrics.F.delta} 
            data={MOCK_STATE.metrics.F.history}
            color="destructive"
            description="Repetitive output patterns indicating deadlock."
          />
          <MetricCard 
            code="I" label="Integration Fail" 
            value={MOCK_STATE.metrics.I.value} 
            delta={MOCK_STATE.metrics.I.delta} 
            data={MOCK_STATE.metrics.I.history}
            color="destructive"
            description="Failure to incorporate corrective feedback."
          />
          <MetricCard 
            code="P" label="Progress" 
            value={MOCK_STATE.metrics.P.value} 
            delta={MOCK_STATE.metrics.P.delta} 
            data={MOCK_STATE.metrics.P.history}
            color="primary"
            description="Movement toward resolution of constraints."
          />
        </div>

        {/* Main Analysis Column */}
        <div className="col-span-8 space-y-6">
          
          {/* Transcript Analyzer */}
          <div className="glass-panel p-0 rounded-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-border bg-card/50 flex justify-between items-center">
              <h3 className="font-mono font-medium text-sm">LIVE TRANSCRIPT ANALYSIS</h3>
              <div className="flex gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground">RECORDING</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {MOCK_TRANSCRIPT.map((turn) => (
                <div 
                  key={turn.id} 
                  className={cn(
                    "relative pl-6 py-2 transition-all cursor-pointer border-l-2",
                    selectedTurn === turn.id 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:bg-white/5",
                    turn.role === "user" ? "ml-0 mr-12" : "ml-12 mr-0"
                  )}
                  onClick={() => setSelectedTurn(turn.id)}
                >
                  <div className="flex items-center gap-3 mb-1 opacity-50">
                    <span className="text-[10px] font-mono uppercase">{turn.role}</span>
                    <span className="text-[10px] font-mono">{turn.timestamp}</span>
                    {turn.role === "system" && turn.metrics && (
                      <div className="flex gap-2 ml-auto">
                        <span className={cn("text-[10px]", turn.metrics.C > 0.7 ? "text-red-400" : "text-muted-foreground")}>
                          C:{turn.metrics.C}
                        </span>
                         <span className={cn("text-[10px]", turn.metrics.I > 0.7 ? "text-red-400" : "text-muted-foreground")}>
                          I:{turn.metrics.I}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "text-sm leading-relaxed",
                    turn.role === "system" ? "text-primary/90 font-mono text-xs" : "text-foreground"
                  )}>
                    {turn.content}
                  </div>
                </div>
              ))}
              
              <div className="border-t border-dashed border-border mt-8 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono animate-pulse">
                  <span>&gt;</span> Awaiting input...
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Circuit & Details */}
        <div className="col-span-4 space-y-6">
          <div className="h-[350px]">
            <DissonanceCircuit 
              Et={MOCK_STATE.energy.Et} 
              st={MOCK_STATE.energy.st} 
              delta_t={MOCK_STATE.energy.delta_t}
            />
          </div>

          {/* Diagnostic Panel */}
          <div className="glass-panel p-6 rounded-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Diagnostic State</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded bg-warning/20 flex items-center justify-center border border-warning/50">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-lg font-bold text-warning tracking-tight">LOAD SATURATION</div>
                <div className="text-xs text-muted-foreground">Threshold crossed at 10:42:49</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Primary Failure Mode</span>
                <span className="font-mono text-foreground">Looping Instability</span>
              </div>
               <div className="flex justify-between text-xs border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="font-mono text-destructive">HIGH (0.85)</span>
              </div>
               <div className="flex justify-between text-xs pb-2">
                <span className="text-muted-foreground">Recommended Action</span>
                <span className="font-mono text-primary">Force Constraint Resolution</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-sm bg-blue-950/20 border-blue-500/20">
            <h4 className="text-xs font-bold text-blue-400 mb-2">EDCM Core Insight</h4>
            <p className="text-xs text-blue-200/70 leading-relaxed">
              System is exhibiting <strong>Narrative Overclosure</strong>. It is generating confident explanations (High O) while failing to integrate the contradictory constraints (High I, High C). Energy is accumulating rather than resolving.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
