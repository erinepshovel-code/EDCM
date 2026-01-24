import type { AnalyticsEvent, EDCMResult, SyncMode } from "../../../shared/edcm-types";

const DB_NAME = "edcm_local";
const DB_VERSION = 1;

const STORE_EVENTS = "analytics_events";
const STORE_SETTINGS = "settings";

export type AnalyticsSettings = {
  cloudSync: SyncMode;
  allowTextUpload: boolean;
  appVersion: string;
  specVersion: "edcm-app-v0";
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const store = db.createObjectStore(STORE_EVENTS, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const r = fn(s);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function getSettings(): Promise<AnalyticsSettings> {
  const db = await openDB();
  const existing = await tx<any>(db, STORE_SETTINGS, "readonly", s => s.get("settings"));
  if (existing?.value) return existing.value as AnalyticsSettings;

  const defaults: AnalyticsSettings = {
    cloudSync: "off",
    allowTextUpload: false,
    appVersion: "0.0.0",
    specVersion: "edcm-app-v0"
  };
  await tx(db, STORE_SETTINGS, "readwrite", s => s.put({ key: "settings", value: defaults }));
  return defaults;
}

export async function setSettings(patch: Partial<AnalyticsSettings>): Promise<AnalyticsSettings> {
  const cur = await getSettings();
  const next: AnalyticsSettings = { ...cur, ...patch };
  next.allowTextUpload = next.cloudSync === "include_text";
  const db = await openDB();
  await tx(db, STORE_SETTINGS, "readwrite", s => s.put({ key: "settings", value: next }));
  return next;
}

export async function addAnalyticsEvent(params: {
  result: EDCMResult;
  sessionId: string;
  rawText?: string;
}): Promise<AnalyticsEvent> {
  const settings = await getSettings();
  const created_at = new Date().toISOString();

  const turn_count = params.result.conversation_turns?.length ?? 0;
  const char_count =
    params.result.conversation_turns?.reduce((a, t) => a + (t.text?.length ?? 0), 0) ?? 0;

  const hmmm_tags = Array.from(
    new Set((params.result.hmmm_items ?? []).flatMap(h => h.tags ?? []))
  );

  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    created_at,
    session_id: params.sessionId,
    mode: params.result.mode,
    turn_count,
    char_count,
    metrics: params.result.metrics,
    quality_flags: params.result.quality_flags,
    hmmm_count: params.result.hmmm_items?.length ?? 0,
    hmmm_tags,
    app_version: settings.appVersion,
    spec_version: settings.specVersion,
    raw_text: settings.allowTextUpload ? (params.rawText ?? "") : undefined
  };

  const db = await openDB();
  await tx(db, STORE_EVENTS, "readwrite", s => s.put(event));
  return event;
}

export async function listAnalyticsEvents(limit = 300): Promise<AnalyticsEvent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_EVENTS, "readonly");
    const s = t.objectStore(STORE_EVENTS);
    const idx = s.index("created_at");
    const req = idx.openCursor(null, "prev");
    const out: AnalyticsEvent[] = [];
    req.onsuccess = () => {
      const c = req.result;
      if (!c || out.length >= limit) return resolve(out);
      out.push(c.value as AnalyticsEvent);
      c.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function exportAnalyticsJSON(): Promise<string> {
  const settings = await getSettings();
  const events = await listAnalyticsEvents(2000);
  return JSON.stringify({ settings, events }, null, 2);
}
