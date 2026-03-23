# STARK Procurement — Project Meta

## Testing

```bash
# Type checking and build verification
npm run build

# Run all tests (when configured)
npm test

# Development server
npm run dev

# Lint (when configured)
npm run lint
```

## Environment

```bash
# Required versions
node --version  # Must be 20+
npm --version   # Must be 10+

# Verify dependencies
npm ls next     # Should show 16.2.1
npm ls dexie    # Should show 4.x
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
- `docs/devmeta/lessons-learned.md` — Reusable patterns
- `docs/devmeta/shared-context-log.md` — Inter-session communication
- `docs/devmeta/diary.md` — Narrative development log
- `docs/devmeta/reflections/` — I&A Cycle records
- `docs/increments/` — Increment overviews and iteration status

### Commands (via Claude Code skills)
- `/adapt:go` — Autonomous project driver
- `/adapt:plan-iteration N` — Plan iteration with Feature graph-partitioning
- `/adapt:run` — Execute Features in parallel waves
- `/adapt:reflect N` — 12-step I&A Cycle
- `/adapt:status` — Project and iteration progress
