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

## 2026-03-22 — UX Polish: Command Center Principles

**Iteration 01.8 complete.** Applied STARK Command Center product experience principles across all list views.

### What Changed

1. **Collapsible Sections** — Lists now grouped by escalation level (Approvals) or status (Invoices). Urgent/Action sections expanded by default, others collapsed. Reduces cognitive load.

2. **Compact Stats Bar** — Replaced 4-5 separate stat cards with inline clickable stats. "15 Total | 14 Active | 7 EDI | 12 PKT" is cleaner than 4 separate boxes.

3. **Lucide Icons** — Removed all emojis from UI. Every icon is now a Lucide React component with semantic naming (PRIcon, InvoiceIcon, WarningIcon, etc.).

4. **Tighter Spacing** — Reduced card padding from p-4 to p-3. Removed redundant borders. Cleaner visual density.

### New Components

- `Icon.tsx` — Lucide icon wrappers
- `CollapsibleSection.tsx` — Expandable groups with escalation styling
- `CompactStats.tsx` — Inline clickable filter stats

### Key Insight

The "state grouping" pattern is powerful for procurement workflows. Users don't want a flat list of 50 approvals — they want "3 Urgent, 5 Action Required, 12 Pending Review" with the ability to collapse what they're not working on right now.

**The hierarchy:** Urgent items demand attention → Action items need decisions → Everything else can wait.

---
