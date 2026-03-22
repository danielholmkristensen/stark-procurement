# Development Diary

> Narrative entries for significant moments. Not every task — just the important ones.

---

## 2026-03-22 — ADAPT Bootstrap

Starting Increment 01: STARK Procurement Front-End Foundation.

Previous ad-hoc work built a static dashboard with mock data (~5% complete). Now switching to ADAPT methodology for systematic execution.

**Scope:** 6 iterations covering Foundation, PR Module, PO Module, Invoice/Matching, Suppliers/Approvals, and Polish/Testing.

**Key insight:** The HTML mockups in `docs/design/` are comprehensive — pr-module.html has all 5 PR screens (A1-A5). Following these exactly will ensure design consistency.

**First iteration focus:** Wire up routing, create IndexedDB hooks for all entities, seed mock data, and build form components.

---

## 2026-03-22 — Lindstrøm Visual Hierarchy Implementation

**Critical design update:** Implemented the Lindstrøm Escalation Hierarchy across all list views.

### The Hierarchy (Orange is Earned, Not Default)

| Level | Label | Visual Treatment |
|-------|-------|------------------|
| Ambient | New | Small navy dot, barely visible |
| Awareness | Pending | Navy dot and badge |
| Attention | Review | Orange tint on dot, subtle background |
| Action | Action | Orange dot and accented badge |
| Urgent | Urgent | Pulsing orange, prominent background |

### Components Created

**EscalationIndicator.tsx** — Core visual hierarchy component:
- `EscalationIndicator` — Dot indicator with optional label
- `EscalationBadge` — Badge with label for prominence
- `getEscalationCardClass()` — Card background styling
- `getEscalationBadgeClass()` — Badge styling utility

### Applied To

- ✅ PRList.tsx — Dot + left border tint
- ✅ POList.tsx — Dot + left border tint
- ✅ ApprovalQueue.tsx — Dot + Badge + card background
- ✅ InvoiceList.tsx — Dot + left border tint
- ✅ InvoiceDiscrepancyQueue.tsx — Dot + Badge + card background

### Color Code Cleanup

Also fixed all color violations across 19+ files — removed purple, blue, red, teal. Now using only:
- Navy (80%) — Primary text, badges, borders
- Green (15%) — Success states only
- Orange (5%) — Action required, escalation

**Key insight:** Visual intensity should increase with urgency. Ambient items should be barely noticeable; urgent items demand immediate attention through animation and color.

---
