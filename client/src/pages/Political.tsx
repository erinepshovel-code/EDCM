import { useState } from 'react';
import { ModeHeader } from '@/components/shared/ModeHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Play, AlertTriangle, TrendingUp, TrendingDown,
  FileText, BarChart3, Scale, MessageSquare
} from 'lucide-react';
import { analyzeEDCM } from '@/edcm/engine';
import type { EDCMResult } from '../../../shared/edcm-types';

interface PoliticalFigure {
  id: string;
  name: string;
  lastAnalysis?: Date;
  consistencyScore?: number;
}

interface RhetoricSample {
  id: string;
  source: string;
  date: string;
  text: string;
  type: 'speech' | 'interview' | 'post' | 'vote';
}

export default function Political() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFigure, setSelectedFigure] = useState<PoliticalFigure | null>(null);
  const [samples, setSamples] = useState<RhetoricSample[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<EDCMResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    setTimeout(() => {
      setSelectedFigure({
        id: crypto.randomUUID(),
        name: searchQuery.trim(),
        lastAnalysis: undefined,
        consistencyScore: undefined,
      });
      setIsSearching(false);
    }, 500);
  };

  const handleAnalyze = async () => {
    if (!pasteText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeEDCM({
        mode: 'political',
        text: pasteText,
        enable_analysis: true,
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMetricColor = (value: number) => {
    if (value < 0.3) return 'text-emerald-500';
    if (value < 0.6) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModeHeader 
        title="Political Intelligence" 
        subtitle="Rhetoric & Coherence Analysis (Tier 1 - Session Only)" 
      />

      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Political Figure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter figure name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    data-testid="input-political-search"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    size="sm"
                    data-testid="button-search-figure"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Free tier: Paste statements below for analysis. Automatic fetch coming soon.
                </p>

                {selectedFigure && (
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="font-medium">{selectedFigure.name}</div>
                    {selectedFigure.consistencyScore !== undefined && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span>Consistency:</span>
                        <Badge variant="outline">
                          {(selectedFigure.consistencyScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Detects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3 h-3 text-amber-500" />
                  <span>Consistency drift</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span>Rhetorical manipulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-3 h-3 text-blue-500" />
                  <span>Promise vs. action divergence</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 text-violet-500" />
                  <span>Ideological coherence</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Rhetoric Sample
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="paste">
                  <TabsList className="mb-3">
                    <TabsTrigger value="paste" data-testid="tab-paste-rhetoric">Paste</TabsTrigger>
                    <TabsTrigger value="samples" data-testid="tab-samples">Samples</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="paste">
                    <Textarea
                      placeholder="Paste speech, interview excerpt, or public statement...&#10;&#10;For best results, include 200+ words of continuous text."
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="h-40"
                      data-testid="textarea-rhetoric"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {pasteText.length} characters
                      </span>
                      <Button
                        onClick={handleAnalyze}
                        disabled={!pasteText.trim() || isAnalyzing}
                        data-testid="button-analyze-rhetoric"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Rhetoric'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="samples">
                    <ScrollArea className="h-40">
                      {samples.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No samples loaded. Paste text to analyze.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {samples.map(sample => (
                            <div key={sample.id} className="p-2 border rounded text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{sample.type}</Badge>
                                <span>{sample.date}</span>
                              </div>
                              <p className="mt-1 truncate">{sample.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card data-testid="card-analysis-result">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analysis Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                      { key: 'constraint_strain_C', label: 'C (Strain)' },
                      { key: 'refusal_density_R', label: 'R (Refusal)' },
                      { key: 'deflection_D', label: 'D (Deflection)' },
                      { key: 'noise_N', label: 'N (Noise)' },
                      { key: 'escalation_E', label: 'E (Escalation)' },
                    ].map(({ key, label }) => {
                      const value = (analysisResult.metrics as any)[key] ?? 0;
                      return (
                        <div key={key} className="text-center p-2 border rounded">
                          <div className={`text-lg font-bold ${getMetricColor(value)}`}>
                            {(value * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium mb-1">Summary</div>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.edcm_summary}
                      </p>
                    </div>

                    {analysisResult.quality_flags.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1">Quality Flags</div>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.quality_flags.map((flag, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.hmmm_items.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Hmm Items ({analysisResult.hmmm_items.length})
                        </div>
                        <div className="space-y-1">
                          {analysisResult.hmmm_items.slice(0, 3).map(item => (
                            <div key={item.id} className="text-xs p-2 bg-accent/50 rounded">
                              {item.issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t text-[10px] text-muted-foreground">
                    hmm: Political analysis is session-only. Upgrade for persistent archives.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
