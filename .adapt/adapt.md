# STARK Procurement — ADAPT Project Configuration

## Testing

```bash
npm run build               # Type checking and build verification
npm test                    # Run all tests (when configured)
npm run dev                 # Development server
npm run lint                # Lint (when configured)
```

## Environment

```bash
node --version              # Must be 20+
npm --version               # Must be 10+
npm ls next                 # Should show 16.2.1
npm ls dexie                # Should show 4.x
```

- Node.js 20+
- Next.js 16.2.1 (Turbopack)
- Tailwind CSS 4
- Dexie.js 4.x for IndexedDB
- TypeScript 5.x (strict mode)

## Additional Rules

1. **Follow the HTML mockups** — Design files in `docs/design/` are the source of truth
2. **STARK Design System** — Navy 80%, Green 15%, Orange 5% color rule
3. **Escalation hierarchy** — Ambient → Awareness → Attention → Action → Urgent
4. **Orange is earned** — Only urgent/action items get orange; default is navy
5. **Local-first** — All data in IndexedDB via Dexie, sync queue for future Kafka
6. **Type safety** — No `any` types, strict TypeScript
7. **Lucide icons** — Never use emojis in UI; use Lucide React icons

## ADAPT Harness

This project uses the ADAPT methodology (Agentic Development with Artifact Persistence & Testing).

### Hierarchy
- **Increment 01** — Current (Front-End Foundation)
- **Iterations** — 01.1 through 01.8 (UX Polish complete)
- **Features** — Grouped by file independence
- **Tasks** — Atomic, test-gated

### Knowledge Stores
- `.adapt/lessons-learned.md` — Reusable patterns
- `.adapt/shared-context-log.md` — Inter-session communication
- `.adapt/diary.md` — Narrative development log
- `.adapt/reflections/` — I&A Cycle records
- `docs/increments/` — Increment overviews and iteration status

### Commands
- `/adapt:go` — Autonomous project driver
- `/adapt:plan-iteration N` — Plan iteration with Feature graph-partitioning
- `/adapt:run` — Execute Features in parallel waves
- `/adapt:reflect N` — 12-step I&A Cycle
- `/adapt:status` — Project and iteration progress

## Command Center Integration (ADAPT → Kafka)

All ADAPT lifecycle events from this project MUST be published to the STARK
Command Center via the Kafka Gateway. Since this repo doesn't contain the
EventPublisher directly, use the Gateway's REST endpoint or import the
publisher from the `stark-command-center` package.

### Kafka Gateway

- **Endpoint:** `http://localhost:8082` (dev) / configured via `KAFKA_GATEWAY_URL` env var
- **WebSocket:** `ws://localhost:8082/ws` for real-time portal updates
- **Schema Registry:** `http://localhost:8081`

### When to emit events

| ADAPT Lifecycle Point | Event Type | Topic |
|----------------------|------------|-------|
| Feature starts executing | `agent.status` | `stark.platform.agent-status` |
| Task completes | `agent.progress` | `stark.platform.agent-progress` |
| Feature completes | `agent.status` | `stark.platform.agent-status` |
| PR created (per iteration) | `changes.created` | `stark.procurement.changes` |
| PR merged | `changes.resolved` | `stark.procurement.changes` |
| Tests run (per task) | `test.results` | `stark.procurement.test-results` |
| I&A Cycle completes | `agent.status` | `stark.platform.agent-status` |

### Payload conventions

- `source`: `"adapt-agent"`
- `projectId`: `"stark-procurement"`
- `tenantId`: `"stark-group"`
- `correlationId`: Use the Increment ID (e.g., `"increment-01"`)

### BaseEvent schema (all events must include)

```json
{
  "eventId": "<uuid>",
  "eventType": "<from table above>",
  "timestamp": "<ISO 8601>",
  "source": "adapt-agent",
  "idempotencyKey": "<uuid>",
  "schemaVersion": 1,
  "tenantId": "stark-group",
  "correlationId": "increment-01"
}
```

### Integration method (pick one per environment)

1. **Direct import** (monorepo or local dev): Import `EventPublisher` from `stark-command-center/services/kafka/event-publisher.ts`
2. **REST via Gateway** (standalone): POST to `${KAFKA_GATEWAY_URL}/publish` with event JSON
3. **Future: shared npm package** — Extract `@stark/event-publisher` for cross-repo use
