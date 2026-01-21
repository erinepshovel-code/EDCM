import { motion } from "framer-motion";

interface DissonanceCircuitProps {
  Et: number; // Energy
  st: number; // Stored
  delta_t: number; // Flow
}

export function DissonanceCircuit({ Et, st, delta_t }: DissonanceCircuitProps) {
  // Normalize values for visualization (0-1 range approx)
  const energyLevel = Math.min(1, Math.max(0, Et));
  const storageLevel = Math.min(1, Math.max(0, st));
  
  const isCritical = Et > 0.7;
  const isWarning = Et > 0.5 && Et <= 0.7;
  
  const statusColor = isCritical ? "#ef4444" : isWarning ? "#fbbf24" : "#22d3ee";
  
  return (
    <div className="glass-panel p-6 rounded-sm relative h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Circuit State</h3>
        <div className="flex gap-2">
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-mono">DISS</span>
                <span className="font-mono font-bold text-foreground">{Et.toFixed(2)}</span>
            </div>
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-mono">CAP</span>
                <span className="font-mono font-bold text-foreground">{st.toFixed(2)}</span>
            </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
        {/* Core Circuit Visual */}
        <div className="relative w-48 h-48">
          {/* Outer Ring (Capacity) */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#1e293b"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              initial={{ pathLength: 0 }}
              animate={{ pathLength: energyLevel }}
              transition={{ duration: 1, ease: "easeInOut" }}
              cx="96"
              cy="96"
              r="88"
              stroke={statusColor}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray="1 1"
            />
          </svg>
          
          {/* Inner Ring (Storage) */}
          <div className="absolute inset-0 m-auto w-32 h-32 rounded-full border-2 border-border/50 flex items-center justify-center bg-card/30 backdrop-blur-sm">
             <motion.div 
               className="w-full h-full rounded-full opacity-20 absolute"
               style={{ backgroundColor: statusColor }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 3, repeat: Infinity }}
             />
             <div className="relative z-10 flex flex-col items-center">
                <span className="text-4xl font-mono font-bold text-foreground tracking-tighter drop-shadow-lg">
                  {Et.toFixed(2)}
                </span>
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Energy</span>
             </div>
          </div>
          
          {/* Flow Indicator */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Flow</span>
            <span className={`text-sm font-mono font-bold ${delta_t > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {delta_t > 0 ? "+" : ""}{delta_t.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Metrics Footer */}
      <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-border/50">
        <div className="text-center p-2 bg-background/30 rounded">
          <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Capacitance</div>
          <div className="font-mono text-xl font-bold text-foreground">{st.toFixed(2)}</div>
        </div>
        <div className="text-center p-2 bg-background/30 rounded">
          <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Dissipation</div>
          <div className="font-mono text-xl font-bold text-foreground">{(1 - Et).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
