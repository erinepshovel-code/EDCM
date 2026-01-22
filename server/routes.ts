import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema } from "@shared/schema";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { getGitHubUser, listUserRepos, createRepo, getRepo, getGitHubClient } from "./github";

const execAsync = promisify(exec);

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

  return httpServer;
}
