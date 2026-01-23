# EDCM Analyzer Platform

## Overview
Privacy-first Energy-Dissonance Circuit Model (EDCM) Analyzer with three distinct modes:
- **Dating Mode**: Safety & clarity checks for personal interactions
- **Political Mode**: Rhetoric and discourse pattern analysis  
- **Lab Mode**: Scientific visualization of interaction dynamics

The platform analyzes text and audio inputs for interaction dynamics (pace, pressure, clarity, balance) while strictly avoiding emotion detection, intent inference, or diagnostic claims.

## Architecture
- **Local-first**: All data stored in IndexedDB by default
- **Cloud sync**: Optional, only for subscribers
- **Privacy constraints**: No emotion detection, no intent inference

## Recent Changes (January 2026)
- Added comprehensive Live Audio Discernment feature
- Integrated OpenAI transcription via Replit AI Integrations
- Added speaker diarization and quality flags
- Implemented "hmm" alerts as first-class UI elements
- Built segment editor with edit, merge, split, delete functionality
- Added consent banner for audio recording
- Created IndexedDB local storage for audio artifacts
- Built EDCM pipeline adaptor for audio→analysis conversion
- Added streaming endpoints for live audio mode

## Key Features

### Live Audio Discernment
- Record & Analyze mode: Record audio, then analyze
- Live Stream mode: Stream audio in real-time
- Speaker diarization (heuristic-based, labeled as such)
- Quality flags: high_noise, low_confidence, overlapping_speech, etc.
- "hmm" alerts with severity levels and suggested fixes
- Segment editor: rename speakers, edit text, merge/split segments
- Local storage via IndexedDB for privacy-first approach

### EDCM Analysis
- Structural analysis only (pacing, pauses, turn-taking)
- Projection governance: raw metrics never shown by default
- Mode-specific projections (Dating/Political/Lab)

## Project Structure
```
client/
  src/
    components/shared/LiveAudioDiscernment.tsx  - Main audio UI
    edcm/engine.ts                              - EDCM analysis engine
    edcm/audio-adaptor.ts                       - Audio→EDCM converter
    lib/audio-storage.ts                        - IndexedDB storage
server/
  routes.ts                                     - API endpoints
  audio-discernment.ts                          - Audio processing
  replit_integrations/audio/                    - OpenAI integration
shared/
  audio-types.ts                                - TypeScript types
  schema.ts                                     - Database schema
```

## Ethical Constraints
- No emotion detection from audio
- No intent inference or prediction
- Safety Notes say "patterns that can precede harm" not "dangerous person detection"
- Consent banner required for audio recording
- Raw metrics never shown by default (projection governance)

## User Preferences
- GitHub: erinepshovel-code, repo: EDCM
- Privacy-first approach mandatory
- "hmm" must be first-class UI element, not a comment
