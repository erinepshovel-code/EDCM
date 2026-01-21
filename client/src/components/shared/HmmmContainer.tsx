import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HmmmContainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className={cn(
        "bg-card border-t border-x border-border rounded-t-lg shadow-2xl transition-all duration-300 pointer-events-auto max-w-2xl w-full mx-4",
        isOpen ? "h-48" : "h-10"
      )}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest hover:text-foreground hover:bg-white/5 transition-colors border-b border-transparent hover:border-border"
        >
          <HelpCircle className="h-3 w-3" />
          Liminal Notes / Unresolved Constraints
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
        
        {isOpen && (
          <div className="p-4 h-[calc(100%-40px)] overflow-y-auto">
            <p className="text-sm text-muted-foreground italic text-center mt-8">
              "The system detects a residual tension in the 'Integration' metric that has not been addressed by current projections..."
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
