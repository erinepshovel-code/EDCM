import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface EDCMSession {
  id: string;
  timestamp: number;
  mode: 'dating' | 'politics' | 'lab';
  content: string;
  tags?: string[];
  lastModified: number;
}

interface EDCMDB extends DBSchema {
  sessions: {
    key: string;
    value: EDCMSession;
    indexes: { 'by-mode': string; 'by-timestamp': number };
  };
}

const DB_NAME = 'edcm-storage';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EDCMDB>>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EDCMDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('by-mode', 'mode');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export const LocalStorage = {
  async saveSession(session: EDCMSession) {
    const db = await getDB();
    await db.put('sessions', session);
  },

  async getSession(id: string) {
    const db = await getDB();
    return await db.get('sessions', id);
  },

  async getAllSessions() {
    const db = await getDB();
    return await db.getAllFromIndex('sessions', 'by-timestamp');
  },

  async deleteSession(id: string) {
    const db = await getDB();
    await db.delete('sessions', id);
  }
};
