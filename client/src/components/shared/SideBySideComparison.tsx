import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EyeOff, Eye } from 'lucide-react';

interface SideBySideComparisonProps {
  realContent: React.ReactNode;
  hallucinatedContent: React.ReactNode;
}

export function SideBySideComparison({ realContent, hallucinatedContent }: SideBySideComparisonProps) {
  const [showHallucination, setShowHallucination] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <Label htmlFor="hallucination-toggle" className={cn("text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-2", showHallucination ? "text-destructive" : "text-muted-foreground")}>
          {showHallucination ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Controlled Hallucination (Compare)
        </Label>
        <Switch 
          id="hallucination-toggle" 
          checked={showHallucination} 
          onCheckedChange={setShowHallucination}
          className="data-[state=checked]:bg-destructive"
        />
      </div>

      <div className={cn("grid gap-6 transition-all", showHallucination ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        <div className="relative">
          {showHallucination && (
            <div className="absolute -top-3 left-2 bg-background border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest z-10">
              EDCM Analysis
            </div>
          )}
          {realContent}
        </div>
        
        {showHallucination && (
          <div className="relative opacity-100 animate-in fade-in duration-300">
             <div className="absolute -top-3 left-2 bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-mono text-destructive uppercase tracking-widest z-10">
              Flawed Model (Hallucinated)
            </div>
            <div className="border border-destructive/20 rounded-sm bg-destructive/5 h-full relative overflow-hidden">
               {/* Scanline effect for hallucination */}
               <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-20 opacity-20" />
               {hallucinatedContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
