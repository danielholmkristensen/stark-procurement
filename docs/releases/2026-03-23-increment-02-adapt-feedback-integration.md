# Release Notes — Increment 02: ADAPT Feedback Integration

**Release Date:** 2026-03-23
**Version:** 0.2.0
**Status:** Complete

---

## Overview

This release integrates STARK Procurement's ADAPT workflow with the Command Center's autonomous feedback loop. Agents can now receive reviewer feedback and automatically address it.

---

## What's New

### ADAPT Feedback Polling

The `/adapt:run` command now:
- Polls Command Center for pending feedback before each Feature wave
- Injects feedback items as additional Tasks in the current wave
- Emits `screens.updated` event after addressing feedback
- Auto-resolves changes via Change Tracker API

### Event Emission

Added `screens.updated` event when feedback is addressed:

```bash
curl -s -X POST "$GATEWAY_URL/publish" -H "Content-Type: application/json" -d '{
  "eventType": "screens.updated",
  "source": "adapt-agent",
  "schemaVersion": 1,
  "payload": {
    "screenId": "[screenId]",
    "status": "REVIEW",
    "message": "Feedback addressed: [summary]"
  }
}'
```

This notifies the Command Center UI that a screen's feedback has been addressed and is ready for re-review.

---

## Files Changed

| File | Change |
|------|--------|
| `.claude/commands/adapt/run.md` | Added screens.updated event emission in Phase 4.5 |

---

## Integration Points

### Command Center APIs Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agent/pending-feedback` | Poll for pending feedback items |
| `POST /api/changes/:id/resolve` | Mark feedback as resolved |
| `POST /publish` (Event Gateway) | Emit screens.updated event |

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CHANGE_TRACKER_URL` | http://localhost:3002 | Change Tracker service |
| `KAFKA_GATEWAY_URL` | http://localhost:8083 | Event Gateway service |

---

## Autonomous Loop Flow

```
ADAPT /adapt:run
      ↓
Poll pending feedback
      ↓
Inject as Tasks in current wave
      ↓
Agent addresses feedback
      ↓
POST /api/changes/:id/resolve
      ↓
Emit screens.updated (status: REVIEW)
      ↓
Reviewer sees resubmission in Review Portal
```

---

## Commits

| Commit | Message |
|--------|---------|
| `2857979` | feat(02.3.2): Add screens.updated event to ADAPT run |

---

## Related

- [Command Center Increment 02 Release Notes](https://github.com/danielholmkristensen/stark-command-center/blob/main/docs/releases/2026-03-23-increment-02-autonomous-delivery-pipeline.md)

---

## Contributors

- Claude Opus 4.5 (Agentic Agency)
