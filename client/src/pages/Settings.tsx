import { useEffect, useState } from "react";
import { exportAnalyticsJSON, getSettings, setSettings } from "../lib/analytics";
import type { SyncMode } from "../../../shared/edcm-types";

export default function Settings() {
  const [sync, setSync] = useState<SyncMode>("off");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSync(s.cloudSync);
      setLoaded(true);
    })();
  }, []);

  async function update(mode: SyncMode) {
    setSync(mode);
    await setSettings({ cloudSync: mode });
  }

  async function doExport() {
    const json = await exportAnalyticsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edcm_analytics_export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h2>Settings</h2>

      <div style={{ border: "1px solid #3333", borderRadius: 12, padding: 12, marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Cloud Sync</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>
          Local-first by default. Sync is optional. Metrics-only is recommended.
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <label data-testid="radio-sync-off">
            <input type="radio" checked={sync === "off"} onChange={() => update("off")} /> Off (local only)
          </label>
          <label data-testid="radio-sync-metrics">
            <input type="radio" checked={sync === "metrics_only"} onChange={() => update("metrics_only")} /> Metrics-only sync (recommended)
          </label>
          <label data-testid="radio-sync-text">
            <input type="radio" checked={sync === "include_text"} onChange={() => update("include_text")} /> Include text (explicit opt-in)
          </label>
        </div>
      </div>

      <div style={{ border: "1px solid #3333", borderRadius: 12, padding: 12, marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Export</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>Export local analytics as JSON.</div>
        <button style={{ marginTop: 10 }} onClick={doExport} data-testid="button-export">Export JSON</button>
      </div>

      <div style={{ border: "1px solid #3333", borderRadius: 12, padding: 12, marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Political Intelligence Sources</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>
          Political ingest works without any API key using official public sources:
        </div>
        <ul style={{ fontSize: 13, marginTop: 8, paddingLeft: 20 }}>
          <li>Federal Register (rulemaking, notices)</li>
          <li>House/Senate Roll Call Votes (XML)</li>
        </ul>
        <div style={{ marginTop: 10, padding: 10, background: "rgba(0,0,0,0.05)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Optional: Enrichment API Key</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Add an api.data.gov key to unlock Congress.gov API, GovInfo, and Regulations.gov.
          </div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            <a href="https://api.data.gov/signup/" target="_blank" rel="noopener noreferrer" 
               style={{ color: "#0066cc" }}>
              Get a free key at api.data.gov/signup
            </a>
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            After signup, add CONGRESS_API_KEY to your Secrets tab.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        hmm: Data value vs user trust — keep defaults local + metrics-only.
      </div>
    </div>
  );
}
