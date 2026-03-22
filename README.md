# STARK Procurement

**A procurement management application for STARK Group handling purchase requisitions, purchase orders, supplier management, invoice matching, and approvals.**

This is one of several STARK applications built on the [STARK Command Center](https://github.com/theagenticagency/stark-command-center) platform. It inherits the platform's design system, feedback agent, and event infrastructure.

---

## Table of Contents

- [What This Is](#what-this-is)
- [Platform Relationship](#platform-relationship)
- [Key Numbers](#key-numbers)
- [Application Modules](#application-modules)
- [Tech Stack](#tech-stack)
- [Core Business Logic](#core-business-logic)
- [System Integrations](#system-integrations)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Kafka Topics](#kafka-topics)
- [Scope Tags](#scope-tags)

---

## What This Is

STARK Procurement is the **first application** built on the STARK Command Center platform. It modernizes STARK Group's procurement operations, replacing manual processes in the legacy Aspect4 system with intelligent automation.

| Attribute | Value |
|-----------|-------|
| **Client** | STARK Group (Denmark) |
| **Domain** | Procurement / Purchase-to-Pay |
| **Users** | 30 procurement specialists |
| **Scale** | 750,000 POs/year, €1.1B annual value |

**Primary value proposition:** Intelligent PO bundling with packet labeling — combining orders to the same supplier while maintaining per-PR separation for efficient receiving.

---

## Platform Relationship

STARK Procurement **inherits** from STARK Command Center. The platform provides shared infrastructure; this project provides domain-specific functionality.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STARK COMMAND CENTER (Platform)                                        │
│  ├── Design System (tokens, components) ───────────► INHERITS          │
│  ├── Feedback Agent (collection service) ──────────► USES              │
│  ├── Screen Registry (central index) ──────────────► REGISTERS TO      │
│  └── Change Tracker (feedback workflow) ───────────► FEEDS INTO        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STARK PROCUREMENT (This Repository)                                    │
│  ├── 5 application modules (PRs, POs, Suppliers, Invoices, Approvals)  │
│  ├── Domain components (PR cards, PO bundling, invoice match)          │
│  ├── Business rules (PR→PO conversion, bundling, matching)             │
│  └── Project-specific Kafka topics (stark.procurement.*)               │
└─────────────────────────────────────────────────────────────────────────┘
```

### What This Project Inherits

| Component | Source | Mechanism |
|-----------|--------|-----------|
| Design System | `command.stark.dev/design-system/` | CDN import |
| Escalation Hierarchy | Platform tokens | CSS variables |
| Feedback Agent | `command.stark.dev/feedback-agent/widget.js` | Script embed |

### What This Project Owns

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Module pages | `src/app/{prs,pos,suppliers,invoices,approvals}/` | Domain UI |
| Domain components | `src/components/{pr,po,supplier,invoice,approval}/` | Business-specific UI |
| Business logic | `src/lib/` | Rules, validation, calculations |
| Data hooks | `src/hooks/` | Data fetching and state |

---

## Key Numbers

| Metric | Value |
|--------|-------|
| POs per year | 750,000 |
| Annual PO value | €1.1B |
| Suppliers | 10,000 |
| Branches | 84 |
| Procurement users | 30 |
| PRs from Relex (automated) | ~70% |
| Direct-to-customer delivery | ~33% of sales |

---

## Application Modules

### 1. Purchase Requisitions (PRs)

**Route:** `/prs`

Manage incoming purchase requests from multiple sources.

| Page | Route | Purpose |
|------|-------|---------|
| PR List | `/prs` | View and filter all PRs |
| PR Detail | `/prs/[id]` | Individual PR with line items |
| Ingestion Monitor | `/prs/ingestion` | Track PR ingest from sources |
| PR-to-PO Linking | `/prs/linking` | Map PRs to purchase orders |
| Sources Dashboard | `/prs/sources` | Monitor Relex, ECom, SalesApp feeds |

**PR Sources:**
- **Relex (SCP)** — Automated replenishment (~70% of PRs)
- **ECom** — Drop-shipment orders from stark.dk
- **SalesApp** — Salesperson-initiated requests

### 2. Purchase Orders (POs)

**Route:** `/pos`

Convert PRs to bundled purchase orders and track through fulfillment.

| Page | Route | Purpose |
|------|-------|---------|
| PO List | `/pos` | View and filter all POs |
| PO Detail | `/pos/[id]` | Order details, timeline, status |
| Kanban Board | `/pos/kanban` | Visual pipeline by status |

**Key Features:**
- Intelligent bundling (same supplier + location + timing)
- Packet labeling for per-PR separation
- Timeline visualization from creation to delivery

### 3. Suppliers

**Route:** `/suppliers`

Manage supplier master data and performance.

| Page | Route | Purpose |
|------|-------|---------|
| Supplier List | `/suppliers` | Browse all suppliers |
| Supplier Detail | `/suppliers/[id]` | Contact, capabilities, performance |

**Key Data:**
- `supports_packet_labeling` — Critical for bundling eligibility
- Lead times and delivery windows
- Communication preferences (EDI, email, portal)

### 4. Invoices

**Route:** `/invoices`

Match invoices to POs and goods receipts.

| Page | Route | Purpose |
|------|-------|---------|
| Invoice List | `/invoices` | All invoices with match status |
| Invoice Detail | `/invoices/[id]` | Line-level matching details |
| Match Results | `/invoices/match-results` | Successful matches for review |
| Discrepancy Queue | `/invoices/discrepancies` | Exceptions requiring resolution |

**Matching Types:**
- **2-way match:** Invoice ↔ PO
- **3-way match:** Invoice ↔ PO ↔ Goods Receipt

### 5. Approvals

**Route:** `/approvals`

Workflow for procurement approvals based on value thresholds.

| Page | Route | Purpose |
|------|-------|---------|
| Approval Queue | `/approvals` | Pending items requiring action |
| Approval History | `/approvals/history` | Completed approvals audit trail |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| State | TanStack Query, React Hook Form |
| Tables | TanStack Table |
| Charts | Recharts |
| Local DB | Dexie (IndexedDB) |
| Drag & Drop | dnd-kit |
| Validation | Zod |
| Icons | Lucide React |

---

## Core Business Logic

### PR → PO Conversion

1. **Relex/ECom PRs:** Convert to PO within 1 hour (or at next cut-off)
2. **SalesApp PRs:** Convert based on `po_send_timing` field
3. **Bundling rule:** Same supplier + same location + compatible timing

### PO Bundling (Critical Feature)

The primary value-add over legacy Aspect4:

```
PR-001 (Branch A, Supplier X, 10 items)  ─┐
PR-002 (Branch A, Supplier X, 5 items)   ─┼─► PO-001 (15 items, 2 packets)
                                          │
PR-003 (Branch B, Supplier X, 8 items)   ─┴─► PO-002 (8 items, 1 packet)
```

**Packet labeling requirement:**
- Each bundled PO must specify items per-PR ("packets")
- Supplier packages separately per packet
- Without this, receiving/sorting becomes unmanageable
- Check `supports_packet_labeling` in supplier master before bundling

### Invoice Matching

| Match Type | Comparison | Use Case |
|------------|------------|----------|
| 2-way | Invoice ↔ PO | Services, non-inventory |
| 3-way | Invoice ↔ PO ↔ GR | Standard inventory purchases |

**Tolerance rules:** Configurable per-supplier for quantity and price variances.

---

## System Integrations

### Current Integrations [LIVE]

| System | Purpose | Protocol |
|--------|---------|----------|
| Aspect4 | Legacy PO routing (interim) | API |
| Relex (SCP) | Automated replenishment PRs | Kafka |
| ECom | Drop-shipment PRs | API |
| EDI Gateway | Supplier communication | EDI/AS2 |
| Descartes TMS | Transportation management | API |
| Stark Output | Document generation | API |

### Planned Integrations [FUTURE]

| System | Purpose | Dependency |
|--------|---------|------------|
| NYCE (WMS) | Goods receipt, STOs | WMS deployment |
| SAP Finance | Invoice to payment | Finance module go-live |
| SalesApp | Salesperson PRs | App enhancement |
| Pricing Domain | Dynamic pricing | Domain deployment |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm or pnpm

### Installation

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at **http://localhost:3000** (or next available port).

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
app/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard (home)
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── prs/                  # Purchase Requisitions module
│   │   │   ├── page.tsx          # PR list
│   │   │   ├── [id]/page.tsx     # PR detail
│   │   │   ├── ingestion/        # Ingestion monitor
│   │   │   ├── linking/          # PR-to-PO linking
│   │   │   └── sources/          # Sources dashboard
│   │   ├── pos/                  # Purchase Orders module
│   │   │   ├── page.tsx          # PO list
│   │   │   ├── [id]/page.tsx     # PO detail
│   │   │   └── kanban/           # Kanban board
│   │   ├── suppliers/            # Suppliers module
│   │   │   ├── page.tsx          # Supplier list
│   │   │   └── [id]/page.tsx     # Supplier detail
│   │   ├── invoices/             # Invoices module
│   │   │   ├── page.tsx          # Invoice list
│   │   │   ├── [id]/page.tsx     # Invoice detail
│   │   │   ├── match-results/    # Match results
│   │   │   └── discrepancies/    # Discrepancy queue
│   │   └── approvals/            # Approvals module
│   │       ├── page.tsx          # Approval queue
│   │       └── history/          # Approval history
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── KPICard.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── domain/               # Cross-cutting domain components
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── POPipeline.tsx
│   │   │   └── PendingApprovals.tsx
│   │   ├── escalation/           # Escalation hierarchy
│   │   │   └── EscalationLegend.tsx
│   │   ├── pr/                   # PR-specific components
│   │   ├── po/                   # PO-specific components
│   │   ├── supplier/             # Supplier-specific components
│   │   ├── invoice/              # Invoice-specific components
│   │   └── approval/             # Approval-specific components
│   │
│   ├── hooks/                    # React hooks
│   │   ├── usePurchaseRequests.ts
│   │   ├── usePurchaseOrders.ts
│   │   ├── useSuppliers.ts
│   │   ├── useInvoices.ts
│   │   └── useApprovals.ts
│   │
│   └── lib/                      # Utilities and business logic
│       ├── utils.ts              # Helper functions
│       └── db/                   # Local database (Dexie)
│           ├── index.ts
│           ├── schema.ts
│           └── seed.ts
│
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## Kafka Topics

### Inbound (from Command Center)

```
stark.platform.design.tokens.updated       # Design system changes
stark.procurement.prod.changes.assigned    # Assigned feedback changes
```

### Outbound (to Command Center)

```
stark.platform.screens.registered          # Screen registry updates
stark.platform.feedback.received           # User feedback (via widget)
stark.procurement.dev.claude.code.changes  # Code changes
```

### Project-Specific

```
stark.procurement.dev.claude.code.changes       # File creates/edits/deletes
stark.procurement.dev.claude.schema.evolution   # Data model changes
stark.procurement.dev.claude.decisions.logged   # Architectural decisions
stark.procurement.prod.health.system.heartbeat  # System availability
stark.procurement.prod.integration.po.sent      # PO sent to supplier
```

---

## Scope Tags

All features use scope tags to indicate delivery readiness:

| Tag | Meaning |
|-----|---------|
| `[CURRENT]` | Can be delivered now, works with existing systems |
| `[FUTURE]` | Requires other systems to be ready first |
| `[TOGGLE-READY]` | Build now with feature flag, activate when dependencies ready |
| `[HARD-DEPENDENCY]` | Cannot function until dependency is live |

**Current delivery scope:** All [CURRENT] and [TOGGLE-READY] features.

---

## Design Principles

### Escalation Hierarchy

Inherited from Command Center. Orange is earned, not default.

| Level | Visual | Meaning |
|-------|--------|---------|
| Ambient | Navy dot | "Something's new" |
| Awareness | Navy badge | "When you have a moment" |
| Attention | Orange border | "This needs your eyes" |
| Action | Orange button | "Do this now" |
| Urgent | Pulsing orange | "Time-sensitive" |

### Color Ratio

- **80%** Navy/Gray — Default UI
- **15%** Green — Success states
- **5%** Orange — Action required

---

## Related Repositories

| Repository | Purpose |
|------------|---------|
| [stark-command-center](https://github.com/theagenticagency/stark-command-center) | Platform layer (Design System, Feedback Agent, etc.) |
| stark-logistics | Warehouse and shipping (planned Q2) |
| stark-finance | Budgeting and reporting (planned Q3) |

---

## License

Proprietary — Agentic Agency / STARK Group
