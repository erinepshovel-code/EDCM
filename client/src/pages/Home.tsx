import React from 'react';
import { Link } from 'wouter';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Microscope, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { HmmmContainer } from '@/components/shared/HmmmContainer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <ModeHeader 
        title="EDCM Analyzer" 
        subtitle="Interaction Dynamics Platform"
      />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
            Understand the unseen mechanics<br />of your interactions.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            A privacy-first tool that analyzes pressure, clarity, and dynamics in text without judgment.
            Local-only by default.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Dating Card */}
          <Link href="/dating">
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Heart className="w-24 h-24" />
              </div>
              <div className="mb-4 p-3 bg-pink-500/10 w-fit rounded-lg">
                <Heart className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dating Mode</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Navigate early interactions safely. Detect pace mismatches, coercive patterns, and clarity issues before they escalate.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Enter Mode <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Politics Card */}
          <Link href="/politics">
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare className="w-24 h-24" />
              </div>
              <div className="mb-4 p-3 bg-blue-500/10 w-fit rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Political Mode</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Analyze rhetorical pressure and semantic drift in political discourse. See the mechanics of escalation without partisan bias.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Enter Mode <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Lab Card */}
          <Link href="/lab">
            <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Microscope className="w-24 h-24" />
              </div>
              <div className="mb-4 p-3 bg-emerald-500/10 w-fit rounded-lg">
                <Microscope className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Consciousness Lab</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                Scientific instrument for visualizing "consciousness fields." Raw metrics, vector analysis, and field topology.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Enter Mode <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
          <div className="flex gap-4">
             <ShieldCheck className="w-6 h-6 text-muted-foreground shrink-0" />
             <div>
               <h4 className="font-bold text-sm mb-1">Privacy First</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 All analysis runs locally in your browser by default. We do not store your conversations unless you explicitly enable cloud sync.
               </p>
             </div>
          </div>
          <div className="flex gap-4">
             <Database className="w-6 h-6 text-muted-foreground shrink-0" />
             <div>
               <h4 className="font-bold text-sm mb-1">Local Storage</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Sessions are saved to your device's IndexedDB. You can export/import your data as JSON at any time.
               </p>
             </div>
          </div>
        </div>

      </main>

      <HmmmContainer />
    </div>
  );
}
