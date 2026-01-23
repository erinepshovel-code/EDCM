import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle, 
  Flag, 
  ArrowRight,
  X,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HmmmItem } from '../../../../shared/edcm-assistant-types';

interface HmmmPanelProps {
  items: HmmmItem[];
  onResolve?: (id: string) => void;
  onFix?: (item: HmmmItem) => void;
}

const categoryIcons: Record<HmmmItem['category'], typeof AlertTriangle> = {
  assumption: Lightbulb,
  uncertainty: HelpCircle,
  quality_flag: Flag,
  next_action: ArrowRight,
};

const categoryLabels: Record<HmmmItem['category'], string> = {
  assumption: 'Assumption',
  uncertainty: 'Uncertainty',
  quality_flag: 'Quality Flag',
  next_action: 'Next Action',
};

const severityColors: Record<HmmmItem['severity'], string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  med: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function HmmmPanel({ items, onResolve, onFix }: HmmmPanelProps) {
  const activeItems = items.filter(item => !item.resolved);
  const resolvedItems = items.filter(item => item.resolved);

  const groupedItems = activeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, HmmmItem[]>);

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hmm items - all clear</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Hmm Items
          {activeItems.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeItems.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => {
              const Icon = categoryIcons[category as HmmmItem['category']];
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {categoryLabels[category as HmmmItem['category']]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3 rounded-lg border text-sm',
                          severityColors[item.severity]
                        )}
                        data-testid={`hmm-item-${item.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{item.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              Source: {item.source}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {item.severity}
                          </Badge>
                        </div>
                        {item.suggested_fix && (
                          <div className="mt-2 pt-2 border-t border-current/10">
                            <p className="text-xs opacity-80">
                              Fix: {item.suggested_fix}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {item.fix_action && onFix && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={() => onFix(item)}
                                  data-testid={`button-fix-${item.id}`}
                                >
                                  Apply Fix
                                </Button>
                              )}
                              {onResolve && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => onResolve(item.id)}
                                  data-testid={`button-resolve-${item.id}`}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Dismiss
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {resolvedItems.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Resolved ({resolvedItems.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {resolvedItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2 text-xs text-muted-foreground opacity-50 line-through"
                    >
                      {item.message}
                    </div>
                  ))}
                  {resolvedItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{resolvedItems.length - 3} more resolved
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
