// Hybrid storage: local-first with optional cloud sync
import { LocalStorage } from './db';
import { api } from '@/lib/api';
import { useAuthStore } from '@/auth/subscription';

interface SessionData {
  id: string;
  timestamp: number;
  mode: 'dating' | 'politics' | 'lab';
  content: string;
  tags?: string[];
  lastModified: number;
  audioTranscript?: string;
  audioFeatures?: any;
}

export const SyncStorage = {
  async saveSession(session: SessionData) {
    // Always save locally first
    await LocalStorage.saveSession(session);

    // If user is subscribed and sync is enabled, sync to cloud
    const { user, isSubscribed, syncEnabled } = useAuthStore.getState();
    if (user && isSubscribed && syncEnabled) {
      try {
        await api.saveSession({
          userId: user.id,
          mode: session.mode,
          content: session.content,
          tags: session.tags,
          audioTranscript: session.audioTranscript,
          audioFeatures: session.audioFeatures,
        });
      } catch (error) {
        console.error('Cloud sync failed, data saved locally:', error);
      }
    }
  },

  async getAllSessions() {
    // Always get local sessions
    const localSessions = await LocalStorage.getAllSessions();

    // If subscribed and synced, merge with cloud sessions
    const { user, isSubscribed, syncEnabled } = useAuthStore.getState();
    if (user && isSubscribed && syncEnabled) {
      try {
        const { sessions: cloudSessions } = await api.getUserSessions(user.id);
        
        // Merge strategy: keep most recent by lastModified
        const merged = new Map<string, SessionData>();
        
        localSessions.forEach(s => merged.set(s.id, s));
        cloudSessions.forEach((s: any) => {
          const existing = merged.get(s.id);
          if (!existing || new Date(s.lastModified) > new Date(existing.lastModified)) {
            merged.set(s.id, {
              id: s.id,
              timestamp: new Date(s.timestamp).getTime(),
              lastModified: new Date(s.lastModified).getTime(),
              mode: s.mode as 'dating' | 'politics' | 'lab',
              content: s.content,
              tags: s.tags,
              audioTranscript: s.audioTranscript,
              audioFeatures: s.audioFeatures,
            });
          }
        });
        
        return Array.from(merged.values());
      } catch (error) {
        console.error('Failed to fetch cloud sessions, using local only:', error);
        return localSessions;
      }
    }

    return localSessions;
  },

  async deleteSession(id: string) {
    await LocalStorage.deleteSession(id);

    const { user, isSubscribed, syncEnabled } = useAuthStore.getState();
    if (user && isSubscribed && syncEnabled) {
      try {
        await api.deleteSession(user.id, id);
      } catch (error) {
        console.error('Failed to delete from cloud:', error);
      }
    }
  },
};
