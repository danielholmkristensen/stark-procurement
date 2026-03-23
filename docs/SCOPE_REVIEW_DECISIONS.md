# STARK Procurement — Scope Review Decision Log

> **Purpose:** Internal traceability for scope decisions made during review cycles. Feeds into future I&A cycles.
> **Created:** 2026-03-23
> **Status:** Active

---

## Decision Log

### RC-01: Remove Section 3.3 Data Sync (Offline/Dexie)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Section** | 3.3 Data Sync — IN SCOPE |
| **Decision** | REMOVE |
| **Rationale** | Not standard for B2B web portals to live transactional data. Creates ops complexity (conflict resolution, sync debugging, cache invalidation) without clear business value for 30 office-based users on stable networks. Stale data risk outweighs resilience benefit. |
| **Comment origin** | "Not standard, not very useful, creates risk of problems / confusion. Not standard in 'web-portals' towards live data. Makes for complicated and hard-to-understand ops." |
| **Alternative adopted** | Standard request/response with user-visible loading states and retry on failure |
| **Impact** | Removes ~15 lines from scope. Simplifies data layer. Reduces estimation complexity. |

---

### RC-02: Data Storage — Hosting & Maintenance Responsibility

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Section** | 3.1 Data Storage — IN SCOPE |
| **Decision** | CLARIFY — Customer owns infrastructure post-handover |
| **Rationale** | Clean enterprise handover model. Vendor delivers application; customer owns operational infrastructure. Avoids data residency concerns — customer chooses their cloud. |
| **Comment origin** | "who manages maintenance, back-up, etc. Where hosted?" |
| **Resolution** | Added hosting/operations table specifying: (1) European region, hyperscaler or customer-designated provider; (2) Customer owns daily ops after handover including backups, restore testing, maintenance windows; (3) STARK covers DB and infrastructure costs |
| **Impact** | Clarifies scope boundary. Reduces vendor operational liability. Customer retains infrastructure control. |

---

### RC-03/04/05/06/07/09: Kafka-Native Integration Architecture (Consolidated)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Sections** | Domain 4: Integrations (complete rewrite) |
| **Decision** | ARCHITECTURAL SHIFT — Kafka-native integration replaces REST-primary |
| **Comments addressed** | RC-03 (API security), RC-04 (rejection/unavailability), RC-05 (Stark Output), RC-06 (outbound failure), RC-07 (events informational vs transactional), RC-09 (logging destination) |

**Rationale:**

Kafka-native architecture elegantly solves multiple concerns simultaneously:

| Problem (REST) | Solution (Kafka) |
|----------------|------------------|
| API security complexity | Kafka ACLs, SASL/mTLS, topic-level permissions |
| "What if we're down?" | Messages persist. Consumer processes when ready. |
| Stark Output dependency | Just another Kafka consumer |
| Outbound failure handling | Native: offset management, DLQ topics |
| Event payload ambiguity | Lightweight notifications; full data via Status API |
| "Where does logging go?" | Kafka IS the log. Stream to SIEM if needed. |

**Key Architectural Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Topic topology | Per-source inbound, per-consumer outbound | Modularity: isolated monitoring, independent failure domains, clear ownership |
| DLQ pattern | Per-source/per-channel DLQs | Consistent with modularity; easier alerting |
| Kafka hosting | Customer's existing STARK cluster | €0 incremental cost; volume is tiny for Kafka (~600 msg/hr) |
| Vendor deliverable | Specs + code; customer provisions | Clean handover model per RC-02 |
| REST fallback | Yes, for non-Kafka sources | Prudent; internally publishes to Kafka for uniform processing |
| Event payload type | Informational (IDs + metadata) | Full data available via Status API; reduces message size |

**Topic Topology Defined:**

```
INBOUND (per source)
├── stark.procurement.inbound.prs.relex
├── stark.procurement.inbound.prs.ecom
├── stark.procurement.inbound.prs.salesapp
├── stark.procurement.inbound.pos.aspect4
└── [source].dlq (per source)

OUTBOUND (per consumer)
├── stark.procurement.outbound.pos.edi
├── stark.procurement.outbound.pos.email
├── stark.procurement.outbound.finance.invoices
├── stark.procurement.outbound.finance.commitments
└── [channel].dlq (per channel)

EVENTS (informational)
├── stark.procurement.events.pr.received
├── stark.procurement.events.po.created
├── stark.procurement.events.po.sent
├── stark.procurement.events.po.confirmed
├── stark.procurement.events.invoice.matched
└── stark.procurement.events.invoice.approved
```

**Impact:**
- Domain 4 completely rewritten (~200 lines replaced)
- Cleaner security model (Kafka ACLs vs per-endpoint auth)
- Built-in resilience (no custom retry/DLQ code needed beyond Kafka patterns)
- Clear vendor/customer boundary (we deliver code, they provision infrastructure)
- Addresses 6 review comments with one architectural decision

---

### RC-10/11/31: Users, Roles & Agentic Capabilities

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Decision** | SPLIT — Core approval workflow in scope, agentic capabilities in separate document |
| **Comments addressed** | RC-10 (RBAC/role management), RC-11 (user types in intro), #31 (Users & Roles missing) |

**Resolution:**

1. **In SCOPE_DEFINITION.md:** Add comprehensive Users & Roles section with:
   - User population breakdown (Buyer ~20, Approver ~8, Admin ~2)
   - Role definitions and responsibilities
   - Permission matrix (screen/action by role)
   - Approval workflow detail:
     - Per-user authority limits (not just per-role)
     - Multi-level approval chains (4-eyes principle)
     - Delegation/proxy approval
     - Bulk approval with constraints
     - Separation of duties

2. **In POSSIBLE_AUTOMATION.md (new file):** Full agentic capability analysis including:
   - 7 proposed agent types
   - Agent governance framework
   - Agent authority matrix
   - Business case analysis
   - Implementation phasing
   - Risk considerations

**Rationale:** Approval workflow is core procurement functionality and must be in scope. Agentic capabilities are transformative but represent potential future phases — keeping them separate allows focused scope discussion while preserving the vision.

---

### RC-12: Remove "Agentic Development" Reference

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Section** | Delivery Model |
| **Decision** | REMOVE — Replace with neutral "Delivery Principles" |
| **Comment origin** | "This project uses agentic development — AI-assisted coding at 8x traditional velocity - Hvis Kim er medlæser, måske ikke have dette med :-)" |
| **Resolution** | Removed "Agentic Development" section with velocity metrics. Replaced with neutral "Delivery Principles" focusing on working software, continuous feedback, flexibility within tiers. Company name "Agentic Agency" retained (that's the entity, not a methodology claim). |
| **Impact** | Removes potentially sensitive claims about AI velocity multipliers from customer-facing document. |

---

