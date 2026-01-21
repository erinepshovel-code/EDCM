import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnalysisTurn, Participant } from "@/lib/edcm-data";
import { Filter, User } from "lucide-react";
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
  turns: AnalysisTurn[];
  participants: Participant[];
  selectedTurnId: string | null;
  onSelectTurn: (id: string) => void;
}

export function TimelineView({ 
  turns, 
  participants, 
  selectedTurnId, 
  onSelectTurn 
}: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterSpeaker, setFilterSpeaker] = React.useState<string | null>(null);

  // Auto-scroll to bottom on new turns
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length]);

  const getParticipant = (id: string) => participants.find(p => p.id === id);

  const filteredTurns = filterSpeaker 
    ? turns.filter(t => t.speaker_id === filterSpeaker)
    : turns;

  return (
    <div className="flex flex-col h-full bg-card/30 rounded-sm overflow-hidden border border-border/50">
      {/* Timeline Header & Filters */}
      <div className="px-4 py-3 border-b border-border bg-card/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-mono font-medium text-xs text-muted-foreground uppercase tracking-wider">Timeline</h3>
          <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-mono">
            {turns.length} Turns
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-2">
                <Filter className="h-3 w-3" />
                {filterSpeaker ? getParticipant(filterSpeaker)?.name : "All Speakers"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Speaker</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filterSpeaker === null}
                onCheckedChange={() => setFilterSpeaker(null)}
              >
                All Speakers
              </DropdownMenuCheckboxItem>
              {participants.map(p => (
                <DropdownMenuCheckboxItem
                  key={p.id}
                  checked={filterSpeaker === p.id}
                  onCheckedChange={() => setFilterSpeaker(p.id)}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {filteredTurns.map((turn, index) => {
          const participant = getParticipant(turn.speaker_id);
          const isSelected = selectedTurnId === turn.id;
          const isSystem = participant?.role === "system" || participant?.role === "assistant";
          
          return (
            <div 
              key={turn.id}
              className={cn(
                "group relative pl-4 transition-all duration-200",
                isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"
              )}
              onClick={() => onSelectTurn(turn.id)}
            >
              {/* Connector Line */}
              <div className="absolute left-[7px] top-8 bottom-[-16px] w-[2px] bg-border/40 group-last:hidden" />
              
              {/* Avatar/Indicator */}
              <div className="absolute left-0 top-1">
                <div 
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110",
                    isSelected ? "ring-2 ring-primary/30" : ""
                  )}
                  style={{ 
                    backgroundColor: participant?.color || "gray",
                    borderColor: "hsl(var(--background))"
                  }}
                />
              </div>

              <div className={cn(
                "ml-4 rounded-lg p-3 border transition-colors cursor-pointer text-sm",
                isSelected 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-card/40 border-border/40 hover:bg-card/60 hover:border-border/60"
              )}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-foreground">
                      {participant?.name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase bg-white/5 px-1 rounded">
                      {participant?.role}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {turn.timestamp}
                    </span>
                  </div>
                  
                  {/* Inline Metrics Badge for Quick Scanning */}
                  {turn.metrics && (
                    <div className="flex gap-2 font-mono text-[10px]">
                      {turn.metrics.C > 0.6 && (
                        <span className="text-warning font-bold">C:{turn.metrics.C.toFixed(2)}</span>
                      )}
                      {turn.metrics.I > 0.6 && (
                        <span className="text-destructive font-bold">I:{turn.metrics.I.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={cn(
                  "leading-relaxed whitespace-pre-wrap",
                  isSystem ? "font-mono text-xs text-primary/90" : "text-foreground/90"
                )}>
                  {turn.text}
                </div>
                
                {/* Segment Label */}
                {turn.segment && (
                  <div className="mt-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {turn.segment}
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
