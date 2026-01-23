import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isSubscribed: integer("is_subscribed").notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // 'dating' | 'politics' | 'lab'
  content: text("content").notNull(),
  tags: text("tags").array(),
  audioTranscript: text("audio_transcript"),
  audioFeatures: jsonb("audio_features"), // Store AudioFeatures JSON
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  timestamp: true,
  lastModified: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Chat/Voice Conversations (for OpenAI integration)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Audio Discernment Artifacts
export const audioArtifacts = pgTable("audio_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  audioFormat: text("audio_format"),
  durationMs: integer("duration_ms"),
  audioStored: text("audio_stored").default("none"), // "none" | "local" | "server"
  transcriptFull: text("transcript_full"),
  segments: jsonb("segments"), // Array of segments
  conversationTurns: jsonb("conversation_turns"), // Array of turns
  qualityFlags: text("quality_flags").array(),
  hmm: boolean("hmm").default(false),
  hmmDetails: jsonb("hmm_details"),
  edcmInputReady: boolean("edcm_input_ready").default(false),
  edcmResults: jsonb("edcm_results"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAudioArtifactSchema = createInsertSchema(audioArtifacts).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type AudioArtifact = typeof audioArtifacts.$inferSelect;
export type InsertAudioArtifact = z.infer<typeof insertAudioArtifactSchema>;

export const analysisArtifacts = pgTable("analysis_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  source: text("source").notNull().default("paste"),
  conversationTurns: jsonb("conversation_turns").default([]),
  rawText: text("raw_text"),
  features: jsonb("features"),
  qualityFlags: text("quality_flags").array().default([]),
  hmmItems: jsonb("hmm_items").default([]),
  edcmResult: jsonb("edcm_result"),
  analysisComplete: boolean("analysis_complete").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAnalysisArtifactSchema = createInsertSchema(analysisArtifacts).omit({
  id: true,
  createdAt: true,
});

export type AnalysisArtifact = typeof analysisArtifacts.$inferSelect;
export type InsertAnalysisArtifact = z.infer<typeof insertAnalysisArtifactSchema>;
