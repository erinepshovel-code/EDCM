export type ContentRole = "primary_speech" | "media_narrative";

export type NewsSourceType = 
  | "transcript"
  | "verbatim_quote"
  | "video_embed"
  | "press_conference"
  | "debate"
  | "interview"
  | "editorial"
  | "opinion"
  | "summary"
  | "unknown";

export interface NewsRecord {
  id: string;
  url: string;
  title: string;
  outlet: string;
  publishDate: string;
  content_role: ContentRole;
  source_type: NewsSourceType;
  speaker: string;
  carrier: string;
  verbatim_text?: string;
  narrative_text?: string;
  distortion_score: number;
  extracted_quotes: ExtractedQuote[];
  metadata: NewsMetadata;
}

export interface ExtractedQuote {
  id: string;
  speaker: string;
  text: string;
  context_before?: string;
  context_after?: string;
  is_truncated: boolean;
  confidence: number;
}

export interface NewsMetadata {
  has_transcript: boolean;
  has_video: boolean;
  has_audio: boolean;
  quote_count: number;
  anonymous_source_count: number;
  editorial_markers: string[];
}

export interface DistortionAnalysis {
  quote_integrity_score: number;
  interview_distortion_index: number;
  headline_spin_score: number;
  coverage_selectivity_bias: number;
  narrative_reality_divergence: number;
  flags: DistortionFlag[];
}

export interface DistortionFlag {
  type: "truncation" | "context_removal" | "meaning_shift" | "emotional_loading" | "partisan_framing" | "sensationalization" | "fact_omission";
  severity: "low" | "medium" | "high";
  evidence: string;
  location?: string;
}

export function classifyNewsSource(content: {
  hasTranscript?: boolean;
  hasVerbatimQuotes?: boolean;
  hasVideo?: boolean;
  hasEditorialFraming?: boolean;
  hasAnonymousSources?: boolean;
  quoteCount?: number;
}): { role: ContentRole; confidence: number } {
  const hasStrongPrimary = content.hasTranscript || content.hasVideo;
  const hasMultipleQuotes = (content.quoteCount || 0) >= 3;
  
  const secondarySignals = [
    content.hasEditorialFraming,
    content.hasAnonymousSources,
  ].filter(Boolean).length;

  if (hasStrongPrimary && secondarySignals === 0) {
    return { role: "primary_speech", confidence: 0.9 };
  } else if (hasStrongPrimary && hasMultipleQuotes && secondarySignals <= 1) {
    return { role: "primary_speech", confidence: 0.7 };
  } else {
    return { role: "media_narrative", confidence: 0.6 + (secondarySignals * 0.15) };
  }
}

export function computeDistortionScore(analysis: Partial<DistortionAnalysis>): number {
  let distortion = 0;
  let factors = 0;

  if (analysis.quote_integrity_score !== undefined) {
    distortion += (1 - analysis.quote_integrity_score) * 0.25;
    factors++;
  }
  
  if (analysis.headline_spin_score !== undefined) {
    distortion += analysis.headline_spin_score * 0.3;
    factors++;
  }
  
  if (analysis.interview_distortion_index !== undefined) {
    distortion += analysis.interview_distortion_index * 0.2;
    factors++;
  }
  
  if (analysis.coverage_selectivity_bias !== undefined) {
    distortion += analysis.coverage_selectivity_bias * 0.15;
    factors++;
  }
  
  if (analysis.narrative_reality_divergence !== undefined) {
    distortion += analysis.narrative_reality_divergence * 0.1;
    factors++;
  }

  return factors > 0 ? Math.min(1, distortion) : 0;
}
