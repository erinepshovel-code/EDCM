import OpenAI from "openai";
import type { 
  AssistantMode, 
  AssistantOutput, 
  AssistantRequest, 
  HmmmItem, 
  AnalysisArtifact 
} from "../shared/edcm-assistant-types";
import type { ConversationTurn } from "../shared/audio-types";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are the EDCM Analysis Assistant, a specialized tool for analyzing conversation dynamics. 

CRITICAL CONSTRAINTS:
1. You analyze STRUCTURAL patterns only: pacing, turn-taking, pressure, clarity, balance
2. You NEVER infer emotions, intent, or make diagnostic claims about people
3. You describe OBSERVABLE patterns, not hidden motives
4. You always acknowledge uncertainty and data sources
5. Safety Notes describe "patterns that can precede harm" NOT "dangerous person detection"

When ingesting conversations:
- Parse text into conversation_turns with speaker, start_ms, end_ms, text
- Identify quality issues and create hmm_items for uncertainty
- Flag any parsing assumptions

When analyzing:
- Run structural analysis only
- Report metrics without interpretation of character
- Note what is directly observed vs inferred

When interpreting:
- Describe patterns, not personality
- Use hedging language: "The pattern suggests..." not "This person is..."
- Always list data sources and inferences separately

OUTPUT FORMAT:
Your responses MUST be valid JSON matching this structure:
{
  "mode": "ingest|analyze|interpret|compare|report",
  "conversation_turns": [...],
  "quality_flags": [...],
  "hmm_items": [{
    "id": "unique-id",
    "category": "assumption|uncertainty|quality_flag|next_action",
    "severity": "low|med|high",
    "message": "description",
    "source": "what triggered this",
    "suggested_fix": "how to resolve",
    "resolved": false
  }],
  "edcm_result": null,
  "interpretation": "optional text",
  "comparison": { "summary": "...", "deltas": [...] },
  "report": { "title": "...", "summary": "...", "key_findings": [...], "risk_points": [...], "recommendations": [...] },
  "explanation": "human-readable explanation of what was done",
  "data_sources": ["list of what data was used"],
  "inferences": ["list of what was inferred, with confidence notes"]
}`;

function generateId(): string {
  return `hmm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function processAssistantRequest(
  mode: AssistantMode,
  userMessage: string,
  artifact?: AnalysisArtifact,
  compareArtifact?: AnalysisArtifact,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ content: string; structuredOutput?: AssistantOutput }> {
  
  const modePrompts: Record<AssistantMode, string> = {
    ingest: `INGEST MODE: Parse the provided text into structured conversation_turns. 
Identify speakers, estimate timing, flag any uncertainties. 
Create hmm_items for: ambiguous speaker attribution, unclear turn boundaries, missing context.
If text is not a conversation, note that as a quality_flag.`,
    
    analyze: `ANALYZE MODE: The artifact contains conversation_turns that need structural analysis.
Note: EDCM pipeline is currently a stub - acknowledge this.
Describe what structural metrics WOULD be analyzed: pacing, turn-taking balance, pressure indicators.
Create hmm_items for any quality issues that would affect analysis.`,
    
    interpret: `INTERPRET MODE: Summarize the structural patterns observed.
DO NOT make claims about intent or personality.
Highlight observable patterns like: uneven turn-taking, rapid escalation in pace, avoidance patterns.
Propose concrete next actions for the user.
Always separate observations from inferences.`,
    
    compare: `COMPARE MODE: Compare the two provided artifacts structurally.
Highlight differences in: speaker balance, pacing, turn length, pressure indicators.
Explain what deltas might indicate structurally (not psychologically).
Create hmm_items for any comparison limitations.`,
    
    report: `REPORT MODE: Generate a structured analysis brief.
Include: title, summary, key_findings, risk_points (observable patterns), recommendations.
Keep language structural and non-diagnostic.
Note all data sources and inference confidence.`,
  };

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT + "\n\n" + modePrompts[mode] },
  ];

  for (const msg of conversationHistory.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  let contextInfo = "";
  if (artifact) {
    contextInfo += `\n\nCURRENT ARTIFACT:\nID: ${artifact.id}\nName: ${artifact.name}\nTurns: ${JSON.stringify(artifact.conversation_turns)}\nQuality Flags: ${artifact.quality_flags.join(", ")}\nHMM Items: ${JSON.stringify(artifact.hmm_items)}`;
    if (artifact.edcm_result) {
      contextInfo += `\nEDCM Result: ${JSON.stringify(artifact.edcm_result)}`;
    }
  }
  if (compareArtifact && mode === "compare") {
    contextInfo += `\n\nCOMPARISON ARTIFACT:\nID: ${compareArtifact.id}\nName: ${compareArtifact.name}\nTurns: ${JSON.stringify(compareArtifact.conversation_turns)}`;
  }

  messages.push({ role: "user", content: userMessage + contextInfo });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    
    let structuredOutput: AssistantOutput | undefined;
    try {
      const parsed = JSON.parse(content);
      structuredOutput = {
        mode: parsed.mode || mode,
        conversation_turns: parsed.conversation_turns || [],
        quality_flags: parsed.quality_flags || [],
        hmm_items: (parsed.hmm_items || []).map((item: any) => ({
          ...item,
          id: item.id || generateId(),
          resolved: item.resolved || false,
        })),
        edcm_result: parsed.edcm_result || null,
        interpretation: parsed.interpretation,
        comparison: parsed.comparison,
        report: parsed.report,
        explanation: parsed.explanation || "Analysis complete.",
        data_sources: parsed.data_sources || [],
        inferences: parsed.inferences || [],
      };
    } catch (e) {
      structuredOutput = {
        mode,
        hmm_items: [{
          id: generateId(),
          category: "uncertainty",
          severity: "med",
          message: "Response parsing failed - showing raw output",
          source: "assistant",
          resolved: false,
        }],
        explanation: content,
        data_sources: [],
        inferences: [],
      };
    }

    return { content, structuredOutput };
  } catch (error: any) {
    console.error("EDCM Assistant error:", error);
    throw new Error(`Assistant processing failed: ${error.message}`);
  }
}

