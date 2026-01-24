# EDCM Unified Tiered Ingestion & Storage Architecture
## Relationship Communication Analytics + Political Intelligence + Live Reality Capture

EDCM analyzes communication patterns in personal relationships, institutions, and political actors to detect coherence, power dynamics, escalation, manipulation, and repair capacity.

This system is NOT a dating engine.  
It is a **relationship communication analytics engine**.

Truth depth increases only as consent depth increases.  
Memory depth increases only as trust depth increases.  
Political analysis depth increases only as analytic responsibility increases.

EDCM is not surveillance.  
EDCM is a **user-authorized coherence sensor**.

---

# TIER 1 — FREE
## Clipboard Listener + Single Political Figure Intelligence (Local Only)

### Relationship Communication Features
- Passive clipboard listener
- Captures text users already copy
- Infers conversation threads
- Speaker inference (lightweight)
- Detects:
  - Miscommunication patterns
  - Emotional escalation
  - Avoidance / deflection
  - Repair attempts
  - Power imbalance signals
- Local-only storage
- No cloud persistence
- User approval required before analysis

### Political Intelligence Features
- Analyze **one political figure at a time**
- Pulls publicly available speeches, interviews, votes, and posts
- Detects:
  - Consistency drift
  - Rhetorical manipulation
  - Promise vs. action divergence
  - Ideological coherence
- Session-based only (no archive)

### Principle
Free tier = **ephemeral insight, no long-term memory**

---

# TIER 2 — PAID BASIC
## Message Sync + Cloud Memory + Multi-Figure Political Archive

### Relationship Communication Features
- Phone-level message sync (opt-in)
- Automatic ingestion of ongoing conversations
- Persistent conversation timelines
- Identity & relationship graph modeling
- Longitudinal tracking of:
  - Conflict cycles
  - Repair frequency
  - Emotional reciprocity
  - Boundary violations
  - Trust & rupture patterns
- **Encrypted cloud backups**
- Cross-device continuity
- Pattern drift over time

### Political Intelligence Features
- Save & track **multiple political figures**
- Persistent political archives
- Longitudinal rhetoric tracking
- Voting vs. speech divergence modeling
- Comparative politician dashboards
- Encrypted cloud storage

### Principle
Paid Basic = **continuity engine for relationship & political memory**

---

# TIER 3 — PAID PRO
## Live Audio + Deep Cloud Memory + Real-Time Political Analysis

### Relationship Communication Features
- Live conversation recording (explicit consent required)
- Speech-to-text transcription
- Speaker diarization
- Emotional tone & sentiment analysis
- Detection of:
  - Manipulation
  - Gaslighting
  - Dominance patterns
  - Withdrawal / shutdown
  - Repair bids
- Real-time coherence & escalation alerts (optional)
- Multi-year relationship pattern modeling

### Political Intelligence Features
- **Real-time analysis of political speeches & debates**
- Live rhetoric scoring
- Mid-speech contradiction detection
- Propaganda & manipulation signal detection
- Narrative power modeling over time
- Crowd sentiment correlation

### Principle
Paid Pro = **high-resolution social & political observatory**

---

# UNIFIED CANONICAL OUTPUT SCHEMA (ALL TIERS)

```json
{
  "conversation_id": "uuid",
  "timestamp_range": ["start_iso", "end_iso"],
  "participants": ["A", "B", "Unknown"],
  "messages": [
    {
      "speaker": "A",
      "timestamp": "ISO-8601",
      "content": "text",
      "source_tier": "clipboard | message_sync | live_audio | political_ingest",
      "confidence": 0.0
    }
  ],
  "metadata": {
    "tier": "free | paid_basic | paid_pro",
    "privacy_mode": true,
    "consent_level": "explicit",
    "data_domain": "relationship | political | mixed"
  }
}
```

---

# IMPLEMENTATION STATUS

## Completed
- [x] Clipboard/paste ingestion (Tier 1)
- [x] Local-only storage with IndexedDB (Tier 1)
- [x] EDCM metrics detection (C, R, D, N, E)
- [x] Optional cloud sync with explicit consent (Tier 2 foundation)
- [x] Live audio with consent banner (Tier 3 foundation)
- [x] Settings page for sync preferences
- [x] Trends visualization
- [x] AI-assisted analysis mode
- [x] Clipboard listener for passive capture
- [x] Political figure analysis mode (local-only Tier 1)
- [x] Canonical output schema across all endpoints
- [x] Keyless-by-default political ingest
  - Federal Register API (no key)
  - House/Senate vote source stubs
  - Optional Congress.gov API enrichment

## Planned
- [ ] Message sync integration (Tier 2)
- [ ] Multi-figure political archive (Tier 2)
- [ ] Real-time political analysis (Tier 3)
- [ ] Subscription/tier management
- [ ] House/Senate XML vote parsing (full implementation)

---

# KEYLESS MODE SOURCES

Political ingest works without API keys using:
- **Federal Register API** (no key): Official rulemaking, notices, executive publications
- **House Roll Call Votes** (XML, no key): clerk.house.gov
- **Senate Roll Call Votes** (XML, no key): senate.gov

Optional enrichment with api.data.gov key:
- Congress.gov API
- GovInfo API
- Regulations.gov API
