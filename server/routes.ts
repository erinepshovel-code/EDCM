import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema, insertAnalysisArtifactSchema } from "@shared/schema";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { getGitHubUser, listUserRepos, createRepo, getRepo, getGitHubClient } from "./github";
import multer from "multer";
import { registerChatRoutes } from "./replit_integrations/chat";
import { processAssistantRequest, parseTextToTurns, analyzeEDCM } from "./edcm-assistant";
import type { AnalyticsIn } from "@shared/edcm-types";
import { toCanonicalConversation } from "@shared/canonical-schema";
import { searchMembers, getMemberDetails, getRecentBillsByMember } from "./congress-api";

const upload = multer({ storage: multer.memoryStorage() });

const execAsync = promisify(exec);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register AI Chat routes
  registerChatRoutes(app);
  
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

  // =================== GITHUB INTEGRATION ROUTES ===================

  app.get("/api/github/status", async (req, res) => {
    try {
      const user = await getGitHubUser();
      
      // Get current git status
      const { stdout: statusOutput } = await execAsync("git status --porcelain", { cwd: process.cwd() });
      const { stdout: branchOutput } = await execAsync("git branch --show-current", { cwd: process.cwd() });
      const { stdout: remoteOutput } = await execAsync("git remote -v", { cwd: process.cwd() });
      
      const uncommittedChanges = statusOutput.trim().split('\n').filter(Boolean).length;
      const currentBranch = branchOutput.trim();
      const hasGitHubRemote = remoteOutput.includes('github.com');
      
      // Parse remote URL if exists
      let remoteRepo = null;
      const githubMatch = remoteOutput.match(/github\.com[:/]([^/]+)\/([^.]+)\.git/);
      if (githubMatch) {
        remoteRepo = { owner: githubMatch[1], repo: githubMatch[2] };
      }

      res.json({
        connected: true,
        user: { login: user.login, avatar_url: user.avatar_url },
        git: {
          uncommittedChanges,
          currentBranch,
          hasGitHubRemote,
          remoteRepo
        }
      });
    } catch (error: any) {
      res.json({
        connected: false,
        error: error.message
      });
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    try {
      const repos = await listUserRepos();
      res.json({ repos: repos.map(r => ({ name: r.name, full_name: r.full_name, private: r.private, url: r.html_url })) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/github/connect-repo", async (req, res) => {
    try {
      const { owner, repo, createNew, isPrivate } = req.body;
      
      let repoData;
      if (createNew) {
        repoData = await createRepo(repo, isPrivate);
      } else {
        repoData = await getRepo(owner, repo);
        if (!repoData) {
          return res.status(404).json({ error: "Repository not found" });
        }
      }

      // Get access token for authenticated git operations
      const octokit = await getGitHubClient();
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Remove existing origin if exists, then add new one
      try {
        await execAsync("git remote remove origin", { cwd: process.cwd() });
      } catch (e) {
        // Ignore if origin doesn't exist
      }
      
      const remoteUrl = `https://github.com/${repoData.owner?.login || owner}/${repoData.name}.git`;
      await execAsync(`git remote add origin ${remoteUrl}`, { cwd: process.cwd() });

      res.json({ 
        success: true, 
        repo: { 
          name: repoData.name, 
          full_name: repoData.full_name,
          url: repoData.html_url 
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/github/commit", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Commit message required" });
      }

      // Get GitHub user for commit identity
      const user = await getGitHubUser();
      
      // Configure git user identity
      await execAsync(`git config user.email "${user.email || user.login + '@users.noreply.github.com'}"`, { cwd: process.cwd() });
      await execAsync(`git config user.name "${user.name || user.login}"`, { cwd: process.cwd() });

      // Stage all changes
      await execAsync("git add -A", { cwd: process.cwd() });
      
      // Commit
      const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: process.cwd() });
      
      res.json({ success: true, output: stdout });
    } catch (error: any) {
      if (error.message.includes("nothing to commit")) {
        return res.json({ success: true, output: "Nothing to commit, working tree clean" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/github/push", async (req, res) => {
    try {
      const { branch = "main", force = false } = req.body;
      
      // Get access token for push
      const octokit = await getGitHubClient();
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Get current remote URL
      const { stdout: remoteOutput } = await execAsync("git remote get-url origin", { cwd: process.cwd() });
      const remoteUrl = remoteOutput.trim();
      
      // Extract repo info from URL
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^.]+)/);
      if (!match) {
        return res.status(400).json({ error: "No GitHub remote configured" });
      }

      // For authenticated push, we need to use the GitHub API to get a token
      // and set up the remote with credentials
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY 
        ? 'repl ' + process.env.REPL_IDENTITY 
        : process.env.WEB_REPL_RENEWAL 
        ? 'depl ' + process.env.WEB_REPL_RENEWAL 
        : null;

      const connResponse = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken || ''
          }
        }
      ).then(r => r.json());
      
      const accessToken = connResponse.items?.[0]?.settings?.access_token || 
                          connResponse.items?.[0]?.settings?.oauth?.credentials?.access_token;

      if (!accessToken) {
        return res.status(401).json({ error: "GitHub authentication failed" });
      }

      // Set remote URL with token for this push
      const authenticatedUrl = `https://x-access-token:${accessToken}@github.com/${match[1]}/${match[2]}.git`;
      
      // Temporarily set authenticated remote, push, then restore
      await execAsync(`git remote set-url origin "${authenticatedUrl}"`, { cwd: process.cwd() });
      
      try {
        const forceFlag = force ? " --force" : "";
        const { stdout, stderr } = await execAsync(`git push -u origin ${branch}${forceFlag}`, { cwd: process.cwd() });
        res.json({ success: true, output: stdout || stderr || "Push successful" });
      } finally {
        // Restore non-authenticated URL
        await execAsync(`git remote set-url origin "${remoteUrl}"`, { cwd: process.cwd() });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/github/changes", async (req, res) => {
    try {
      const { stdout: statusOutput } = await execAsync("git status --porcelain", { cwd: process.cwd() });
      const changes = statusOutput.trim().split('\n').filter(Boolean).map(line => {
        const status = line.substring(0, 2).trim();
        const file = line.substring(3);
        return { status, file };
      });
      
      res.json({ changes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  app.get("/api/political/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Query too short" });
      }

      const apiKey = process.env.CONGRESS_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ 
          error: "CONGRESS_API_KEY not configured",
          hint: "Get a free key at api.data.gov/signup"
        });
      }

      const members = await searchMembers(query, apiKey);
      res.json({ members });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/political/member/:bioguideId", async (req, res) => {
    try {
      const { bioguideId } = req.params;
      const apiKey = process.env.CONGRESS_API_KEY;
      
      if (!apiKey) {
        return res.status(503).json({ error: "CONGRESS_API_KEY not configured" });
      }

      const [details, bills] = await Promise.all([
        getMemberDetails(bioguideId, apiKey),
        getRecentBillsByMember(bioguideId, apiKey, 5),
      ]);

      res.json({ 
        member: details.member,
        recentBills: bills,
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
