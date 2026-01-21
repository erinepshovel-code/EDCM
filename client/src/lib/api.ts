// API client for backend communication (session sync)

interface Session {
  id: string;
  userId: string;
  mode: string;
  content: string;
  tags?: string[];
  audioTranscript?: string;
  audioFeatures?: any;
  timestamp: Date;
  lastModified: Date;
}

export const api = {
  // Auth
  async register(username: string, password: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async login(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  async subscribe(userId: string) {
    const res = await fetch(`/api/auth/subscribe/${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Subscription failed');
    return res.json();
  },

  // Sessions (cloud sync)
  async saveSession(session: Omit<Session, 'id' | 'timestamp' | 'lastModified'>) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Failed to save session');
    return res.json();
  },

  async getUserSessions(userId: string, mode?: string) {
    const url = new URL(`/api/sessions/${userId}`, window.location.origin);
    if (mode) url.searchParams.set('mode', mode);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async getSession(userId: string, sessionId: string) {
    const res = await fetch(`/api/sessions/${userId}/${sessionId}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },

  async updateSession(userId: string, sessionId: string, updates: Partial<Session>) {
    const res = await fetch(`/api/sessions/${userId}/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },

  async deleteSession(userId: string, sessionId: string) {
    const res = await fetch(`/api/sessions/${userId}/${sessionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete session');
    return res.json();
  },
};
