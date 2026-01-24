import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clipboard, Play, Pause, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { normalizeTurns } from '@/edcm/engine';
import type { ConversationTurn } from '../../../../shared/edcm-types';

interface ClipboardCapture {
  id: string;
  text: string;
  timestamp: Date;
  turns: ConversationTurn[];
  analyzed: boolean;
}

interface ClipboardListenerProps {
  onAnalyze?: (text: string, turns: ConversationTurn[]) => void;
}

export function ClipboardListener({ onAnalyze }: ClipboardListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const [captures, setCaptures] = useState<ClipboardCapture[]>([]);
  const [lastClipboard, setLastClipboard] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkClipboard = useCallback(async () => {
    if (!isListening) return;
    
    try {
      const text = await navigator.clipboard.readText();
      if (text && text !== lastClipboard && text.trim().length > 10) {
        setLastClipboard(text);
        
        const turns = normalizeTurns({ text });
        
        const capture: ClipboardCapture = {
          id: crypto.randomUUID(),
          text: text.slice(0, 2000),
          timestamp: new Date(),
          turns,
          analyzed: false,
        };
        
        setCaptures(prev => [capture, ...prev].slice(0, 50));
      }
    } catch (err) {
      console.log('Clipboard access denied or empty');
    }
  }, [isListening, lastClipboard]);

  useEffect(() => {
    if (!isListening) return;
    
    const interval = setInterval(checkClipboard, 2000);
    return () => clearInterval(interval);
  }, [isListening, checkClipboard]);

  const requestPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
      setHasPermission(result.state === 'granted');
      
      if (result.state === 'granted') {
        setIsListening(true);
      } else if (result.state === 'prompt') {
        await navigator.clipboard.readText();
        setHasPermission(true);
        setIsListening(true);
      }
    } catch (err) {
      try {
        await navigator.clipboard.readText();
        setHasPermission(true);
        setIsListening(true);
      } catch {
        setHasPermission(false);
      }
    }
  };

  const toggleListening = () => {
    if (!isListening && hasPermission === null) {
      requestPermission();
    } else {
      setIsListening(!isListening);
    }
  };

  const handleAnalyze = (capture: ClipboardCapture) => {
    setCaptures(prev => 
      prev.map(c => c.id === capture.id ? { ...c, analyzed: true } : c)
    );
    onAnalyze?.(capture.text, capture.turns);
  };

  const clearCaptures = () => {
    setCaptures([]);
  };

  return (
    <Card className="h-full" data-testid="clipboard-listener">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            Clipboard Listener
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isListening ? "default" : "secondary"} className="text-[10px]">
              {isListening ? "Active" : "Paused"}
            </Badge>
            <Switch
              checked={isListening}
              onCheckedChange={toggleListening}
              data-testid="switch-clipboard-listener"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Passively captures copied text for analysis. Local-only, no cloud sync.
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        {hasPermission === false && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive mb-3">
            <AlertCircle className="w-3 h-3" />
            Clipboard access denied. Enable in browser settings.
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {captures.length} capture{captures.length !== 1 ? 's' : ''}
          </span>
          {captures.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={clearCaptures}
              data-testid="button-clear-captures"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {captures.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {isListening 
                  ? "Listening... Copy text to capture it here."
                  : "Enable listener to start capturing clipboard."}
              </div>
            ) : (
              captures.map(capture => (
                <div
                  key={capture.id}
                  className="p-2 border rounded-lg text-xs group hover:bg-accent/50"
                  data-testid={`capture-${capture.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {capture.text.slice(0, 80)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <span>{capture.turns.length} turns detected</span>
                        <span>•</span>
                        <span>{capture.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {capture.analyzed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleAnalyze(capture)}
                          data-testid={`button-analyze-${capture.id}`}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground">
          hmm: Clipboard data stays local. User approval required before any analysis.
        </div>
      </CardContent>
    </Card>
  );
}
