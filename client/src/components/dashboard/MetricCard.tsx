import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface MetricCardProps {
  label: string;
  code: string;
  value: number;
  delta?: number;
  data?: number[];
  color?: "primary" | "warning" | "destructive" | "default";
  description?: string;
}

export function MetricCard({ 
  label, 
  code, 
  value, 
  delta, 
  data = [], 
  color = "default",
  description 
}: MetricCardProps) {
  const chartData = data.map((v, i) => ({ value: v, i }));
  
  const colorClass = 
    color === "primary" ? "text-primary" :
    color === "warning" ? "text-warning" :
    color === "destructive" ? "text-destructive" :
    "text-foreground";

  const strokeColor = 
    color === "primary" ? "hsl(180 80% 45%)" :
    color === "warning" ? "hsl(40 90% 60%)" :
    color === "destructive" ? "hsl(0 80% 60%)" :
    "hsl(220 15% 50%)";

  return (
    <div className="glass-panel p-5 rounded-sm relative overflow-hidden group hover:border-border/80 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("font-mono font-bold text-lg", colorClass)}>{code}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
          </div>
        </div>
        {delta !== undefined && (
          <div className={cn(
            "text-xs font-mono px-1.5 py-0.5 rounded", 
            delta > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          )}>
            {delta > 0 ? "+" : ""}{Math.round(delta * 100)}%
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="font-mono text-3xl font-light tracking-tighter">
          {value.toFixed(2)}
        </div>
        <div className="h-10 w-24 opacity-50 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${code}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={strokeColor} 
                strokeWidth={2}
                fill={`url(#gradient-${code})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {description && (
        <div className="mt-3 text-[10px] text-muted-foreground border-t border-border/50 pt-2">
          {description}
        </div>
      )}
    </div>
  );
}