export function parseTextToTurns(text: string): { turns: ConversationTurn[]; hmm_items: HmmmItem[] } {
  const lines = text.split(/\n+/).filter(l => l.trim());
  const turns: ConversationTurn[] = [];
  const hmm_items: HmmmItem[] = [];
  
  const speakerPattern = /^([A-Za-z0-9_\s]+):\s*(.+)$/;
  let currentMs = 0;
  const avgTurnDuration = 5000;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(speakerPattern);
    
    if (match) {
      const [, speaker, text] = match;
      turns.push({
        speaker: speaker.trim(),
        start_ms: currentMs,
        end_ms: currentMs + avgTurnDuration,
        text: text.trim(),
      });
      currentMs += avgTurnDuration;
    } else {
      if (turns.length > 0) {
        turns[turns.length - 1].text += " " + line;
      } else {
        hmm_items.push({
          id: generateId(),
          category: "uncertainty",
          severity: "med",
          message: `Line ${i + 1} has no speaker attribution`,
          source: "parser",
          suggested_fix: "Add speaker prefix like 'Speaker A: ...'",
          resolved: false,
        });
        turns.push({
          speaker: "Unknown",
          start_ms: currentMs,
          end_ms: currentMs + avgTurnDuration,
          text: line,
        });
        currentMs += avgTurnDuration;
      }
    }
  }

  if (turns.length === 0) {
    hmm_items.push({
      id: generateId(),
      category: "quality_flag",
      severity: "high",
      message: "No conversation turns could be parsed",
      source: "parser",
      suggested_fix: "Format text as 'Speaker: message' on each line",
      resolved: false,
    });
  }

  const speakers = new Set(turns.map(t => t.speaker));
  if (speakers.size === 1 && speakers.has("Unknown")) {
    hmm_items.push({
      id: generateId(),
      category: "assumption",
      severity: "med",
      message: "All turns assigned to 'Unknown' speaker",
      source: "parser",
      suggested_fix: "Manually rename speakers in the editor",
      resolved: false,
    });
  }

  return { turns, hmm_items };
}
