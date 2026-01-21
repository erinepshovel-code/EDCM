import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafetyNotesProps {
  signalsDetected: boolean;
}

export function SafetyNotes({ signalsDetected }: SafetyNotesProps) {
  return (
    <div className={cn(
      "border rounded-sm p-4 transition-colors",
      signalsDetected ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/10"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {signalsDetected ? (
          <ShieldAlert className="h-4 w-4 text-amber-500" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        )}
        <h4 className={cn("text-xs font-bold uppercase tracking-wider", signalsDetected ? "text-amber-500" : "text-emerald-500")}>
          Safety Signals Note
        </h4>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        This tool observes <strong>interaction patterns</strong> that can precede harm (like rapid escalation or boundary erosion). It does not identify "dangerous people."
      </p>

      {signalsDetected && (
        <div className="text-xs text-foreground/90 space-y-1 pl-6 border-l-2 border-amber-500/30">
          <p>• Trust your boundary signals. If "no" leads to pressure, that is a pattern.</p>
          <p>• Consider disengaging if Pace remains Skewed despite your requests to slow down.</p>
          <p>• Keep your own transportation and tell a friend your location.</p>
        </div>
      )}
    </div>
  );
}
