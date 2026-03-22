# STARK Procurement — Project Meta

## Testing

```bash
# Type checking
npm run build

# Run all tests (when configured)
npm test

# Development server
npm run dev
```

## Environment

- Node.js 20+
- Next.js 16.2.1
- Tailwind CSS 4
- Dexie.js for IndexedDB

## Additional Rules

1. **Follow the HTML mockups** — Design files in `docs/design/` are the source of truth
2. **STARK Design System** — Use stark-navy (#001e41), stark-orange (#f08b1d) color scheme
3. **Escalation hierarchy** — Ambient → Awareness → Attention → Action → Urgent
4. **Local-first** — All data in IndexedDB via Dexie, sync queue for future Kafka
5. **Type safety** — No `any` types, strict TypeScript
