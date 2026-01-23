import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Plus, Trash2, Bot, User, Loader2, FileText, 
  Upload, Play, BarChart3, GitCompare, FileDown,
  ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HmmmPanel } from '@/components/analysis/HmmmPanel';
import type { 
  AssistantMode, 
  AssistantOutput,
  HmmmItem,
} from '../../../shared/edcm-assistant-types';
import type { AnalysisArtifact } from '../../../shared/schema';

interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mode?: AssistantMode;
  structuredOutput?: AssistantOutput;
}

const modeConfig: Record<AssistantMode, { icon: typeof FileText; color: string; label: string; description: string }> = {
  ingest: { icon: Upload, color: 'text-blue-500', label: 'Ingest', description: 'Parse text into conversation turns' },
  analyze: { icon: Play, color: 'text-emerald-500', label: 'Analyze', description: 'Run EDCM pipeline' },
  interpret: { icon: BarChart3, color: 'text-violet-500', label: 'Interpret', description: 'Summarize patterns' },
  compare: { icon: GitCompare, color: 'text-amber-500', label: 'Compare', description: 'Compare artifacts' },
  report: { icon: FileDown, color: 'text-pink-500', label: 'Report', description: 'Generate brief' },
};

export default function Analysis() {
  const queryClient = useQueryClient();
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [compareArtifact, setCompareArtifact] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AssistantMode>('ingest');
  const [inputValue, setInputValue] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [allHmmmItems, setAllHmmmItems] = useState<HmmmItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: artifacts = [], isLoading: loadingArtifacts } = useQuery<AnalysisArtifact[]>({
    queryKey: ['/api/edcm-assistant/artifacts'],
    queryFn: async () => {
      const res = await fetch('/api/edcm-assistant/artifacts');
      if (!res.ok) throw new Error('Failed to fetch artifacts');
      return res.json();
    },
  });

  const createArtifact = useMutation({
    mutationFn: async (data: Partial<AnalysisArtifact>) => {
      const res = await fetch('/api/edcm-assistant/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create artifact');
      return res.json();
    },
    onSuccess: (artifact) => {
      queryClient.invalidateQueries({ queryKey: ['/api/edcm-assistant/artifacts'] });
      setSelectedArtifact(artifact.id);
    },
  });

  const deleteArtifact = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/edcm-assistant/artifacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/edcm-assistant/artifacts'] });
      if (selectedArtifact) setSelectedArtifact(null);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    const artifact = artifacts.find(a => a.id === selectedArtifact);
    if (artifact) {
      setAllHmmmItems((artifact.hmmItems as HmmmItem[]) || []);
    }
  }, [selectedArtifact, artifacts]);

  const handleIngestPaste = async () => {
    if (!pasteText.trim()) return;

    const res = await fetch('/api/edcm-assistant/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: pasteText }),
    });
    const parsed = await res.json();

    await createArtifact.mutateAsync({
      name: `Pasted ${new Date().toLocaleTimeString()}`,
      source: 'paste',
      conversationTurns: parsed.turns || [],
      rawText: pasteText,
      qualityFlags: [],
      hmmItems: parsed.hmm_items || [],
    });

    setAllHmmmItems(prev => [...prev, ...(parsed.hmm_items || [])]);
    setPasteText('');
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);
    setStreamingContent('');

    const newUserMessage: AssistantMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      mode: currentMode,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/edcm-assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: currentMode,
          message: userMessage,
          artifact_id: selectedArtifact,
          compare_artifact_id: currentMode === 'compare' ? compareArtifact : undefined,
          conversation_history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let structuredOutput: AssistantOutput | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content') {
                assistantContent = data.content;
                setStreamingContent(assistantContent);
              }
              if (data.type === 'structured') {
                structuredOutput = data.data;
                if (structuredOutput?.hmm_items) {
                  setAllHmmmItems(prev => [...prev, ...structuredOutput!.hmm_items]);
                }
              }
              if (data.type === 'done') {
                setMessages(prev => [...prev, {
                  id: Date.now(),
                  role: 'assistant',
                  content: assistantContent,
                  mode: currentMode,
                  structuredOutput,
                }]);
                setIsStreaming(false);
                setStreamingContent('');
                queryClient.invalidateQueries({ queryKey: ['/api/edcm-assistant/artifacts'] });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResolveHmmm = (id: string) => {
    setAllHmmmItems(prev => prev.map(item => 
      item.id === id ? { ...item, resolved: true } : item
    ));
  };

  const selectedArtifactData = artifacts.find(a => a.id === selectedArtifact);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModeHeader title="EDCM Analysis" subtitle="AI-Assisted Conversation Analysis" />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm mb-3">Artifacts</h3>
            <Tabs defaultValue="paste" className="w-full" data-testid="tabs-artifacts">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="paste" className="text-xs" data-testid="tab-paste">Paste</TabsTrigger>
                <TabsTrigger value="list" className="text-xs" data-testid="tab-list">List</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="mt-3">
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste conversation text here...&#10;&#10;Format: Speaker: message"
                  className="h-32 text-xs"
                  data-testid="textarea-paste"
                />
                <Button
                  onClick={handleIngestPaste}
                  disabled={!pasteText.trim() || createArtifact.isPending}
                  className="w-full mt-2"
                  size="sm"
                  data-testid="button-ingest"
                >
                  <Upload className="w-3 h-3 mr-2" />
                  Ingest Text
                </Button>
              </TabsContent>
              <TabsContent value="list" className="mt-3">
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {loadingArtifacts ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      </div>
                    ) : artifacts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No artifacts yet
                      </p>
                    ) : (
                      artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className={cn(
                            'group flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent text-xs',
                            selectedArtifact === artifact.id && 'bg-accent'
                          )}
                          onClick={() => setSelectedArtifact(artifact.id)}
                          data-testid={`artifact-item-${artifact.id}`}
                        >
                          <FileText className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{artifact.name}</span>
                          {artifact.analysisComplete && (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          )}
                          {(artifact.hmmItems as HmmmItem[] | null)?.some((h: HmmmItem) => !h.resolved) && (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArtifact.mutate(artifact.id);
                            }}
                            data-testid={`button-delete-artifact-${artifact.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-4 flex-1 overflow-auto">
            <h3 className="font-semibold text-sm mb-3">Hmm Items</h3>
            <HmmmPanel 
              items={allHmmmItems} 
              onResolve={handleResolveHmmm}
            />
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border bg-card/30">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-2">Mode:</span>
              {(Object.keys(modeConfig) as AssistantMode[]).map((mode) => {
                const config = modeConfig[mode];
                const Icon = config.icon;
                return (
                  <Button
                    key={mode}
                    variant={currentMode === mode ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCurrentMode(mode)}
                    disabled={mode === 'compare' && !selectedArtifact}
                    data-testid={`button-mode-${mode}`}
                  >
                    <Icon className={cn('w-3 h-3 mr-1', currentMode !== mode && config.color)} />
                    {config.label}
                  </Button>
                );
              })}
              {currentMode === 'compare' && (
                <select
                  value={compareArtifact || ''}
                  onChange={(e) => setCompareArtifact(e.target.value || null)}
                  className="ml-2 h-7 text-xs bg-background border rounded px-2"
                  data-testid="select-compare-artifact"
                >
                  <option value="">Select artifact to compare</option>
                  {artifacts.filter(a => a.id !== selectedArtifact).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>
            {selectedArtifactData && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>Working on: <strong>{selectedArtifactData.name}</strong></span>
                <Badge variant="outline" className="text-[10px]">
                  {(selectedArtifactData.conversationTurns as any[] | null)?.length || 0} turns
                </Badge>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && !isStreaming ? (
                <div className="text-center py-16">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-lg font-semibold mb-2">EDCM Analysis Assistant</h2>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    I analyze conversation structure without inferring intent or emotion.
                    Paste a conversation or select an artifact to begin.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. <strong>Ingest</strong> - Paste or upload text</p>
                    <p>2. <strong>Analyze</strong> - Run structural analysis</p>
                    <p>3. <strong>Interpret</strong> - Get pattern summary</p>
                    <p>4. <strong>Report</strong> - Export findings</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    data-testid={`message-${msg.role}-${idx}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <Card className={cn(
                      'max-w-[80%]',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
                    )}>
                      <CardContent className="p-3">
                        {msg.mode && (
                          <Badge variant="outline" className="mb-2 text-[10px]">
                            {modeConfig[msg.mode].label}
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.structuredOutput?.report && (
                          <div className="mt-3 pt-3 border-t text-xs space-y-2">
                            <p className="font-semibold">{msg.structuredOutput.report.title}</p>
                            <p className="text-muted-foreground">{msg.structuredOutput.report.summary}</p>
                          </div>
                        )}
                        {msg.structuredOutput?.data_sources && msg.structuredOutput.data_sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                            <span className="font-medium">Data sources:</span> {msg.structuredOutput.data_sources.join(', ')}
                          </div>
                        )}
                        {msg.structuredOutput?.inferences && msg.structuredOutput.inferences.length > 0 && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            <span className="font-medium">Inferences:</span> {msg.structuredOutput.inferences.join('; ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isStreaming && streamingContent && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <Card className="max-w-[80%] bg-card">
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-background">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the assistant (${modeConfig[currentMode].description})...`}
                disabled={isStreaming}
                className="flex-1"
                data-testid="input-assistant-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isStreaming}
                data-testid="button-send-assistant"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
