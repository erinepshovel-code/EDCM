import { cn } from "@/lib/utils";
import { Insight } from "@/lib/edcm-data";
import { AlertCircle, Eye, Microscope, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const scopeColors = {
    Local: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Segment: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Session: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const scopeIcon = {
    Local: <Microscope className="w-3 h-3" />,
    Segment: <Ruler className="w-3 h-3" />,
    Session: <Eye className="w-3 h-3" />,
  };

  return (
    <div className="glass-panel p-4 rounded-sm border-l-2 border-l-primary hover:bg-card/40 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-1">
          <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase border w-fit mb-1", scopeColors[insight.scope])}>
            {scopeIcon[insight.scope]}
            {insight.scope} Scope
          </div>
          <h4 className="text-sm font-medium tracking-tight text-foreground">{insight.title}</h4>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
          Conf: {Math.round(insight.confidence * 100)}%
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {insight.description}
      </p>

      <div className="bg-background/30 rounded p-2 border border-border/50">
        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
          <AlertCircle className="w-3 h-3" />
          Falsification Criteria
        </div>
        <p className="text-[10px] text-muted-foreground/80 italic">
          "{insight.falsification}"
        </p>
      </div>
    </div>
  );
}
