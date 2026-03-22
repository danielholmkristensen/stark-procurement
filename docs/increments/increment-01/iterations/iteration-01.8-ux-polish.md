# Iteration 01.8 — UX Polish & State Grouping

**Status:** IN PROGRESS
**Started:** 2026-03-22
**Goal:** Apply Command Center product experience principles across all list views

---

## Analysis from Screenshots

### Issues Identified

| Page | Issue | Fix |
|------|-------|-----|
| Approvals | 5 summary cards spread too wide | Consolidate to inline stats |
| Approvals | Standard ⚠️ emoji | Use Lucide AlertTriangle icon |
| Approvals | Flat list, no grouping | Group by escalation level, collapsible |
| Invoices | Status badges use green/blue | Navy 80%, Green success only |
| Invoices | Flat table, no state grouping | Group by status with collapse |
| PRs | Date input shows "dd/mm/yyyy" | Proper placeholder styling |
| PRs | Blue/Green/Red status badges | Navy-based status system |
| PRs | No escalation indicators visible | Add EscalationIndicator |
| Suppliers | 4 separate stat cards | Inline compact stats |
| All | Too much box padding | Tighter spacing |

---

## Command Center Principles Applied

1. **Orange is Earned** — Only urgent/action items get orange
2. **80/15/5 Color Rule** — Navy 80%, Green 15%, Orange 5%
3. **Grouping by State** — Bundle items by escalation/status
4. **Collapsible Sections** — Reduce cognitive load
5. **Custom Icons** — Lucide React, not emojis
6. **Tighter Spacing** — 4px base unit, semantic spacing tokens

---

## Deliverables

### Feature 1: Icon System
- [x] Create Icon component wrapping Lucide
- [x] Replace all emojis with Lucide icons
- [x] Entity icons: FileText (PR), Package (PO), Receipt (Invoice), Building (Supplier)
- [x] Action icons: AlertTriangle (warning), Check (success), X (error)

### Feature 2: Collapsible State Groups
- [x] Create CollapsibleSection component
- [x] Group approvals by escalation level
- [x] Group invoices by status
- [ ] Group PRs by status (deferred - table layout preferred)
- [x] Default: Urgent/Action expanded, others collapsed

### Feature 3: Compact Stats Bar
- [x] Replace 4-5 stat cards with inline stats row
- [x] Clickable to filter by that state
- [x] Active state indicator

### Feature 4: Badge Consistency
- [x] Remove blue status badges
- [x] Remove red status badges (use orange for action-required)
- [x] Success = green, Pending = navy, Action = orange

### Feature 5: Spacing Polish
- [x] Reduce card padding from p-4 to p-3
- [x] Tighten filter bar spacing
- [x] Remove redundant borders

---

## Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| Icon.tsx | ui/Icon.tsx | Lucide icon wrappers with semantic names |
| CollapsibleSection.tsx | ui/CollapsibleSection.tsx | Expandable groups |
| CompactStats.tsx | ui/CompactStats.tsx | Inline clickable stats |

## Components Updated

| Component | Changes |
|-----------|---------|
| ApprovalQueue.tsx | Collapsible by escalation, compact stats, Lucide icons |
| InvoiceList.tsx | Collapsible by status, compact stats |
| SupplierList.tsx | Compact stats, tighter spacing |

---

## Exit Criteria

- [x] No emoji icons remain (all Lucide)
- [x] Lists grouped by state with collapse
- [x] Color rule: Navy 80%, Green 15%, Orange 5%
- [x] Consistent badge colors across all pages
- [x] Build passes
- [ ] Manual visual review passes
