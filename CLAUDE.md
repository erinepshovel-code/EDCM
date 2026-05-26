# CLAUDE.md — EDCM Analyzer Platform

This file gives AI assistants context needed to work effectively in this repository.

---

## What This Repo Is

The **EDCM Analyzer Platform** is a React + TypeScript full-stack application
implementing the **Energy–Dissonance Circuit Model (EDCM)** for analyzing
interaction dynamics across text and audio inputs. It surfaces *patterns*
(pace, pressure, clarity, balance) and explicitly does **not** detect emotions,
infer intent, diagnose people, or adjudicate truth.

It is a product/application repo (Replit-originated), distinct from the
library/monorepo `The-Interdependency/edcmbone`, which holds the EDCM
measurement library and framework spec.

---

## Modes

| Route | Mode | Projections |
|-------|------|-------------|
| `/dating` | Dating | Pace, Power Balance, Intent Clarity |
| `/politics` | Political | Pressure, Semantic Clarity, Responsibility Locus |
| `/lab` | Consciousness Lab | Raw metric access, time-series, vector topology |
| (analysis) | Analysis | AI-assisted conversation analysis + artifact management |

---

## Privacy & Storage Architecture

- **Local-first by default.** Analysis runs client-side via the EDCM engine
  stub; sessions persist in browser **IndexedDB**. No account required.
- **Optional cloud sync (subscriber feature).** When subscribed + logged in,
  sessions sync to PostgreSQL; merge strategy is by `lastModified` timestamp.
  Toggleable (opt-out). Graceful degradation if sync fails.
- **Audio privacy.** Transcripts auto-sync when subscribed; raw audio is
  local-only unless explicitly opted in. "Delete audio, keep transcript" is supported.

---

## EDCM Engine

`client/src/edcm/engine.ts` is a **deterministic stub** computing 9 core metrics:
**C** Constraint Strain, **R** Refusal, **D** Deflection, **N** Noise,
**L** Coherence Loss, **O** Overconfidence, **F** Fixation, **E** Escalation,
**I** Integration Failure.

- **Audio features are non-diagnostic structural signals only** — speech rate,
  pause density, volume variance map to Urgency/Escalation/Pressure/Noise.
  The system analyzes pacing, turn-taking, and prosodic acceleration — never emotion.
- **Projection governance is mandatory.** Raw metrics are **never** shown to
  users by default; modes expose categorized projections defined in
  `client/src/edcm/projections.ts`.
- **Swap-in point.** Replace the stub with a production engine by re-exporting
  `analyzeText(text, options): EDCMResult` from `client/src/edcm/engine.ts`.

---

## Repository Layout

```
client/                React 18 + TypeScript + Vite frontend
  src/
    pages/             Analysis, Settings, Trends, Home, Dashboard
    components/        analysis/HmmmPanel.tsx, shared/ModeHeader.tsx, ...
    edcm/              engine.ts (stub), projections.ts, audio-adaptor.ts, types.ts
    lib/               analytics.ts (IndexedDB), edcm-client.ts (API client)
server/                Node + Express backend
  routes.ts            All API endpoints
  edcm-assistant.ts    AI processing + EDCM analysis
  storage.ts           PostgreSQL operations (Drizzle)
  audio-discernment.ts Audio processing
shared/                Cross-cutting types + Drizzle schema
  edcm-types.ts, edcm-assistant-types.ts, audio-types.ts, schema.ts
edcmbone/              Vendored / colocated edcmbone material
ammh/                  AIMMH-related material
docs/                  Documentation
drizzle.config.ts      Drizzle ORM config
vite.config.ts         Vite config (+ vite-plugin-meta-images.ts)
replit.md              Platform overview and user preferences
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Web Audio API |
| Local persistence | IndexedDB via `idb` |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon), Drizzle ORM, Zod validation |

---

## Development Workflow

```bash
npm install
npm run db:push   # Initialize database schema (Drizzle → PostgreSQL)
npm run dev       # Start full-stack app on port 5000
```

---

## API Endpoints

```
POST /api/edcm/analyze              Run EDCM analysis
POST /api/analytics/collect         Privacy-guarded analytics
POST /api/edcm-assistant/parse      Parse text to turns
POST /api/edcm-assistant/process    AI assistant streaming
GET/POST /api/edcm-assistant/artifacts   Artifact CRUD
POST /api/political/analyze-news    News distortion analysis
POST /api/auth/register | /login | /subscribe/:userId   (stub auth)
POST/GET/PATCH/DELETE /api/sessions[/:userId[/:id]]      Session sync (subscribers)
```

---

## Key Conventions

- **Privacy-first is mandatory.** No emotion detection, no intent inference,
  no diagnostic claims. Safety notes describe "patterns that can precede harm,"
  never "dangerous person detection."
- **Projection governance.** Raw metrics stay hidden by default — surface
  projections, not the underlying vector.
- **"hmm" is a first-class UI element**, not a code comment — uncertainty is
  tracked structurally (`HmmmPanel`, HmmItem severity/evidence/fix).
- **Consent before recording.** Audio recording requires a consent banner;
  text upload requires explicit opt-in.
- `shared/schema.ts` is the Drizzle source of truth; apply via `npm run db:push`.

---

## What Does Not Exist Yet

- **No LICENSE file** in the repo. The Interdependency org standard is Apache
  2.0, but a license has **not** been applied here — confirm intended licensing
  before publishing or reusing this code.
- Auth is a stub implementation.
- The EDCM engine is a deterministic stub (swap-in point documented above).
- No CI pipeline or test suite configured.

---

## Related Repos

| Repo | Role |
|------|------|
| The-Interdependency/edcmbone | EDCM measurement library + framework spec (upstream) |
| The-Interdependency/aimmh | Multi-model AI hub (AIMMH) |
| The-Interdependency/a0 | Agent platform consuming EDCM behavioral scoring |

---

## Git Workflow

- Main branch: `main`
- Feature branches: `feat/<description>`, `fix/<description>`, `docs/<description>`, `chore/<description>`
- Commit style: Conventional Commits (`feat(dating):`, `fix(engine):`, etc.)
- Author: Erin Patrick Spencer (wayseer@interdependentway.org)
- License: no LICENSE file present (org standard is Apache 2.0 — apply explicitly to adopt it)

## Agent module-build doctrine

Before adding a new module, route, service, adapter, schema, worker, engine,
UI panel, migration, or experiment, read:

`./.agents/skills/meta-module-build/SKILL.md`

New module work should start with a `MODULE_BUILD` block. Unknown fields must
be marked `hmmm`, not guessed.
