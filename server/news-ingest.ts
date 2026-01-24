/**
 * EDCM News Ingest Module
 * News as Verbatim Carrier + Narrative Distortion Sensor
 * 
 * EDCM separates:
 * - What was said (primary truth)
 * - How it was framed (media narrative)
 */

import type { 
  NewsRecord, 
  ExtractedQuote, 
  DistortionAnalysis, 
  DistortionFlag,
  ContentRole,
  NewsSourceType
} from "@shared/news-types";
import { classifyNewsSource, computeDistortionScore } from "@shared/news-types";

const QUOTE_PATTERNS = [
  /[""]([^""]+)[""]\s*(?:,?\s*(?:said|says|stated|declared|announced|claimed|argued|explained|added|noted|remarked)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))/g,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|says|stated|declared|announced|claimed|argued|explained|added|noted|remarked)[,:]?\s*[""]([^""]+)[""]/g,
];

const EDITORIAL_MARKERS = [
  "sources say", "reportedly", "allegedly", "according to sources",
  "it is believed", "critics argue", "some say", "many believe",
  "appears to", "seems to", "suggests that", "implies that",
];

const EMOTIONAL_MARKERS = [
  "shocking", "outrageous", "stunning", "explosive", "bombshell",
  "slams", "blasts", "destroys", "eviscerates", "torches",
  "controversial", "divisive", "polarizing",
];

export function extractQuotes(text: string): ExtractedQuote[] {
  const quotes: ExtractedQuote[] = [];
  const seen = new Set<string>();
  
  const pattern1 = /[""]([^""]{10,})[""]\s*(?:,?\s*(?:said|says|stated|declared|announced|claimed|argued|explained|added|noted|remarked)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))/g;
  let match;
  
  while ((match = pattern1.exec(text)) !== null) {
    const [fullMatch, quoteText, speaker] = match;
    const key = quoteText.slice(0, 50);
    
    if (!seen.has(key)) {
      seen.add(key);
      const startIdx = Math.max(0, match.index - 100);
      const endIdx = Math.min(text.length, match.index + fullMatch.length + 100);
      
      quotes.push({
        id: `quote_${quotes.length + 1}`,
        speaker: speaker || "Unknown",
        text: quoteText,
        context_before: text.slice(startIdx, match.index).trim(),
        context_after: text.slice(match.index + fullMatch.length, endIdx).trim(),
        is_truncated: quoteText.endsWith("...") || quoteText.startsWith("..."),
        confidence: speaker ? 0.8 : 0.5,
      });
    }
  }
  
  const pattern2 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|says|stated|declared|announced|claimed|argued|explained|added|noted|remarked)[,:]?\s*[""]([^""]{10,})[""]/g;
  
  while ((match = pattern2.exec(text)) !== null) {
    const [fullMatch, speaker, quoteText] = match;
    const key = quoteText.slice(0, 50);
    
    if (!seen.has(key)) {
      seen.add(key);
      const startIdx = Math.max(0, match.index - 100);
      const endIdx = Math.min(text.length, match.index + fullMatch.length + 100);
      
      quotes.push({
        id: `quote_${quotes.length + 1}`,
        speaker: speaker || "Unknown",
        text: quoteText,
        context_before: text.slice(startIdx, match.index).trim(),
        context_after: text.slice(match.index + fullMatch.length, endIdx).trim(),
        is_truncated: quoteText.endsWith("...") || quoteText.startsWith("..."),
        confidence: 0.8,
      });
    }
  }
  
  return quotes;
}

export function detectEditorialMarkers(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const marker of EDITORIAL_MARKERS) {
    if (lowerText.includes(marker)) {
      found.push(marker);
    }
  }
  
  return found;
}

export function detectEmotionalLoading(text: string): { score: number; markers: string[] } {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const marker of EMOTIONAL_MARKERS) {
    if (lowerText.includes(marker)) {
      found.push(marker);
    }
  }
  
  const score = Math.min(1, found.length / 5);
  return { score, markers: found };
}

