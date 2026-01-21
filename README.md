# EDCM Analyzer Platform

A React + TypeScript full-stack application implementing the Energy–Dissonance Circuit Model (EDCM) for analyzing interaction dynamics across text and audio inputs.

## 🚀 Features

### 1. Dating Mode (`/dating`)
*   **Goal**: Help users take clean risks and communicate without escalation.
*   **Projections**: Pace, Power Balance, Intent Clarity.
*   **Safety**: Non-alarmist pattern detection (coercion, boundary erosion).
*   **Tools**: Draft analysis, rewrite suggestions, clean exit generator.
*   **Audio Support**: Voice note and call recording analysis with structural feature extraction.

### 2. Political Mode (`/politics`)
*   **Goal**: Analyze rhetoric mechanics without partisan bias.
*   **Projections**: Pressure, Semantic Clarity, Responsibility Locus.
*   **Tools**: Trajectory forecast, definition prompts.
*   **Audio Support**: Speech and debate transcript analysis with prosodic features.

### 3. Consciousness Lab (`/lab`)
*   **Goal**: Scientific visualization of "consciousness fields."
*   **Features**: Raw metric access, time-series charts, vector topology.
*   **Audio Support**: Structural paralinguistic feature display in methodology view.

## 🔒 Privacy & Storage Architecture

### Local-First by Default
*   **No Account Required**: All analysis runs client-side using the EDCM engine stub.
*   **IndexedDB Storage**: Sessions saved locally in browser storage automatically.
*   **Zero Server Dependency**: Full functionality without creating an account.

### Optional Cloud Sync (Subscriber Feature)
*   **Hybrid Storage Model**: When a user subscribes and logs in:
    - Cloud sync is **enabled by default** for automatic backup
    - All new and edited sessions sync to PostgreSQL backend
    - Can be toggled off in Settings (opt-out)
*   **Merge Strategy**: Cloud and local sessions merge by `lastModified` timestamp
*   **Graceful Degradation**: If cloud sync fails, data remains safe locally

### Audio Privacy
*   **Transcripts**: Auto-sync when subscribed (default ON)
*   **Raw Audio Files**: Local-only by default; requires explicit opt-in for cloud storage
*   **User Control**: "Delete audio, keep transcript" button available

## 🛠 Tech Stack

### Frontend
*   React 18 + TypeScript
*   Vite
*   Tailwind CSS
*   Zustand (State Management)
*   IndexedDB via `idb` (Local Persistence)
*   Recharts (Visualization)
*   Web Audio API (Recording)

### Backend
*   Node.js + Express
*   PostgreSQL (Neon)
*   Drizzle ORM
*   Zod (Validation)

## 🧬 EDCM Engine

The engine (`client/src/edcm/engine.ts`) is a **deterministic stub** that computes 9 core metrics:

*   **C** (Constraint Strain)
*   **R** (Refusal)
*   **D** (Deflection)
*   **N** (Noise)
*   **L** (Coherence Loss)
*   **O** (Overconfidence)
*   **F** (Fixation)
*   **E** (Escalation)
*   **I** (Integration Failure)

### Audio Integration
When audio features are provided, they modify the engine as **non-diagnostic structural signals**:
*   Fast speech rate (>150 wpm) → increases Urgency and Escalation
*   Low pause density (<0.2) → increases Pressure
*   High volume variance → signals instability (maps to Noise/Refusal)

**Critical**: The system does NOT detect emotions. It analyzes **pacing, turn-taking, and prosodic acceleration** only.

## 📊 Projection Governance

Raw metrics are NEVER shown to users by default. Instead:

### Dating Projections
```typescript
Pace = categorize(weighted(E, urgency, dE, R, F))
Balance = categorize(weighted(L, D, R))
Clarity = categorize(weighted(O, D, N, C))
```

### Political Projections
```typescript
Pressure = categorize(weighted(E, urgency, R, dE))
Clarity = categorize(weighted(O, D, N, C))
Responsibility = categorize(weighted(L, R, D))
```

Thresholds and weights are defined in `client/src/edcm/projections.ts`.

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_subscribed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (Cloud Sync)
CREATE TABLE sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'dating' | 'politics' | 'lab'
  content TEXT NOT NULL,
  tags TEXT[],
  audio_transcript TEXT,
  audio_features JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  last_modified TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Authentication (Stub Implementation)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/subscribe/:userId
```

### Session Sync (Subscribers Only)
```
POST   /api/sessions              - Save new session
GET    /api/sessions/:userId      - Get all user sessions
GET    /api/sessions/:userId/:id  - Get specific session
PATCH  /api/sessions/:userId/:id  - Update session
DELETE /api/sessions/:userId/:id  - Delete session
```

## ⚠️ Disclaimer

**This tool observes patterns in expressed signals. It does NOT:**
*   Diagnose people or mental states
*   Infer intent or detect lies
*   Adjudicate factual truth
*   Identify "dangerous people" or "predators"
*   Detect emotions from audio

**It DOES:**
*   Analyze interaction dynamics under constraint
*   Surface behavioral patterns (pace, clarity, balance)
*   Provide structural analysis of speech (rate, pauses, turn-taking)

## 🚧 Development

### Setup
```bash
npm install
npm run db:push  # Initialize database schema
npm run dev      # Start full-stack app on port 5000
```

### Swap Real EDCM Engine
Replace the stub in `client/src/edcm/engine.ts` with your production engine:
```typescript
import { analyzeText } from './your-real-engine';
export { analyzeText };
```

Ensure it adheres to the same interface:
```typescript
function analyzeText(text: string, options: AnalysisOptions): EDCMResult;
```

## 📝 License & Ethics

This is a research tool for understanding interaction mechanics. Users must:
*   Obtain consent before recording conversations
*   Use analysis results responsibly
*   Not rely on this tool for safety-critical decisions

Meaning is co-created by the observer. Signals are not determinations.
