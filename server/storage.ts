import { 
  users, sessions, analysisArtifacts,
  type User, type InsertUser, type Session, type InsertSession,
  type AnalysisArtifact, type InsertAnalysisArtifact
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: string, isSubscribed: boolean): Promise<void>;

  // Session operations (cloud sync for subscribers)
  saveSession(session: InsertSession): Promise<Session>;
  getSession(id: string, userId: string): Promise<Session | undefined>;
  getUserSessions(userId: string, mode?: string): Promise<Session[]>;
  deleteSession(id: string, userId: string): Promise<void>;
  updateSession(id: string, userId: string, updates: Partial<InsertSession>): Promise<Session | undefined>;

  // Analysis artifact operations
  createAnalysisArtifact(artifact: InsertAnalysisArtifact): Promise<AnalysisArtifact>;
  getAnalysisArtifact(id: string): Promise<AnalysisArtifact | undefined>;
  getAllAnalysisArtifacts(): Promise<AnalysisArtifact[]>;
  updateAnalysisArtifact(id: string, updates: Partial<InsertAnalysisArtifact>): Promise<AnalysisArtifact | undefined>;
  deleteAnalysisArtifact(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, isSubscribed: 0 })
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, isSubscribed: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isSubscribed: isSubscribed ? 1 : 0 })
      .where(eq(users.id, id));
  }

  async saveSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getSession(id: string, userId: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
    return session || undefined;
  }

  async getUserSessions(userId: string, mode?: string): Promise<Session[]> {
    if (mode) {
      return await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.mode, mode)))
        .orderBy(desc(sessions.lastModified));
    }
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.lastModified));
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
  }

  async updateSession(id: string, userId: string, updates: Partial<InsertSession>): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({ ...updates, lastModified: new Date() })
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return updatedSession || undefined;
  }

  async createAnalysisArtifact(artifact: InsertAnalysisArtifact): Promise<AnalysisArtifact> {
    const [newArtifact] = await db
      .insert(analysisArtifacts)
      .values(artifact)
      .returning();
    return newArtifact;
  }

  async getAnalysisArtifact(id: string): Promise<AnalysisArtifact | undefined> {
    const [artifact] = await db
      .select()
      .from(analysisArtifacts)
      .where(eq(analysisArtifacts.id, id));
    return artifact || undefined;
  }

  async getAllAnalysisArtifacts(): Promise<AnalysisArtifact[]> {
    return await db
      .select()
      .from(analysisArtifacts)
      .orderBy(desc(analysisArtifacts.createdAt));
  }

  async updateAnalysisArtifact(id: string, updates: Partial<InsertAnalysisArtifact>): Promise<AnalysisArtifact | undefined> {
    const [updated] = await db
      .update(analysisArtifacts)
      .set(updates)
      .where(eq(analysisArtifacts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAnalysisArtifact(id: string): Promise<void> {
    await db.delete(analysisArtifacts).where(eq(analysisArtifacts.id, id));
  }
}

export const storage = new DatabaseStorage();
