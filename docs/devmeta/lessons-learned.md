# Lessons Learned

> Patterns and gotchas discovered during development. Read before starting work.

---

## TypeScript / Dexie

- **2026-03-22:** Schema uses `Date` types, not ISO strings. Pass `new Date()` not `new Date().toISOString()` to Dexie.
- **2026-03-22:** SyncQueueItem requires `payload` field — include the entity data being synced.
- **2026-03-22:** PRStatus enum doesn't include "cancelled" — use "rejected" for soft delete.

## Tailwind / Next.js 16

- **2026-03-22:** Tailwind v4 uses CSS-based `@theme inline` configuration, not tailwind.config.ts.
- **2026-03-22:** Custom colors defined in globals.css with `--color-*` prefix.

## Design System

- **2026-03-22:** Orange is for ACTION, not decoration. 80% navy/gray, 15% green, 5% orange.
- **2026-03-22:** Escalation left border (orange) indicates "Attention" level items.
