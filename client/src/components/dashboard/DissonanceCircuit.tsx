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
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">Circuit State</h3>
      
      <div className="flex-1 flex items-center justify-center relative">
        {/* Core Circuit Visual */}
        <div className="relative w-48 h-48">
          {/* Outer Ring (Capacity) */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#1e293b"
              strokeWidth="4"
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
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="1 1"
            />
          </svg>
          
          {/* Inner Ring (Storage) */}
          <div className="absolute inset-0 m-auto w-32 h-32 rounded-full border border-border/50 flex items-center justify-center">
             <motion.div 
               className="w-full h-full rounded-full opacity-20"
               style={{ backgroundColor: statusColor }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 3, repeat: Infinity }}
             />
             <div className="absolute font-mono text-2xl font-bold text-foreground">
               {Et.toFixed(2)}
               <span className="text-[10px] block text-center text-muted-foreground">E(t)</span>
             </div>
          </div>
          
          {/* Flow Indicator */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-card border border-border px-3 py-1 rounded text-xs font-mono">
            Δt: <span className={delta_t > 0 ? "text-emerald-400" : "text-red-400"}>
              {delta_t > 0 ? "+" : ""}{delta_t.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Metrics Footer */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground mb-1">CAPACITANCE</div>
          <div className="font-mono text-lg">{st.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground mb-1">DISSIPATION</div>
          <div className="font-mono text-lg">{(1 - Et).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
