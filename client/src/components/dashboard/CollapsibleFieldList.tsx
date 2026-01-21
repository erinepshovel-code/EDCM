import React from "react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ConsciousnessField } from "@/lib/edcm-data";
import { ChevronDown, ChevronUp, Users, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleFieldListProps {
  fields: ConsciousnessField[];
}

export function CollapsibleFieldList({ fields }: CollapsibleFieldListProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="glass-panel p-2 rounded-sm"
    >
      <div className="flex items-center justify-between px-2">
        <h4 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
          <Users className="h-3 w-3" />
          Active Fields
          <span className="bg-primary/10 text-primary px-1.5 rounded text-[10px]">
            {fields.length}
          </span>
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/5">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <div className="mt-2 px-2">
        {/* Always show first 2 fields as preview if collapsed */}
        {!isOpen && (
            <div className="flex -space-x-2 py-1">
                 {fields.slice(0, 5).map(f => (
                   <div 
                    key={f.id} 
                    className="w-6 h-6 rounded-full border border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-background"
                    style={{ backgroundColor: f.color }}
                    title={f.label}
                   >
                     {f.label.charAt(0)}
                   </div>
                 ))}
                 {fields.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground ring-1 ring-background">
                        +{fields.length - 5}
                    </div>
                 )}
            </div>
        )}

        <CollapsibleContent className="space-y-2 mt-2">
          {fields.map((field) => (
            <div 
              key={field.id} 
              className="flex items-start gap-3 p-2 rounded bg-background/40 border border-border/40 hover:border-primary/20 transition-colors"
            >
              <div 
                className="w-2 h-2 rounded-full mt-1.5 shrink-0" 
                style={{ backgroundColor: field.color }} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground truncate">
                    {field.label}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase bg-white/5 px-1 rounded">
                    {field.type}
                  </span>
                </div>
                {field.descriptor && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {field.descriptor}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
