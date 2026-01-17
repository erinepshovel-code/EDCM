---
EDCM Input Log Formats (Canonical)

EDCM desktop supports JSONL and CSV.

JSONL (recommended)
One JSON object per line.

Required fields:
- ts (string or number) — timestamp (ISO8601 recommended)
- role (string) — e.g. "user", "assistant", "system"
- content (string)

Optional fields:
- meta (object) — any extra fields

Example:
{"ts":"2026-01-17T10:00:00-08:00","role":"user","content":"Define egregious."}
{"ts":"2026-01-17T10:00:02-08:00","role":"assistant","content":"Egregious means..."}

CSV
Required columns: ts, role, content

Notes
- If timestamps are missing, EDCM will infer sequence order by file order.
- Metrics are behavioral; they only consume outputs/turns.
---