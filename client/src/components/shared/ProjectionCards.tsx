import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export interface ProjectionCardData {
  label: string;
  state: string;
  interpretation: string;
  nextStep: string;
  variant?: 'neutral' | 'warning' | 'critical';
}

interface ProjectionCardsProps {
  cards: ProjectionCardData[];
}

export function ProjectionCards({ cards }: ProjectionCardsProps) {
  const variantStyles = {
    neutral: "border-l-primary/50 bg-card/40",
    warning: "border-l-amber-500/50 bg-amber-500/5",
    critical: "border-l-destructive/50 bg-destructive/5"
  };

  const stateColors = {
    neutral: "text-primary",
    warning: "text-amber-500",
    critical: "text-destructive"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const variant = card.variant || 'neutral';
        return (
          <div key={idx} className={cn("border border-border border-l-4 rounded-sm p-4 flex flex-col gap-3", variantStyles[variant])}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{card.label}</span>
            </div>
            
            <div className={cn("text-2xl font-bold tracking-tight", stateColors[variant])}>
              {card.state}
            </div>
            
            <p className="text-sm text-foreground/90 leading-relaxed min-h-[40px]">
              {card.interpretation}
            </p>
            
            <div className="mt-auto pt-3 border-t border-border/50">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{card.nextStep}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
