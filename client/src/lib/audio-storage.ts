import type { AudioDiscernmentResult } from "@shared/audio-types";

const DB_NAME = "edcm-audio-db";
const DB_VERSION = 1;
const STORE_NAME = "audio_artifacts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "artifact_id" });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("hmm", "hmm", { unique: false });
      }
    };
  });
}

export async function saveArtifact(artifact: AudioDiscernmentResult): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(artifact);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}

export async function getArtifact(artifactId: string): Promise<AudioDiscernmentResult | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(artifactId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);

    tx.oncomplete = () => db.close();
  });
}

export async function getAllArtifacts(): Promise<AudioDiscernmentResult[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("created_at");
    const request = index.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.reverse());
    };

    tx.oncomplete = () => db.close();
  });
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(artifactId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}

export async function getArtifactsWithHmm(): Promise<AudioDiscernmentResult[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("hmm");
    const request = index.getAll(IDBKeyRange.only(true));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);

    tx.oncomplete = () => db.close();
  });
}

export async function clearAllArtifacts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}