export function analyzeHeadline(headline: string): { spin_score: number; flags: DistortionFlag[] } {
  const flags: DistortionFlag[] = [];
  let spinScore = 0;
  
  const emotional = detectEmotionalLoading(headline);
  if (emotional.score > 0) {
    spinScore += emotional.score * 0.4;
    flags.push({
      type: "emotional_loading",
      severity: emotional.score > 0.5 ? "high" : "medium",
      evidence: `Emotional markers: ${emotional.markers.join(", ")}`,
      location: "headline",
    });
  }
  
  if (headline.includes("!") || headline === headline.toUpperCase()) {
    spinScore += 0.2;
    flags.push({
      type: "sensationalization",
      severity: "medium",
      evidence: "Exclamation or all-caps headline",
      location: "headline",
    });
  }
  
  const partisanTerms = ["left-wing", "right-wing", "liberal", "conservative", "radical", "extremist"];
  for (const term of partisanTerms) {
    if (headline.toLowerCase().includes(term)) {
      spinScore += 0.15;
      flags.push({
        type: "partisan_framing",
        severity: "medium",
        evidence: `Partisan term: ${term}`,
        location: "headline",
      });
      break;
    }
  }
  
  return { spin_score: Math.min(1, spinScore), flags };
}

export function analyzeQuoteIntegrity(quotes: ExtractedQuote[]): number {
  if (quotes.length === 0) return 1;
  
  let integritySum = 0;
  
  for (const quote of quotes) {
    let quoteIntegrity = 1;
    
    if (quote.is_truncated) {
      quoteIntegrity -= 0.3;
    }
    
    if (!quote.context_before && !quote.context_after) {
      quoteIntegrity -= 0.2;
    }
    
    if (quote.text.length < 20) {
      quoteIntegrity -= 0.1;
    }
    
    integritySum += Math.max(0, quoteIntegrity);
  }
  
  return integritySum / quotes.length;
}

export function processNewsContent(params: {
  url: string;
  title: string;
  outlet: string;
  content: string;
  publishDate?: string;
}): NewsRecord {
  const quotes = extractQuotes(params.content);
  const editorialMarkers = detectEditorialMarkers(params.content);
  const emotional = detectEmotionalLoading(params.content);
  const headlineAnalysis = analyzeHeadline(params.title);
  
  const hasTranscript = params.content.toLowerCase().includes("transcript") || 
                        params.content.includes("Q:") && params.content.includes("A:");
  const hasVideo = params.content.toLowerCase().includes("video") || 
                   params.content.toLowerCase().includes("watch:");
  
  const classification = classifyNewsSource({
    hasTranscript,
    hasVerbatimQuotes: quotes.length >= 3,
    hasVideo,
    hasEditorialFraming: editorialMarkers.length > 2,
    hasAnonymousSources: editorialMarkers.includes("sources say") || 
                         editorialMarkers.includes("according to sources"),
    quoteCount: quotes.length,
  });
  
  const quoteIntegrity = analyzeQuoteIntegrity(quotes);
  
  const distortion: DistortionAnalysis = {
    quote_integrity_score: quoteIntegrity,
    interview_distortion_index: 0,
    headline_spin_score: headlineAnalysis.spin_score,
    coverage_selectivity_bias: 0,
    narrative_reality_divergence: 0,
    flags: headlineAnalysis.flags,
  };
  
  const distortionScore = computeDistortionScore(distortion);
  
  const primarySpeaker = quotes.length > 0 
    ? quotes.reduce((acc, q) => {
        acc[q.speaker] = (acc[q.speaker] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  
  const topSpeaker = Object.entries(primarySpeaker)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "Unknown";
  
  return {
    id: `news_${Date.now()}`,
    url: params.url,
    title: params.title,
    outlet: params.outlet,
    publishDate: params.publishDate || new Date().toISOString(),
    content_role: classification.role,
    source_type: hasTranscript ? "transcript" : quotes.length > 0 ? "verbatim_quote" : "summary",
    speaker: topSpeaker,
    carrier: params.outlet,
    verbatim_text: quotes.map(q => q.text).join("\n\n"),
    narrative_text: params.content,
    distortion_score: distortionScore,
    extracted_quotes: quotes,
    metadata: {
      has_transcript: hasTranscript,
      has_video: hasVideo,
      has_audio: false,
      quote_count: quotes.length,
      anonymous_source_count: editorialMarkers.filter(m => 
        m.includes("sources") || m.includes("reportedly")
      ).length,
      editorial_markers: editorialMarkers,
    },
  };
}

export function getDistortionSummary(record: NewsRecord): string {
  if (record.content_role === "primary_speech") {
    return `Primary source: ${record.extracted_quotes.length} verbatim quotes from ${record.speaker}. Carrier: ${record.carrier}.`;
  }
  
  const distortionLevel = record.distortion_score < 0.3 ? "low" : 
                          record.distortion_score < 0.6 ? "moderate" : "high";
  
  return `Media narrative with ${distortionLevel} distortion (${(record.distortion_score * 100).toFixed(0)}%). ${record.metadata.editorial_markers.length} editorial markers detected.`;
}
