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
  bioguideId?: string;
  name: string;
  party?: string;
  state?: string;
  chamber?: string;
  lastAnalysis?: Date;
  consistencyScore?: number;
}

interface CongressMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
}

interface RhetoricSample {
  id: string;
  source: string;
  date: string;
  text: string;
  type: 'speech' | 'interview' | 'post' | 'vote';
}

interface PoliticalDocument {
  id: string;
  title: string;
  type: string;
  source: string;
  date: string;
  url: string;
  abstract?: string;
  agencies?: string[];
}

export default function Political() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CongressMember[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<PoliticalFigure | null>(null);
  const [samples, setSamples] = useState<RhetoricSample[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<EDCMResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<PoliticalDocument[]>([]);
  const [keylessMode, setKeylessMode] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setIsSearching(true);
    setApiError(null);
    setSearchResults([]);
    setDocuments([]);
    
    try {
      const res = await fetch(`/api/political/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (!res.ok) {
        setApiError(data.error);
      } else {
        setSearchResults(data.members || []);
        setDocuments(data.documents || []);
        setKeylessMode(data.keylessMode);
        
        if ((data.members?.length === 0) && (data.documents?.length === 0)) {
          setSelectedFigure({
            id: crypto.randomUUID(),
            name: searchQuery.trim(),
          });
        }
      }
    } catch (err) {
      setSelectedFigure({
        id: crypto.randomUUID(),
        name: searchQuery.trim(),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const loadDocumentForAnalysis = async (doc: PoliticalDocument) => {
    const content = [
      doc.title,
      '',
      doc.abstract || '',
      '',
      `Source: ${doc.url}`,
      `Date: ${doc.date}`,
      doc.agencies?.length ? `Agencies: ${doc.agencies.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    
    setPasteText(content);
    setDocuments([]);
    setSelectedFigure({
      id: doc.id,
      name: doc.title.slice(0, 50) + (doc.title.length > 50 ? '...' : ''),
    });
  };

  const selectMember = (member: CongressMember) => {
    setSelectedFigure({
      id: member.bioguideId,
      bioguideId: member.bioguideId,
      name: member.name,
      party: member.party,
      state: member.state,
      chamber: member.chamber,
    });
    setSearchResults([]);
    setSearchQuery('');
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
                  Search U.S. Congress members or paste any political figure's statements.
                </p>

                {apiError && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-600">
                    {apiError}
                  </div>
                )}

                {isSearching && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-600">
                    Searching Federal Register...
                  </div>
                )}

                {!isSearching && keylessMode && documents.length === 0 && searchResults.length === 0 && !selectedFigure && (
                  <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-600">
                    Keyless mode: Search any topic to find Federal Register documents
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <div className="text-[10px] text-muted-foreground px-2 py-1 bg-muted">Congress Members</div>
                    {searchResults.map(member => (
                      <button
                        key={member.bioguideId}
                        onClick={() => selectMember(member)}
                        className="w-full p-2 text-left hover:bg-accent text-xs border-b last:border-b-0 flex items-center justify-between"
                        data-testid={`member-${member.bioguideId}`}
                      >
                        <span className="font-medium">{member.name}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{member.party}</Badge>
                          <span>{member.state}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="mt-3 border-2 border-emerald-500/30 rounded-lg overflow-hidden bg-emerald-500/5">
                    <div className="text-xs font-medium text-emerald-700 px-2 py-2 bg-emerald-500/10 flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Federal Register ({documents.length} found)
                    </div>
                    {documents.slice(0, 5).map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => loadDocumentForAnalysis(doc)}
                        className="w-full p-3 text-left hover:bg-emerald-500/10 text-xs border-b border-emerald-500/20 last:border-b-0"
                        data-testid={`doc-${doc.id}`}
                      >
                        <div className="font-medium line-clamp-2">{doc.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                          <span>{doc.date}</span>
                          {doc.agencies?.[0] && <span className="truncate">• {doc.agencies[0]}</span>}
                        </div>
                      </button>
                    ))}
                    <div className="text-[10px] text-center py-1 text-muted-foreground">
                      Click a document to load for analysis
                    </div>
                  </div>
                )}

                {selectedFigure && (
                  <div className="mt-4 p-3 border rounded-lg bg-accent/30">
                    <div className="font-medium">{selectedFigure.name}</div>
                    {selectedFigure.party && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{selectedFigure.party}</Badge>
                        {selectedFigure.state && <span>{selectedFigure.state}</span>}
                        {selectedFigure.chamber && <span>• {selectedFigure.chamber}</span>}
                      </div>
                    )}
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
