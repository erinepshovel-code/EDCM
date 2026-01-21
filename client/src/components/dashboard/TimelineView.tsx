import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FieldExpression, ConsciousnessField } from "@/lib/edcm-data";
import { Filter, GitGraph, History } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TimelineViewProps {
  expressions: FieldExpression[];
  fields: ConsciousnessField[];
  selectedExpressionId: string | null;
  onSelectExpression: (id: string) => void;
}

export function TimelineView({ 
  expressions, 
  fields, 
  selectedExpressionId, 
  onSelectExpression 
}: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterField, setFilterField] = React.useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [expressions.length]);

  const getField = (id: string) => fields.find(f => f.id === id);

  const filteredExpressions = filterField 
    ? expressions.filter(e => e.field_id === filterField)
    : expressions;

  return (
    <div className="flex flex-col h-full bg-card/30 rounded-sm overflow-hidden border border-border/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <GitGraph className="h-3 w-3 text-muted-foreground" />
          <h3 className="font-mono font-medium text-xs text-muted-foreground uppercase tracking-wider">Interference Pattern</h3>
          <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-mono">
            {expressions.length} Signals
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-2">
                <Filter className="h-3 w-3" />
                {filterField ? getField(filterField)?.label : "All Fields"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Field</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filterField === null}
                onCheckedChange={() => setFilterField(null)}
              >
                All Fields
              </DropdownMenuCheckboxItem>
              {fields.map(f => (
                <DropdownMenuCheckboxItem
                  key={f.id}
                  checked={filterField === f.id}
                  onCheckedChange={() => setFilterField(f.id)}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                    {f.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {filteredExpressions.map((exp, index) => {
          const field = getField(exp.field_id);
          const isSelected = selectedExpressionId === exp.id;
          const isSystem = field?.type === "system";
          
          return (
            <div 
              key={exp.id}
              className={cn(
                "group relative pl-4 transition-all duration-200",
                isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"
              )}
              onClick={() => onSelectExpression(exp.id)}
            >
              {/* Connector Line */}
              <div className="absolute left-[7px] top-8 bottom-[-24px] w-[2px] bg-border/30 group-last:hidden" />
              
              {/* Field Node Indicator */}
              <div className="absolute left-0 top-1">
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110",
                    isSelected ? "ring-2 ring-primary/30" : ""
                  )}
                  style={{ 
                    backgroundColor: field?.color || "gray",
                    borderColor: "hsl(var(--background))"
                  }}
                />
              </div>

              <div className={cn(
                "ml-4 rounded-lg p-3 border transition-colors cursor-pointer text-sm relative overflow-hidden",
                isSelected 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-card/40 border-border/40 hover:bg-card/60 hover:border-border/60",
                exp.is_reconstruction && "border-dashed border-muted-foreground/40"
              )}>
                
                {/* Reconstruction Watermark */}
                {exp.is_reconstruction && (
                   <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                     <History className="w-12 h-12" />
                   </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-foreground">
                      {field?.label || "Unknown Field"}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase bg-white/5 px-1 rounded">
                      {field?.type}
                    </span>
                    {exp.is_reconstruction && (
                      <span className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                        <History className="h-3 w-3" /> RECONSTRUCTION
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {exp.timestamp}
                    </span>
                    {/* Inline Metrics Badge */}
                    {exp.metrics && (
                      <div className="flex gap-2 font-mono text-[10px]">
                        {exp.metrics.C > 0.6 && (
                          <span className="text-warning font-bold">C:{exp.metrics.C.toFixed(2)}</span>
                        )}
                        {exp.metrics.I > 0.6 && (
                          <span className="text-destructive font-bold">I:{exp.metrics.I.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className={cn(
                  "leading-relaxed whitespace-pre-wrap relative z-10",
                  isSystem ? "font-mono text-xs text-primary/90" : "text-foreground/90",
                  exp.is_reconstruction && "italic text-muted-foreground"
                )}>
                  {exp.text}
                </div>
                
                {/* Context Descriptor */}
                {field?.descriptor && (
                  <div className="mt-2 text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {field.descriptor}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
