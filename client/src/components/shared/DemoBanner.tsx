import React, { useState } from 'react';
import { X, Shield, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('edcm-demo-banner-dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('edcm-demo-banner-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-emerald-200/90">
          <div className="flex items-center gap-1.5 shrink-0">
            <Shield className="h-3.5 w-3.5" />
            <Database className="h-3.5 w-3.5" />
          </div>
          <p className="font-mono">
            <span className="font-bold text-emerald-300">Local-first analysis.</span>
            {' '}No accounts required. Data stays on your device unless you subscribe to sync.
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-emerald-300/50 hover:text-emerald-300 transition-colors shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
