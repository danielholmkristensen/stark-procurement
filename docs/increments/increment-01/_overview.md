# Increment 01 — STARK Procurement Front-End Foundation

**Status:** IN PROGRESS
**Started:** 2026-03-22
**Goal:** Build a fully functional local-first procurement dashboard with PR, PO, Invoice, and Supplier modules following the STARK design system mockups.

---

## What This Increment Produces

### On screen
- Dashboard with live KPIs, PO Pipeline, Activity Feed, Pending Approvals
- PR Module (5 screens: A1-A5) — List, Detail, Sources, Ingestion Monitor, PR-to-PO Linking
- PO Module — List, Detail, Bundling Preview, Send Confirmation
- Invoice Module — List, Detail, Matching View
- Supplier Module — List, Detail
- Approval Queue — Centralized approval workflow
- Navigation between all screens with proper routing

### Under the hood
- Tailwind configuration with STARK design tokens (complete)
- IndexedDB/Dexie integration for all entities
- React hooks for data access (usePurchaseRequests exists, need PO/Invoice/Supplier)
- Component library (Badge, Card, Button, KPICard, etc.) (partial)
- Form components for data entry
- Mock data seeding for demo/testing

### Testing delivered
- Component tests for UI components
- Integration tests for data flows
- E2E tests for critical user journeys

---

## What This Increment Does NOT Include

| Deferred | Why | Which Increment |
|----------|-----|-----------------|
| Kafka integration | Platform service not ready | Increment 02 |
| Real-time sync | Requires Kafka | Increment 02 |
| Authentication | Command Center provides | Increment 02 |
| Feedback Agent widget | Platform component | Increment 02 |
| EDI/Email sending | Backend integration | Increment 03 |

---

## Iteration Map

| # | Title | What Gets Built |
|:--:|-------|-----------------|
| 01.1 | Foundation & Navigation | Router setup, page shells, navigation, IndexedDB hooks |
| 01.2 | PR Module Complete | A1-A5 screens fully functional with data |
| 01.3 | PO Module Complete | PO list, detail, bundling preview, send flow |
| 01.4 | Invoice & Matching | Invoice list, detail, matching workflow |
| 01.5 | Suppliers & Approvals | Supplier management, approval queue |
| 01.6 | Polish & Testing | E2E tests, edge cases, performance |

---

## Detailed Iterations

### Iteration 01.1 — Foundation & Navigation

**Deliverables:**
- Next.js App Router setup with all route shells
- Working navigation (header links functional)
- IndexedDB hooks for PO, Invoice, Supplier, Approval
- Mock data seeder (npm run seed)
- Base form components (Input, Select, DatePicker, etc.)

**Verify on screen:**
- Navigate to /prs, /pos, /invoices, /suppliers, /approvals — each shows a page shell
- Run `npm run seed` — IndexedDB populated with sample data
- Dashboard shows data from IndexedDB

### Iteration 01.2 — PR Module Complete

**Deliverables:**
- A1: PR List with filters, search, pagination, data from IndexedDB
- A2: PR Detail with line items, actions, supplier suggestions
- A3: PR Sources Dashboard with charts
- A4: Ingestion Monitor with real-time status
- A5: PR-to-PO Linking view

**Verify on screen:**
- /prs shows filtered list from IndexedDB
- Click PR → navigates to /prs/[id] with full detail
- Click "Add to Bundle" → starts PO creation flow
- /prs/sources shows breakdown by source
- /prs/ingestion shows activity log

### Iteration 01.3 — PO Module Complete

**Deliverables:**
- PO List with status filters (Draft, Sent, Confirmed, Received)
- PO Detail with line items, PR linkage
- Bundling Preview (group PRs into PO)
- Send Confirmation dialog
- PO Pipeline component with drag-drop (optional)

**Verify on screen:**
- /pos shows PO list with status badges
- Click PO → navigates to /pos/[id] with linked PRs
- Click "Bundle PRs" → shows bundling preview
- Click "Send PO" → confirmation dialog, updates status

### Iteration 01.4 — Invoice & Matching

**Deliverables:**
- Invoice List with match status indicators
- Invoice Detail with line items
- Matching View (side-by-side PO vs Invoice)
- Discrepancy handling UI
- Match action buttons

**Verify on screen:**
- /invoices shows list with match status
- Click invoice → navigates to /invoices/[id]
- Shows matching view with variance highlighting
- Can approve/reject matches

### Iteration 01.5 — Suppliers & Approvals

**Deliverables:**
- Supplier List with search
- Supplier Detail with performance metrics
- Approval Queue (consolidated view)
- Approval Detail with context
- Approve/Reject actions

**Verify on screen:**
- /suppliers shows supplier list
- Click supplier → navigates to /suppliers/[id] with metrics
- /approvals shows pending approvals across entities
- Can approve/reject from queue

### Iteration 01.6 — Polish & Testing

**Deliverables:**
- E2E tests for critical flows (PR creation, PO send, Invoice match)
- Edge case handling (empty states, loading states, error states)
- Performance optimization (virtualized lists if needed)
- Documentation update

**Verify on screen:**
- `npm test` — all tests pass
- Empty database shows proper empty states
- Loading states visible during data fetch
- No console errors

---

## Exit Criteria

- [ ] All 6 iterations complete
- [ ] Navigation works between all screens
- [ ] CRUD operations functional for all entities
- [ ] Data persists in IndexedDB
- [ ] UI matches HTML mockup designs
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Build succeeds

---

## Blocked Items

- None — this is a local-first build with no external dependencies

---

## Design Reference

- Dashboard: `docs/design/mockup-dashboard.html`
- PR Module: `docs/design/screens/stark/pr-module.html`
