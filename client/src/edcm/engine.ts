import type {
  Mode,
  ConversationTurn,
  EDCMRequestBody,
  EDCMResult as NewEDCMResult,
  QualityFlag,
  HmmItem
} from "../../../shared/edcm-types";
import type { EDCMResult, AnalysisOptions } from "./types";

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function makeId(prefix = "hmmm") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeTurns(body: EDCMRequestBody): ConversationTurn[] {
  if (Array.isArray(body.turns) && body.turns.length) return body.turns;

  const raw = (body.text ?? "").trim();
  if (!raw) return [];

  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const turns: ConversationTurn[] = [];

  for (const line of lines) {
    const m = line.match(/^([ABC]):\s*(.+)$/i);
    if (m) turns.push({ speaker: m[1].toUpperCase() as any, text: m[2] });
    else turns.push({ speaker: "unknown", text: line });
  }
  return turns;
}

function heuristicMetrics(turns: ConversationTurn[]) {
  const all = turns.map(t => t.text.toLowerCase()).join(" ");
  const refusal = (all.match(/\b(cannot|can't|won't|refuse|not allowed|impossible|no way)\b/g) || []).length;
  const escalation = (all.match(/\b(must|always|never|unacceptable|no choice)\b/g) || []).length;
  const deflection = (all.match(/\b(anyway|whatever|change the subject|irrelevant|doesn't matter)\b/g) || []).length;
  const uncertainty = (all.match(/\b(maybe|not sure|i think|possibly|unclear|seems)\b/g) || []).length;

  const R = clamp01(refusal / 10);
  const E = clamp01(escalation / 16);
  const D = clamp01(deflection / 8);
  const N = clamp01(uncertainty / 22);
  const C = clamp01(R * 0.35 + D * 0.25 + N * 0.25 + E * 0.15);

  return {
    constraint_strain_C: C,
    refusal_density_R: R,
    deflection_D: D,
    noise_N: N,
    escalation_E: E,
    progress_vector: { decisions: 0, commitments: 0, artifacts: 0, followthrough_score: 0 }
  };
}

/**
 * Focus-Locked EDCM analysis.
 * - instrument-only
 * - no advice
 * - no intent inference
 * - schema-first output
 */
function pseudoRandom(seed: string) {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = (value << 5) - value + seed.charCodeAt(i);
    value |= 0;
  }
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function analyzeText(text: string, options: AnalysisOptions): EDCMResult {
  const rng = pseudoRandom(text + options.mode);
  
  const lengthScore = Math.min(1, text.length / 500);
  let urgency = /asap|now|urgent|immediately|need/i.test(text) ? 0.8 : 0.2;
  let refusal = /no|cannot|won't|stop|don't/i.test(text) ? 0.6 : 0.1;
  const confusion = /what|huh|mean|clarify/i.test(text) ? 0.5 : 0.1;

  if (options.audioFeatures) {
    const { speechRate, pauseDensity, volumeVariance } = options.audioFeatures;
    if (speechRate > 150) urgency += 0.3;
    if (pauseDensity < 0.2) urgency += 0.2;
    if (volumeVariance > 0.6) refusal += 0.1;
  }

  const r = (min: number, max: number) => min + rng() * (max - min);

  return {
    metrics: {
      C: r(0.1, 0.4) + (lengthScore * 0.2),
      R: r(0, 0.2) + refusal,
      D: r(0, 0.3),
      N: r(0, 0.2),
      L: r(0, 0.3) + (confusion * 0.5),
      O: r(0.3, 0.8),
      F: r(0, 0.4),
      E: r(0, 0.3) + urgency,
      I: r(0, 0.2)
    },
    modifiers: {
      urgency: urgency,
      sentiment: r(-0.5, 0.5),
      drift: r(0, 0.3),
      filler: r(0, 0.2)
    },
    trends: {
      dC: r(-0.1, 0.2),
      dR: r(-0.05, 0.1),
      dD: r(-0.1, 0.1),
      dN: r(-0.05, 0.05),
      dL: r(0, 0.1),
      dO: r(-0.1, 0.1),
      dF: r(0, 0.1),
      dE: r(-0.1, 0.2),
      dI: r(0, 0.1)
    },
    progress: {
      decisions: Math.floor(r(0, 5)),
      commitments: Math.floor(r(0, 3)),
      artifacts: Math.floor(r(0, 2)),
      followthrough: r(0, 1),
      vector: r(0, 1)
    },
    annotations: {
      keySpans: []
    }
  };
}

export async function analyzeEDCM(body: EDCMRequestBody): Promise<NewEDCMResult> {
  const mode: Mode = body.mode ?? "general";
  const enable = body.enable_analysis !== false;

  const turns = normalizeTurns(body);

  const metrics = heuristicMetrics(turns);
  const quality_flags: QualityFlag[] = [];
  const hmmm_items: HmmItem[] = [];

  if (!enable) {
    return {
      mode,
      conversation_turns: turns,
      metrics,
      quality_flags: ["LOW_CONFIDENCE_PARSE"],
      hmmm_items: [{
        id: makeId(),
        issue: "Analysis disabled; cannot compute EDCM metrics.",
        evidence: [],
        suggested_fix: ["Set enable_analysis=true."],
        severity: "medium",
        tags: ["ANALYSIS_DISABLED"]
      }],
      edcm_summary: "Analysis is disabled. Enable analysis and provide dialogue turns to compute EDCM metrics.",
      fix_actions: ["Enable analysis", "Provide 6–12 turns", "Use A:/B: speaker tags"],
      edcm_result: null
    };
  }

  if (turns.length === 0) {
    quality_flags.push("INSUFFICIENT_CONTEXT");
    hmmm_items.push({
      id: makeId(),
      issue: "Missing conversation input.",
      evidence: [],
      suggested_fix: [
        "Provide text or turns[]",
        "Use one utterance per line with A:/B: speaker tags",
        "Provide 6–12 turns for stability"
      ],
      severity: "high",
      tags: ["MISSING_INPUT"]
    });
  }

  const hasUnknown = turns.some(t => t.speaker === "unknown");
  if (hasUnknown) {
    quality_flags.push("MISSING_SPEAKER_TAGS");
    hmmm_items.push({
      id: makeId(),
      issue: "Speaker tags missing or ambiguous; attribution confidence is reduced.",
      evidence: turns.slice(0, 4).map(t => t.text),
      suggested_fix: [
        "Prefix each line with A:, B:, (optional C:)",
        "Keep one utterance per line",
        "Include ~10 lines before/after the key moment"
      ],
      severity: "medium",
      tags: ["SPEAKER_TAGS"]
    });
  }

  if (turns.length > 0 && turns.length < 3) quality_flags.push("OVER_SHORT_SAMPLE");

  const edcm_summary =
    turns.length === 0
      ? "No dialogue provided; EDCM requires conversation turns to measure constraint dynamics."
      : "EDCM produced instrument-only metrics. Values describe observable pattern measurements (not intent, diagnosis, or truth claims). Increase turn count and add speaker tags for higher-confidence attribution.";

  const fix_actions =
    turns.length === 0
      ? ["Paste a conversation excerpt", "Use speaker tags (A:/B:)", "Provide 6–12 turns"]
      : ["Provide 6–12 turns for stability", "Use consistent speaker tags (A:, B:, C:)", "Include context around any spike (10 lines before/after)"];

  return {
    mode,
    conversation_turns: turns,
    metrics,
    quality_flags,
    hmmm_items,
    edcm_summary,
    fix_actions,
    edcm_result: { version: "edcm-app-v0", metrics }
  };
}
