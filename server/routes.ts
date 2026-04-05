import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema, insertAnalysisArtifactSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { processAssistantRequest, parseTextToTurns, analyzeEDCM } from "./edcm-assistant";
import type { AnalyticsIn } from "@shared/edcm-types";
import { toCanonicalConversation } from "@shared/canonical-schema";
import { searchMembers, getMemberDetails, getRecentBillsByMember } from "./congress-api";
import { searchPoliticalDocuments, getKeylessSourceInfo, searchFederalRegister } from "./political-ingest";
import { processNewsContent, getDistortionSummary } from "./news-ingest";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // =================== AUTH ROUTES (STUB) ===================
  // Minimal auth implementation - real auth would use bcrypt + JWT
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // In production, hash password with bcrypt
      const user = await storage.createUser(data);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/subscribe/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.updateUserSubscription(userId, true);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // =================== SESSION SYNC ROUTES ===================
  // Only used when user is subscribed and sync is enabled

  app.post("/api/sessions", async (req, res) => {
    try {
      const data = insertSessionSchema.parse(req.body);
      const session = await storage.saveSession(data);
      res.json({ session });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  app.get("/api/sessions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { mode } = req.query;
      
      const sessions = await storage.getUserSessions(
        userId, 
        mode as string | undefined
      );
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:userId/:sessionId", async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      const session = await storage.getSession(sessionId, userId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:userId/:sessionId", async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      const updates = req.body;
      
      const session = await storage.updateSession(sessionId, userId, updates);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:userId/:sessionId", async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      await storage.deleteSession(sessionId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // =================== AUDIO DISCERNMENT API ===================
  
  app.post("/api/audio/discern", upload.single("audio"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { processAudioDiscernment } = await import("./audio-discernment");
      
      const options = {
        diarize: req.body.diarize !== "false",
        language: req.body.language || "en",
        model: (req.body.model || "accurate") as "fast" | "accurate",
      };

      const result = await processAudioDiscernment(file.buffer, options);
      res.json(result);
    } catch (error: any) {
      console.error("Audio discernment error:", error);
      res.status(500).json({ error: "Audio analysis failed", details: error.message });
    }
  });

  // Streaming endpoints for live mode
  const streamSessions = new Map<string, { chunks: Buffer[]; startTime: number }>();

  app.post("/api/audio/stream/start", (req, res) => {
    const sessionId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    streamSessions.set(sessionId, { chunks: [], startTime: Date.now() });
    res.json({ session_id: sessionId, status: "started" });
  });

  app.post("/api/audio/stream/chunk", upload.single("chunk"), async (req, res) => {
    try {
      const { session_id } = req.body;
      const chunk = req.file;

      if (!session_id || !streamSessions.has(session_id)) {
        return res.status(400).json({ error: "Invalid session" });
      }

      if (!chunk) {
        return res.status(400).json({ error: "No audio chunk provided" });
      }

      const session = streamSessions.get(session_id)!;
      session.chunks.push(chunk.buffer);

      // Return partial analysis hint (VAD simulation)
      const chunkDuration = chunk.buffer.length / 16000;
      const speechDetected = chunk.buffer.length > 1000;

      res.json({
        type: "chunk_received",
        chunks_count: session.chunks.length,
        speech_detected: speechDetected,
        duration_estimate_ms: Math.round(chunkDuration * 1000),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/audio/stream/stop", async (req, res) => {
    try {
      const { session_id } = req.body;

      if (!session_id || !streamSessions.has(session_id)) {
        return res.status(400).json({ error: "Invalid session" });
      }

      const session = streamSessions.get(session_id)!;
      streamSessions.delete(session_id);

      if (session.chunks.length === 0) {
        return res.json({ error: "No audio recorded", hmm: true });
      }

      const combinedBuffer = Buffer.concat(session.chunks);
      const { processAudioDiscernment } = await import("./audio-discernment");
      const result = await processAudioDiscernment(combinedBuffer, { diarize: true });

      res.json(result);
    } catch (error: any) {
      console.error("Stream stop error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =================== EDCM CORE API ===================

  app.post("/api/edcm/analyze", async (req, res) => {
    try {
      const result = await analyzeEDCM(req.body);
      
      const canonical = toCanonicalConversation({
        messages: result.conversation_turns.map(t => ({
          speaker: t.speaker,
          text: t.text,
        })),
        source: "paste",
        domain: req.body.mode === "political" ? "political" : "relationship",
        tier: "free",
        consent: "explicit",
      });
      
      res.json({
        ...result,
        canonical,
      });
    } catch (err: any) {
      res.status(500).json({
        error: "EDCM_ANALYZE_FAILED",
        message: String(err?.message ?? err)
      });
    }
  });

  // =================== ANALYTICS COLLECTOR (privacy-guarded) ===================

  app.post("/api/analytics/collect", async (req, res) => {
    try {
      const body = req.body as AnalyticsIn;

      if (body.sync_mode === "off") {
        return res.status(400).json({ ok: false, error: "SYNC_DISABLED" });
      }

      const hasText = typeof body.event.raw_text === "string" && body.event.raw_text.length > 0;

      if (hasText && !body.allow_text_upload) {
        return res.status(400).json({ ok: false, error: "TEXT_UPLOAD_NOT_ALLOWED" });
      }

      if (body.sync_mode === "metrics_only" && hasText) {
        return res.status(400).json({ ok: false, error: "METRICS_ONLY_REJECTS_TEXT" });
      }

      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });

  // =================== POLITICAL INTELLIGENCE API ===================
  // Keyless-by-default: core features work without API keys

  app.get("/api/political/sources", (req, res) => {
    res.json(getKeylessSourceInfo());
  });

  app.get("/api/political/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Query too short" });
      }

      const apiKey = process.env.CONGRESS_API_KEY;
      
      const keylessResults = await searchPoliticalDocuments(query);
      
      let members: any[] = [];
      let enriched = false;
      
      if (apiKey) {
        try {
          members = await searchMembers(query, apiKey);
          enriched = true;
        } catch (e) {
          console.log("Congress API enrichment failed, using keyless sources");
        }
      }

      res.json({ 
        members,
        documents: keylessResults.federalRegister,
        votesSources: keylessResults.votesSummary,
        enriched,
        keylessMode: !apiKey,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/political/federal-register", async (req, res) => {
    try {
      const term = req.query.term as string;
      const agency = req.query.agency as string;
      
      const results = await searchFederalRegister({
        term,
        agencies: agency ? [agency] : undefined,
        perPage: 20,
      });
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/political/analyze-news", async (req, res) => {
    try {
      const { url, title, outlet, content, publishDate } = req.body;
      
      if (!content || content.length < 50) {
        return res.status(400).json({ error: "Content too short for analysis" });
      }

      const record = processNewsContent({
        url: url || "",
        title: title || "Untitled",
        outlet: outlet || "Unknown",
        content,
        publishDate,
      });
      
      const summary = getDistortionSummary(record);

      res.json({ 
        record,
        summary,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/political/member/:bioguideId", async (req, res) => {
    try {
      const { bioguideId } = req.params;
      const apiKey = process.env.CONGRESS_API_KEY;
      
      if (!apiKey) {
        return res.json({ 
          member: null,
          recentBills: [],
          keylessMode: true,
          hint: "Add CONGRESS_API_KEY for member details"
        });
      }

      const [details, bills] = await Promise.all([
        getMemberDetails(bioguideId, apiKey),
        getRecentBillsByMember(bioguideId, apiKey, 5),
      ]);

      res.json({ 
        member: details.member,
        recentBills: bills,
        keylessMode: false,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =================== EDCM ASSISTANT API ===================

  app.post("/api/edcm-assistant/parse", async (req, res) => {
    try {
      const schema = z.object({ text: z.string().min(1) });
      const { text } = schema.parse(req.body);
      const result = parseTextToTurns(text);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/edcm-assistant/artifacts", async (req, res) => {
    try {
      const data = insertAnalysisArtifactSchema.parse(req.body);
      const artifact = await storage.createAnalysisArtifact(data);
      res.status(201).json(artifact);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/edcm-assistant/artifacts", async (req, res) => {
    try {
      const artifacts = await storage.getAllAnalysisArtifacts();
      res.json(artifacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/edcm-assistant/artifacts/:id", async (req, res) => {
    try {
      const artifact = await storage.getAnalysisArtifact(req.params.id);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.json(artifact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/edcm-assistant/artifacts/:id", async (req, res) => {
    try {
      const artifact = await storage.updateAnalysisArtifact(req.params.id, req.body);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.json(artifact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/edcm-assistant/artifacts/:id", async (req, res) => {
    try {
      await storage.deleteAnalysisArtifact(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/edcm-assistant/process", async (req, res) => {
    try {
      const schema = z.object({
        mode: z.enum(["ingest", "analyze", "interpret", "compare", "report"]),
        message: z.string().min(1),
        artifact_id: z.string().optional(),
        compare_artifact_id: z.string().optional(),
        conversation_history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      });
      
      const { mode, message, artifact_id, compare_artifact_id, conversation_history } = schema.parse(req.body);

      const artifact = artifact_id ? await storage.getAnalysisArtifact(artifact_id) : undefined;
      const compareArtifact = compare_artifact_id ? await storage.getAnalysisArtifact(compare_artifact_id) : undefined;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "start", mode })}\n\n`);

      try {
        const result = await processAssistantRequest(
          mode,
          message,
          artifact as any,
          compareArtifact as any,
          conversation_history || []
        );

        if (result.structuredOutput) {
          res.write(`data: ${JSON.stringify({ type: "structured", data: result.structuredOutput })}\n\n`);
          
          if (artifact_id && result.structuredOutput.conversation_turns?.length) {
            await storage.updateAnalysisArtifact(artifact_id, {
              conversationTurns: result.structuredOutput.conversation_turns,
              qualityFlags: result.structuredOutput.quality_flags || [],
              hmmItems: [
                ...((artifact?.hmmItems as any[]) || []),
                ...(result.structuredOutput.hmm_items || []),
              ],
              edcmResult: result.structuredOutput.edcm_result || undefined,
              analysisComplete: !!result.structuredOutput.edcm_result,
            });
          }
        }

        res.write(`data: ${JSON.stringify({ type: "content", content: result.structuredOutput?.explanation || result.content })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      } catch (error: any) {
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
      }
      
      res.end();
    } catch (error: any) {
      console.error("EDCM Assistant error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  });

  return httpServer;
}
