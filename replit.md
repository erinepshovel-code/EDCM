# EDCM Analyzer Platform

## Overview
Privacy-first Energy-Dissonance Circuit Model (EDCM) Analyzer with multiple modes:
- **Dating Mode**: Safety & clarity checks for personal interactions
- **Political Mode**: Rhetoric and discourse pattern analysis  
- **Lab Mode**: Scientific visualization of interaction dynamics
- **Analysis Mode**: AI-assisted conversation analysis with artifact management

The platform analyzes text and audio inputs for interaction dynamics (pace, pressure, clarity, balance) while strictly avoiding emotion detection, intent inference, or diagnostic claims.

## Architecture
- **Local-first**: All data stored in IndexedDB by default
- **Cloud sync**: Optional, explicit opt-in only
- **Privacy constraints**: No emotion detection, no intent inference
- **Database**: PostgreSQL with Drizzle ORM for server-side persistence

## Recent Changes (January 2026)
- Added EDCM core types (`shared/edcm-types.ts`)
- Implemented focus-locked EDCM engine with heuristic metrics
- Created `/api/edcm/analyze` endpoint for EDCM analysis
- Added `/api/analytics/collect` with privacy guards
- Built local analytics storage using IndexedDB
- Added Settings page for cloud sync preferences
- Added Trends page with SVG sparkline charts
- Updated AI Assistant description with accurate capabilities
- Added tutorial button for onboarding
- **News Ingest Module**: Primary/secondary source classification with distortion scoring
  - Quote extraction with speaker attribution
  - Editorial marker detection
  - Headline spin analysis
  - Distortion score (higher = more distortion)

## Key Features

### EDCM Metrics
- **C** (Constraint Strain): Composite pressure indicator
- **R** (Refusal Density): Resistance patterns
- **D** (Deflection): Topic avoidance
- **N** (Noise): Uncertainty signals
- **E** (Escalation): Intensity patterns

### Quality Flags
- LOW_CONFIDENCE_PARSE, INSUFFICIENT_CONTEXT
- MISSING_SPEAKER_TAGS, OVER_SHORT_SAMPLE
- POSSIBLE_INTENT_INFERENCE_RISK, MODEL_DRIFT_RISK

### HmmItem Tracking
- Structured uncertainty with severity levels
- Evidence and suggested fixes
- Tags for categorization

### Analytics
- Local-first with IndexedDB
- Optional cloud sync (off/metrics_only/include_text)
- Export to JSON
- Trends visualization

## Project Structure
```
client/src/
  pages/
    Analysis.tsx        - AI-assisted EDCM analysis
    Settings.tsx        - Cloud sync preferences
    Trends.tsx          - Analytics visualization
    Home.tsx, Dashboard.tsx
  components/
    analysis/HmmmPanel.tsx
    shared/ModeHeader.tsx, etc.
  edcm/
    engine.ts           - EDCM analysis (client-side)
    audio-adaptor.ts    - Audio→EDCM converter
    types.ts            - Legacy types
  lib/
    analytics.ts        - IndexedDB storage
    edcm-client.ts      - API client + logging

server/
  routes.ts             - All API endpoints
  edcm-assistant.ts     - AI processing + EDCM analysis
  storage.ts            - PostgreSQL operations
  audio-discernment.ts  - Audio processing

shared/
  edcm-types.ts         - Core EDCM types
  edcm-assistant-types.ts
  schema.ts             - Database schema (Drizzle)
  audio-types.ts
```

## API Endpoints
- `POST /api/edcm/analyze` - Run EDCM analysis
- `POST /api/analytics/collect` - Privacy-guarded analytics
- `POST /api/edcm-assistant/parse` - Parse text to turns
- `POST /api/edcm-assistant/process` - AI assistant streaming
- `GET/POST /api/edcm-assistant/artifacts` - Artifact CRUD
- `POST /api/political/analyze-news` - News distortion analysis

## Ethical Constraints
- No emotion detection from audio or text
- No intent inference or prediction
- Safety Notes describe "patterns that can precede harm" not "dangerous person detection"
- Consent banner required for audio recording
- Raw metrics never shown by default (projection governance)
- Text upload requires explicit opt-in

## User Preferences
- GitHub: erinepshovel-code, repo: EDCM
- Privacy-first approach mandatory
- "hmm" must be first-class UI element, not a comment
- Focus-locked analysis: instrument-only, no advice
