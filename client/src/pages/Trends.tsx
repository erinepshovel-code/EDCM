import { useEffect, useMemo, useState } from "react";
import { listAnalyticsEvents } from "../lib/analytics";

type Point = { x: number; y: number };

function pathFor(points: Point[], w = 520, h = 120) {
  if (points.length < 2) return "";
  const minX = 0;
  const maxX = Math.max(...points.map(p => p.x));
  const scaleX = (x: number) => (maxX === minX ? 10 : (x / (maxX - minX)) * (w - 20) + 10);
  const scaleY = (y: number) => (h - 10) - (Math.max(0, Math.min(1, y)) * (h - 20));

  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(" ");
}

export default function Trends() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const e = await listAnalyticsEvents(300);
      setEvents(e.reverse());
    })();
  }, []);

  const series = useMemo(() => {
    const mk = (key: string) => events.map((ev, idx) => ({ x: idx, y: Number(ev?.metrics?.[key] ?? 0) }));
    return {
      C: mk("constraint_strain_C"),
      R: mk("refusal_density_R"),
      D: mk("deflection_D"),
      N: mk("noise_N"),
    };
  }, [events]);

  const latest = events[events.length - 1];

  const card = (label: string, key: "C" | "R" | "D" | "N", metricKey: string) => (
    <div style={{ border: "1px solid #3333", borderRadius: 12, padding: 12 }} data-testid={`card-metric-${key}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          latest: {latest ? Number(latest.metrics?.[metricKey] ?? 0).toFixed(3) : "—"}
        </div>
      </div>
      <svg width="100%" viewBox="0 0 520 120" style={{ marginTop: 10 }}>
        <path d={pathFor(series[key])} fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="110" x2="510" y2="110" stroke="currentColor" opacity="0.2" />
        <line x1="10" y1="10" x2="10" y2="110" stroke="currentColor" opacity="0.2" />
      </svg>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        hmm: spikes suggest turbulence—validate with more turns + tagging.
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h2>Trends</h2>
      <div style={{ opacity: 0.8, marginTop: 6 }}>
        Local analytics only. Values are measurements (not intent or truth).
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {card("C (Constraint Strain)", "C", "constraint_strain_C")}
        {card("R (Refusal Density)", "R", "refusal_density_R")}
        {card("D (Deflection)", "D", "deflection_D")}
        {card("N (Noise)", "N", "noise_N")}
      </div>
    </div>
  );
}
