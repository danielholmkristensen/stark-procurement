# STARK Procurement — Scope Definition

> **Document Purpose:** Vendor-ready, MECE scope definition for fixed-price delivery
> **Version:** 1.0 DRAFT
> **Date:** 2026-03-22
> **Status:** For Discussion

---

## Executive Summary

### What We Are Building

A **Procurement System** that handles the complete Purchase-to-Pay workflow for STARK Group Denmark:

```
PR Ingestion → PO Generation → Supplier Communication → Invoice Matching → Approval
```

### What We Are NOT Building

- Warehouse Management (NYCE team)
- Financial Accounting (SAP Finance team)
- E-commerce Platform (ECom team)
- Demand Planning (Relex team)
- Contract Management (Icertis team)

### Scale

| Metric | Annual Volume |
|--------|---------------|
| Purchase Orders | 750,000 |
| PO Value | €1.1B |
| Suppliers | 10,000 |
| Branches | 84 |
| System Users | 30 procurement staff |

---

## Users & Roles

### User Population

| Role | Count (est.) | Primary Function |
|------|--------------|------------------|
| **Buyer** | ~20 | PR review, PO creation, bundling, invoice matching |
| **Approver** | ~8 | PO approval, invoice approval, exception handling |
| **Admin** | ~2 | System configuration, user support, reporting |
| **Total** | **~30** | |

### Role Definitions

| Role | Description |
|------|-------------|
| **Buyer** | Day-to-day procurement operations. Reviews PRs, creates/sends POs, matches invoices, resolves discrepancies within tolerance. Cannot approve above their personal authority limit. |
| **Approver** | Decision authority for high-value transactions. Approves POs and invoices above threshold. Handles escalated discrepancies. May also perform Buyer functions. |
| **Admin** | System configuration and support. Manages thresholds, supplier preferences, cut-off times, user authority limits, and delegations. No transactional authority beyond Approver role. |

### Permission Matrix

| Screen / Action | Buyer | Approver | Admin |
|-----------------|-------|----------|-------|
| **Dashboard** | View own KPIs | View team KPIs | View all KPIs |
| **PR Inbox** | View, convert to PO | View, convert to PO | View only |
| **PO Create/Edit** | Yes (draft) | Yes (draft) | No |
| **PO Send** | Within own limit | Within own limit | No |
| **PO Approve** | No | Yes | No |
| **Bundling Workspace** | Yes | Yes | View only |
| **Invoice Match** | Yes | Yes | View only |
| **Invoice Approve** | Within own limit | Within own limit | No |
| **Discrepancy Resolve** | Within tolerance | Any | No |
| **Supplier Preferences** | View | View | Edit |
| **Threshold Config** | No | No | Yes |
| **User Authority Config** | No | No | Yes |
| **Delegation Management** | Own only | Own only | Any user |

### Who Is NOT a User

| Persona | Why Not | How They Interact |
|---------|---------|-------------------|
| Suppliers | No portal in Phase 1 | Receive POs via EDI/email |
| Finance/AP | SAP Finance users | Consume approved invoices via Kafka |
| Warehouse | NYCE users | Future: goods receipt integration |
| Branch Managers | BI/reporting tools | No direct system access |

### Role Management — OUT OF SCOPE

| Capability | Reason |
|------------|--------|
| Role assignment UI | Roles managed in STARK SSO/IAM |
| Role creation | Fixed roles: Buyer, Approver, Admin |
| Custom permission editor | Fixed permission matrix per above |

**Note:** We consume roles from SSO token claims. No role table in our database.

---

## Approval Workflow

### Authority Matrix (Per-User Limits)

Each user has an individual approval authority limit, not just role-based:

| Attribute | Description |
|-----------|-------------|
| `approvalLimitDKK` | Maximum value user can approve per transaction |
| `effectiveFrom` | When limit becomes active |
| `effectiveTo` | When limit expires (nullable = indefinite) |
| `setBy` | Admin who configured the limit |

**Example:**

| User | Role | Approval Limit (DKK) |
|------|------|---------------------|
| Anna Jensen | Buyer | 10,000 |
| Erik Nielsen | Buyer | 25,000 |
| Mette Hansen | Approver | 100,000 |
| Lars Pedersen | Approver | 500,000 |
| CFO | Approver | Unlimited |

**Behavior:** User can approve up to their limit. Above limit → item routes to someone with higher authority.

### Multi-Level Approval (4-Eyes Principle)

Configurable approval chains for high-value transactions:

| PO/Invoice Value (DKK) | Required Approvals |
|------------------------|-------------------|
| < 10,000 | Single approval (within approver's limit) |
| 10,000 – 50,000 | 2 approvals required |
| 50,000 – 200,000 | 3 approvals required |
| > 200,000 | 4 approvals required (includes CFO) |

**Rules:**
- Each approver must be a different person
- Each approver must have sufficient authority for their portion
- Chain is sequential (Approver 1 → Approver 2 → ...)
- Auto-escalate after 48h if not actioned

### Delegation (Proxy Approval)

| Attribute | Description |
|-----------|-------------|
| `delegatorId` | User granting authority |
| `delegateId` | User receiving authority |
| `startDate` | When delegation activates |
| `endDate` | When delegation expires (auto-expire) |
| `scope` | ALL, PO_ONLY, INVOICE_ONLY |
| `maxValueDKK` | Optional cap on delegated authority |

**Setup options:**
- **Self-service:** User delegates via their profile
- **Admin:** Admin sets delegation for any user

**Audit trail:** "Approved by [delegate] on behalf of [delegator]"

**Notifications:** Delegator notified of actions taken on their behalf

### Bulk Approval

| Capability | Constraint |
|------------|------------|
| Multi-select in queue | Checkbox per item |
| Bulk approve action | Single click for selected items |
| Authority check | Each item must be within user's limit |
| Same-type requirement | Cannot mix POs and Invoices in one bulk action |
| Review before confirm | Must expand summary before confirming |
| Individual audit | Each item logged separately |

### Separation of Duties

| Rule | Enforcement |
|------|-------------|
| No self-approval | Cannot approve PR/PO/Invoice you created |
| Distinct chain approvers | Multi-level chain requires different users |
| Admin override | Admin can override with documented reason (audit logged) |

### Admin UI for Approval Configuration

| Screen | Function | Location |
|--------|----------|----------|
| User Authority | Set per-user approval limits | Settings > Users |
| Approval Chains | Define value thresholds and required approvers | Settings > Approval Rules |
| Delegation Management | View/edit all active delegations | Settings > Delegations |
| Approval Audit Log | View all approval actions with full context | Reports > Audit |

---

## Scope Structure

This document defines scope across **5 mutually exclusive domains**:

| Domain | What It Covers |
|--------|----------------|
| **1. User Interface** | Screens, components, interactions |
| **2. Business Logic** | Rules, calculations, workflows |
| **3. Data Layer** | Storage, queries, synchronization |
| **4. Integrations** | Inbound data, outbound data, APIs |
| **5. Operations** | Infrastructure, deployment, monitoring |

For each domain, we define:
- **IN** — We build, we own, we deliver
- **OUT** — Someone else owns, we don't touch
- **BOUNDARY** — Exact handoff point

---

## Domain 1: User Interface

### 1.1 Screens — IN SCOPE

| Screen ID | Name | Purpose |
|-----------|------|---------|
| A1 | PR Inbox | View and manage incoming purchase requests |
| A2 | PR Detail | Individual PR with line items |
| B1 | PO List | View and manage purchase orders |
| B2 | PO Detail | Individual PO with supplier, items, status |
| B3 | PO Kanban | Visual pipeline (Draft → Sent → Confirmed → Received) |
| C1 | Bundling Workspace | Group PRs into optimized POs |
| D1 | Invoice List | View and manage supplier invoices |
| D2 | Invoice Detail | Individual invoice with matching status |
| D3 | Match Results | Side-by-side PO vs Invoice comparison |
| D4 | Discrepancy Queue | Invoices requiring manual resolution |
| E1 | Approval Queue | Items awaiting approval |
| E2 | Approval History | Audit trail of decisions |
| F1 | Supplier List | Supplier master data |
| F2 | Supplier Detail | Individual supplier with performance |
| G1 | Dashboard | Morning briefing, action items, KPIs |
| H1 | Settings | User preferences, thresholds |

**Total: 16 screens**

### 1.2 UI Components — IN SCOPE

| Component | Description |
|-----------|-------------|
| Design System | STARK brand colors, typography, spacing |
| Escalation Hierarchy | 5-level visual urgency (ambient → urgent) |
| Data Tables | Sortable, filterable, groupable lists |
| Collapsible Sections | Grouped views with expand/collapse |
| Guidance Banners | Action-oriented messaging |
| Status Badges | Visual status indicators |
| Form Components | Inputs, selects, date pickers |
| Mobile Responsive | Works on tablet/phone |

### 1.3 UI — OUT OF SCOPE

| Item | Owner |
|------|-------|
| Supplier-facing portal | Future enhancement |
| Native mobile app | Future enhancement |
| Email templates design | Stark Output team |
| EDI message formatting | Stark Output team |

### 1.4 UI — BOUNDARY

| Handoff | Our Side | Their Side |
|---------|----------|------------|
| Design System | Consume platform tokens | Command Center publishes tokens |
| Authentication | Display user context | SSO provider handles login |
| Notifications | Display in-app alerts | Email/SMS via external service |

---

## Domain 2: Business Logic

### 2.1 PR Processing — IN SCOPE

| Rule | Description | Acceptance Criteria |
|------|-------------|---------------------|
| PR Validation | Validate incoming PR data | Required fields present, valid supplier ID, positive quantities |
| PR Deduplication | Detect duplicate PRs | Same source + reference = reject with 409 |
| Source Routing | Handle PR differently by source | Relex: batch at cut-off, ECom: immediate, SalesApp: per timing field |
| Urgency Calculation | Assign escalation level | Based on value, age, need-by date |

### 2.2 PO Generation — IN SCOPE

| Rule | Description | Acceptance Criteria |
|------|-------------|---------------------|
| Single PR → PO | Convert one PR to one PO | 1:1 mapping, all line items transferred |
| Bundling | Combine PRs into one PO | Same supplier + same location + compatible timing |
| Packet Specification | Mark items per-PR in bundled PO | Supplier receives clear picking instructions |
| Cut-off Timing | Send PO at supplier cut-off | Configurable per supplier, default to immediate |
| PO Numbering | Generate unique PO number | Sequential, format: PO-YYYY-NNNNN |

### 2.3 Pricing — IN SCOPE

| Rule | Description | Acceptance Criteria |
|------|-------------|---------------------|
| Use PR Price | Default to price from PR | When `fixedPrice = true` on PR |
| Fallback Pricing | Use price table when no PR price | Lookup by SKU + supplier |
| Price Variance Flag | Alert when prices differ | Threshold: 5% variance |

### 2.4 Pricing — OUT OF SCOPE

| Item | Owner | Our Workaround |
|------|-------|----------------|
| Dynamic pricing lookup | Pricing Domain team | Use PR price or fallback table |
| Contract price enforcement | Icertis team | Manual verification |
| Currency conversion | SAP Finance team | Store in original currency |

### 2.5 Invoice Matching — IN SCOPE

| Rule | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 2-Way Match | Compare Invoice to PO | Match on PO number, line items, quantities, prices |
| Tolerance Rules | Allow minor variances | Qty: ±2%, Price: ±1%, Total: ±DKK 100 |
| Discrepancy Detection | Flag mismatches | Qty mismatch, price mismatch, missing PO |
| Auto-Approve | Pass matching invoices | Full match within tolerance = auto-approve |

### 2.6 Invoice Matching — OUT OF SCOPE

| Item | Owner | Our Workaround |
|------|-------|----------------|
| 3-Way Match (with Goods Receipt) | NYCE team | 2-way match only until NYCE ready |
| Goods Receipt creation | NYCE team | Manual GR entry option |
| Payment execution | SAP Finance team | Export approved invoices |

### 2.7 Approval Workflow — IN SCOPE

| Rule | Description | Acceptance Criteria |
|------|-------------|---------------------|
| Threshold Routing | Route to approver by value | Configurable thresholds per user role |
| Delegation | Handle approver absence | Delegate to alternate approver |
| Escalation | Auto-escalate stale items | After 48h, escalate to next level |
| Audit Trail | Log all decisions | Who, when, what, why (if rejected) |

### 2.8 Business Logic — BOUNDARY

| Handoff | Our Side | Their Side |
|---------|----------|------------|
| User Authorization | Check permissions via API | SSO/IAM provides user roles |
| Supplier Data | Cache supplier master locally | MDM provides supplier updates |
| Product Data | Cache product master locally | PIM provides product updates |

---

## Domain 3: Data Layer

### 3.1 Data Storage — IN SCOPE

| Entity | Storage | Retention |
|--------|---------|-----------|
| Purchase Requests | PostgreSQL | 7 years |
| Purchase Orders | PostgreSQL | 7 years |
| Invoices | PostgreSQL | 7 years |
| Approvals | PostgreSQL | 7 years |
| Suppliers (cache) | PostgreSQL | Refresh daily |
| Products (cache) | PostgreSQL | Refresh daily |
| User Preferences | PostgreSQL | Indefinite |
| Audit Log | PostgreSQL | 7 years |

**Hosting & Operations Responsibility:**

| Aspect | Vendor Delivers | Customer Owns (Post-Handover) |
|--------|-----------------|-------------------------------|
| Hosting Region | Application configured for EU deployment | Infrastructure in European region (Azure, AWS, or designated provider) |
| Database | Schema, migrations, indexes, seed scripts | PostgreSQL instance provision |
| Daily Operations | Runbooks, monitoring hooks, alert definitions | Backup execution, restore testing, maintenance windows |
| Scaling | Application auto-scales on serverless | Database scaling decisions |
| **Costs** | Included in fixed-price delivery | DB hosting, infrastructure, ongoing cloud costs |

### 3.2 Data Queries — IN SCOPE

| Query Type | Description |
|------------|-------------|
| List Views | Paginated, filtered, sorted |
| Detail Views | Single entity with related data |
| Aggregations | Dashboard KPIs, summaries |
| Search | Full-text search on key fields |
| Reports | Export to CSV/Excel |

### 3.3 Data — OUT OF SCOPE

| Item | Owner |
|------|-------|
| Offline-first / PWA | Not required — standard request/response with retry |
| Data warehouse / analytics | BI team |
| Long-term archival | Enterprise storage team |
| GDPR data subject requests | Legal/compliance team |

### 3.4 Data — BOUNDARY

| Handoff | Our Side | Their Side |
|---------|----------|------------|
| Master Data | Consume via API, cache locally | MDM publishes supplier/product data |
| Events | Publish to Kafka topics | Consumers subscribe to our topics |
| Backups | Application-level backups | Infrastructure team handles DB backups |

---

## Domain 4: Integrations

> **Architecture Decision:** Kafka-native integration with per-source/per-consumer topic modularity. REST fallback for sources that cannot use Kafka. Customer provisions topics in existing STARK Kafka cluster; vendor delivers specs and consumer/producer code.

### 4.1 Integration Infrastructure — BOUNDARY

| Component | Vendor Delivers | Customer Provisions |
|-----------|-----------------|---------------------|
| Kafka Cluster | — | Existing STARK cluster (no new infra) |
| Schema Registry | Avro/JSON schemas per topic | Registry instance, schema deployment |
| Topics | Topic specs (names, partitions, retention) | Topic creation per specs |
| ACLs | ACL specifications per topic | ACL configuration in cluster |
| Consumers | Consumer code for all inbound topics | — |
| Producers | Producer code for all outbound topics | — |
| DLQ Handling | DLQ processing logic, alerting hooks | DLQ topic provisioning |

### 4.2 Inbound: PR Sources — IN SCOPE

**Primary: Kafka (per-source topics)**

| Source | Topic | Consumer | DLQ Topic |
|--------|-------|----------|-----------|
| Relex | `stark.procurement.inbound.prs.relex` | `PRRelexConsumer` | `stark.procurement.inbound.prs.relex.dlq` |
| ECom | `stark.procurement.inbound.prs.ecom` | `PREComConsumer` | `stark.procurement.inbound.prs.ecom.dlq` |
| SalesApp | `stark.procurement.inbound.prs.salesapp` | `PRSalesAppConsumer` | `stark.procurement.inbound.prs.salesapp.dlq` |
| Aspect4 | `stark.procurement.inbound.pos.aspect4` | `POAspect4Consumer` | `stark.procurement.inbound.pos.aspect4.dlq` |

**Fallback: REST API (for sources that cannot use Kafka)**

| Source | Endpoint | Auth |
|--------|----------|------|
| Any | `POST /api/v1/prs/{source}` | API Key (`X-API-Key` header) |
| Any | `POST /api/v1/pos/{source}` | API Key (`X-API-Key` header) |

REST endpoints internally publish to the corresponding Kafka topic, ensuring uniform processing.

**Message Schema Example: PR Message**

```json
{
  "messageId": "uuid",
  "messageTimestamp": "2026-03-23T08:30:00Z",
  "source": "relex",
  "payload": {
    "sourceReference": "RELEX-2026-123456",
    "branchId": "DK-084",
    "supplierId": "SUP-10042",
    "needByDate": "2026-03-25",
    "items": [
      { "sku": "SKU-12345", "quantity": 100, "unitPrice": 45.00 }
    ]
  }
}
```

### 4.3 Outbound: Supplier Communication — IN SCOPE

**Per-channel Kafka topics**

| Channel | Topic | Producer | Consumer |
|---------|-------|----------|----------|
| EDI | `stark.procurement.outbound.pos.edi` | Our app | EDI Gateway / Stark Output |
| Email | `stark.procurement.outbound.pos.email` | Our app | Stark Output |
| Portal | `stark.procurement.outbound.pos.portal` | Our app | Supplier Portal (future) |

**DLQ Topics (per channel)**

| Channel | DLQ Topic | Alert On |
|---------|-----------|----------|
| EDI | `stark.procurement.outbound.pos.edi.dlq` | Any message |
| Email | `stark.procurement.outbound.pos.email.dlq` | Any message |

**Failure Handling (built into Kafka patterns)**

| Scenario | Handling |
|----------|----------|
| Consumer down | Messages persist in topic until consumer recovers |
| Processing failure | Retry 3x with exponential backoff, then route to DLQ |
| DLQ message | Alert ops, manual review/replay via admin UI |
| Permanent failure | Mark as failed in DB, notify user |

### 4.4 Outbound: Status Events — IN SCOPE

**Lightweight notification events (IDs + metadata, not full payloads)**

| Event | Topic | Payload Fields |
|-------|-------|----------------|
| PR Received | `stark.procurement.events.pr.received` | `prId`, `source`, `timestamp` |
| PO Created | `stark.procurement.events.po.created` | `poId`, `prIds[]`, `supplierId`, `timestamp` |
| PO Sent | `stark.procurement.events.po.sent` | `poId`, `channel`, `timestamp` |
| PO Confirmed | `stark.procurement.events.po.confirmed` | `poId`, `confirmedDeliveryDate`, `timestamp` |
| Invoice Matched | `stark.procurement.events.invoice.matched` | `invoiceId`, `poIds[]`, `matchStatus`, `timestamp` |
| Invoice Approved | `stark.procurement.events.invoice.approved` | `invoiceId`, `approverId`, `timestamp` |

**Event Type:** Informational/notification. Consumers needing full data should call Status API.

### 4.5 Outbound: Status API — IN SCOPE

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/v1/prs/{id}` | Full PR details for source systems | API Key or Bearer |
| `GET /api/v1/pos/{id}` | Full PO details for tracking | API Key or Bearer |
| `GET /api/v1/invoices/{id}` | Full invoice details | API Key or Bearer |

### 4.6 Outbound: Finance Export — IN SCOPE

| Export | Trigger | Format | Destination |
|--------|---------|--------|-------------|
| Approved Invoices | Nightly batch or on-demand | CSV (SAP-compatible) | `stark.procurement.outbound.finance.invoices` |
| PO Commitments | On PO approval | CSV | `stark.procurement.outbound.finance.commitments` |

**Note:** Finance team consumes from Kafka topics. CSV schema agreed with SAP Finance team.

### 4.7 Integration Security — IN SCOPE

| Layer | Mechanism | Vendor Delivers | Customer Configures |
|-------|-----------|-----------------|---------------------|
| Transport | TLS 1.3 | Require TLS in consumer/producer config | Cluster TLS setup |
| Authentication | SASL/SCRAM or mTLS | Connection config templates | Credentials/certs |
| Authorization | Kafka ACLs | ACL spec per topic | ACL deployment |
| REST Fallback | API Key + optional IP whitelist | Key validation logic | Key provisioning |

**ACL Specification Example:**

```
# Relex can only write to their inbound topic
User:relex-producer ALLOW WRITE on stark.procurement.inbound.prs.relex

# Our app can read all inbound, write all outbound
User:procurement-app ALLOW READ on stark.procurement.inbound.*
User:procurement-app ALLOW WRITE on stark.procurement.outbound.*
User:procurement-app ALLOW WRITE on stark.procurement.events.*

# Finance can only read their export topics
User:finance-consumer ALLOW READ on stark.procurement.outbound.finance.*
```

### 4.8 Integrations — OUT OF SCOPE

| Integration | Owner | Our Workaround |
|-------------|-------|----------------|
| SAP Finance (direct API) | SAP Finance team | Kafka export + CSV format |
| NYCE (goods receipt) | NYCE team | Manual GR entry option in UI |
| Pricing Domain (live lookup) | Pricing team | Use PR prices or fallback table |
| SalesApp (bidirectional sync) | SalesApp team | One-way: they publish to Kafka |

### 4.9 Integrations — BOUNDARY

| System | Vendor Delivers | Customer/Partner Owns |
|--------|-----------------|----------------------|
| Relex | Consumer, schema, DLQ handling | Publish to topic in agreed schema |
| ECom | Consumer, schema, DLQ handling | Publish to topic in agreed schema |
| SalesApp | Consumer, schema, DLQ handling | Publish to topic in agreed schema |
| Stark Output | Producer, message formatting | Consume from outbound topics, deliver to supplier |
| EDI Gateway | Producer, EDIFACT formatting | Consume from EDI topic, transmit |
| SAP Finance | Producer, CSV formatting | Consume from finance topics, import |
| Kafka Cluster | Connection code, topic specs, ACL specs | Cluster ops, topic provisioning, ACL config |

---

## Domain 5: Operations

### 5.1 Infrastructure — IN SCOPE

| Component | Technology | Our Deliverable |
|-----------|------------|-----------------|
| Application Runtime | Next.js on Vercel | Deployed, configured, monitored |
| Database | PostgreSQL (managed) | Schema, migrations, indexes |
| Cache | Redis (managed) | Session, rate limiting |
| CDN | Vercel Edge | Static assets, edge caching |
| Secrets | Environment variables | Secure configuration |

### 5.2 Observability — IN SCOPE

| Capability | Tool | Our Deliverable |
|------------|------|-----------------|
| Error Tracking | Sentry | Integration, alerting |
| APM | Vercel Analytics | Performance monitoring |
| Logging | Structured JSON logs | Queryable audit trail |
| Health Checks | `/api/health` endpoint | Uptime monitoring |

### 5.3 Security — IN SCOPE

| Capability | Implementation |
|------------|----------------|
| Authentication | SSO integration (SAML/OIDC) |
| Authorization | Role-based access control |
| Data Encryption | TLS in transit, AES at rest |
| Input Validation | Server-side validation |
| Rate Limiting | Per-endpoint limits |
| Audit Logging | All mutations logged |

### 5.4 Operations — OUT OF SCOPE

| Item | Owner |
|------|-------|
| SSO Provider | Enterprise IAM team |
| Network Security | Infrastructure team |
| Penetration Testing | Security team |
| Disaster Recovery | Infrastructure team |
| DNS Management | Infrastructure team |

### 5.5 Operations — BOUNDARY

| Handoff | Our Side | Their Side |
|---------|----------|------------|
| SSO | Implement SAML/OIDC client | Provide IdP configuration |
| SSL Certificates | Vercel auto-manages | N/A |
| Database Backups | Define RPO/RTO requirements | Managed PostgreSQL handles |

---

## Explicit Exclusions

### Will NOT Be Delivered

| Item | Reason | Future Phase |
|------|--------|--------------|
| **Stock Transfer Orders (STO)** | Requires NYCE WMS | Phase 2 |
| **3-Way Invoice Match** | Requires NYCE goods receipt | Phase 2 |
| **SAP Finance Integration** | Requires SAP Finance live | Phase 2 |
| **Real-time SalesApp Sync** | Requires OMI bidirectional | Phase 2 |
| **Supplier Portal** | Enhancement, not MVP | Phase 3 |
| **AI Email Parsing** | Enhancement, not MVP | Phase 3 |
| **Contract Management** | Requires Icertis | Phase 3 |
| **Mobile Native App** | Enhancement, not MVP | Phase 3 |
| **Multi-language UI** | Enhancement, not MVP | Phase 3 |
| **Advanced Analytics/BI** | Different project | Never (BI team) |

### Dependencies We Assume Are Ready

| Dependency | Status | Impact if Not Ready |
|------------|--------|---------------------|
| Relex PR feed | READY | No automated replenishment |
| ECom PR feed | READY | No drop-shipment PRs |
| Stark Output (EDI/Email) | READY | Cannot send POs to suppliers |
| SSO/IAM | READY | No user authentication |
| Supplier Master Data | READY | Manual supplier entry |

---

## Delivery Model

### Scope Flexibility Tiers

| Tier | Examples | Change Process |
|------|----------|----------------|
| **FIXED** | Core PR→PO→Invoice flow | Formal change request, re-estimation |
| **FLEXIBLE** | Dashboard layout, column order, filter options | Adjust within increment, no re-estimation |
| **ADDITIVE** | New report, additional status badge | Add if capacity allows |

### Delivery Principles

1. **Working Software** — Demos use real working features, not mockups
2. **Continuous Feedback** — Feedback incorporated within increments, not at sprint boundaries
3. **Flexible Within Tiers** — FLEXIBLE items adjusted without change control overhead
4. **Incremental Value** — Each delivery milestone provides usable functionality

---

## Acceptance Criteria Summary

### Definition of Done (Per Screen)

- [ ] Renders correctly on desktop (1280px+)
- [ ] Renders correctly on tablet (768px+)
- [ ] All data loads from backend API
- [ ] Loading states shown during fetch
- [ ] Error states handled gracefully
- [ ] Empty states designed and implemented
- [ ] Keyboard navigation works
- [ ] Meets WCAG 2.1 AA (basic)
- [ ] No console errors
- [ ] Passes TypeScript strict mode

### Definition of Done (Per Integration)

- [ ] API endpoint documented (OpenAPI)
- [ ] Request validation implemented
- [ ] Error responses follow standard format
- [ ] Rate limiting configured
- [ ] Authentication required
- [ ] Audit logging enabled
- [ ] Health check includes dependency
- [ ] Retry logic for transient failures

### Definition of Done (Per Business Rule)

- [ ] Rule documented in code comments
- [ ] Unit tests cover happy path
- [ ] Unit tests cover edge cases
- [ ] Integration test with real data shape
- [ ] Rule configurable (if specified)

---

## Sign-Off Checklist

Before final delivery, both parties confirm:

| Item | Vendor | STARK |
|------|--------|-------|
| All IN SCOPE items delivered | ☐ | ☐ |
| All BOUNDARY interfaces documented | ☐ | ☐ |
| All OUT OF SCOPE items acknowledged | ☐ | ☐ |
| All exclusions agreed | ☐ | ☐ |
| Acceptance criteria met | ☐ | ☐ |
| Source code transferred | ☐ | ☐ |
| Documentation complete | ☐ | ☐ |
| Training delivered | ☐ | ☐ |

---

## Appendix A: Screen-by-Screen Acceptance Criteria

### A1: PR Inbox

**Purpose:** Central view for managing incoming purchase requests from all sources.

**Functional Criteria:**

- [ ] Displays PRs from Relex, ECom, SalesApp, and Aspect4 sources
- [ ] Default view: Grouped by Source → Value Band (High/Medium/Low)
- [ ] Alternative view: Flat list (toggle)
- [ ] Supports filtering by:
  - [ ] Source (Relex, ECom, SalesApp, Manual)
  - [ ] Status (Pending, Approved, Rejected, Converted)
  - [ ] Date range (received date)
  - [ ] Value band (High >100K, Medium 10K-100K, Low <10K)
  - [ ] Branch
- [ ] Supports sorting by: Date, Value, Status, Source
- [ ] Search by PR number, supplier name, branch name
- [ ] Displays escalation indicators (ambient → urgent)
- [ ] Shows PO linkage status (Unlinked, Linked, Bundled)
- [ ] Compact stats bar: Total, by source, urgent count
- [ ] Guidance banner when high-value items need review
- [ ] Bulk selection for batch actions
- [ ] Pagination: 50 items per page default

**Data Displayed per Row:**

| Field | Source |
|-------|--------|
| PR Number | Generated |
| Source | PR.source |
| Supplier | PR.supplierName |
| Branch | PR.branchName |
| Items Count | PR.lineItems.length |
| Total Value | PR.totalEstimatedValue |
| Need By Date | PR.needByDate |
| Status | PR.status |
| Escalation | PR.escalationLevel |
| PO Link | Computed from PO table |
| Age | Computed from PR.createdAt |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click row | Navigate to PR Detail (A2) |
| Click "Convert to PO" | Create single PO, navigate to PO Detail |
| Click "Add to Bundle" | Add to bundling workspace |
| Click source filter | Filter list by source |
| Toggle view mode | Switch between grouped/flat |

**Empty State:**

> "No purchase requests found. PRs will appear here when received from Relex, ECom, or SalesApp."

**NOT Included:**

- Editing PR line items (PRs are read-only after receipt)
- Creating PRs manually (out of scope for Phase 1)
- Real-time push updates (polling only)

---

### A2: PR Detail

**Purpose:** View individual purchase request with full line item details.

**Functional Criteria:**

- [ ] Displays PR header (number, source, dates, status)
- [ ] Displays supplier information
- [ ] Displays delivery location (branch)
- [ ] Lists all line items with SKU, description, qty, price
- [ ] Shows linked PO(s) if converted
- [ ] Shows escalation level with reason
- [ ] Displays audit trail (received, status changes)
- [ ] Action buttons based on status:
  - Pending: "Approve", "Reject", "Convert to PO"
  - Approved: "Convert to PO", "Add to Bundle"
  - Converted: View only (link to PO)

**Data Displayed:**

**Header Section:**
| Field | Source |
|-------|--------|
| PR Number | PR.prNumber |
| Source | PR.source (badge) |
| Received Date | PR.createdAt |
| Need By Date | PR.needByDate |
| Status | PR.status (badge) |
| Escalation | PR.escalationLevel |

**Supplier Section:**
| Field | Source |
|-------|--------|
| Supplier Name | PR.supplierName |
| Supplier ID | PR.supplierId |
| Contact | Supplier.email |

**Line Items Table:**
| Column | Source |
|--------|--------|
| Line # | Index |
| SKU | item.sku |
| Description | item.description |
| Quantity | item.quantity |
| Unit | item.unit |
| Unit Price | item.unitPrice |
| Line Total | Computed |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click "Approve" | Set status to approved, log action |
| Click "Reject" | Prompt for reason, set status to rejected |
| Click "Convert to PO" | Create PO, navigate to PO Detail |
| Click "Add to Bundle" | Add to bundling workspace |
| Click supplier name | Navigate to Supplier Detail (F2) |
| Click linked PO | Navigate to PO Detail (B2) |

**NOT Included:**

- Editing line items
- Splitting PRs
- Changing supplier

---

### B1: PO List

**Purpose:** Central view for managing purchase orders across all stages.

**Functional Criteria:**

- [ ] Displays all POs regardless of status
- [ ] Default view: Grouped by Business Priority (Critical/High/Standard/Routine)
- [ ] Alternative views: Flat list, Kanban (toggle)
- [ ] Supports filtering by:
  - [ ] Status (Draft, Pending Approval, Approved, Sent, Confirmed, Received)
  - [ ] Supplier
  - [ ] Date range (created, sent, delivery)
  - [ ] Value band
  - [ ] Escalation level
- [ ] Supports sorting by: Date, Value, Status, Supplier, Delivery Date
- [ ] Search by PO number, supplier name, PR number
- [ ] Displays escalation indicators
- [ ] Shows linked PRs count with expand
- [ ] Compact stats bar: Total, by status, urgent count
- [ ] Guidance banners:
  - [ ] "X POs ready to send" with bundling opportunities
  - [ ] "X deliveries at risk" for overdue/delayed
- [ ] Bulk actions: Send All, Approve All

**Data Displayed per Row:**

| Field | Source |
|-------|--------|
| PO Number | PO.poNumber |
| Supplier | PO.supplierName |
| PRs | Count of PO.prIds |
| Items Count | PO.lineItems.length |
| Total Value | PO.total |
| Requested Delivery | PO.requestedDeliveryDate |
| Confirmed Delivery | PO.confirmedDeliveryDate |
| Status | PO.status |
| Escalation | PO.escalationLevel |
| Sent Via | PO.sentVia |
| Days Until Delivery | Computed |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click row | Navigate to PO Detail (B2) |
| Click "Send" | Send PO via configured channel |
| Click "PRs" badge | Expand to show linked PRs |
| Click supplier filter | Filter by supplier |
| Toggle view mode | Switch between grouped/flat/kanban |

**Empty State:**

> "No purchase orders found. Create POs by converting purchase requests."

**NOT Included:**

- Creating POs without PRs (must originate from PR)
- Editing sent POs (read-only after send)

---

### B2: PO Detail

**Purpose:** View and manage individual purchase order with full details.

**Functional Criteria:**

- [ ] Displays PO header (number, supplier, dates, status)
- [ ] Displays supplier contact information
- [ ] Displays delivery address and dates
- [ ] Lists all line items with packet grouping (for bundled POs)
- [ ] Shows linked PRs with source badges
- [ ] Shows linked invoices if any
- [ ] Displays supplier response (confirmation details)
- [ ] Displays communication history (sent, responses)
- [ ] Displays audit trail
- [ ] Action buttons based on status:
  - Draft: "Edit", "Send", "Delete"
  - Pending Approval: "Approve", "Reject"
  - Approved: "Send"
  - Sent: "Mark Confirmed", "Record Response"
  - Confirmed: "Mark Received"

**Data Displayed:**

**Header Section:**
| Field | Source |
|-------|--------|
| PO Number | PO.poNumber |
| Status | PO.status (badge) |
| Created | PO.createdAt |
| Sent | PO.sentAt |
| Sent Via | PO.sentVia |

**Supplier Section:**
| Field | Source |
|-------|--------|
| Supplier Name | PO.supplierName |
| Contact | PO.supplierContact |
| Email | PO.supplierEmail |

**Delivery Section:**
| Field | Source |
|-------|--------|
| Delivery Address | PO.deliveryAddress |
| Requested Date | PO.requestedDeliveryDate |
| Confirmed Date | PO.confirmedDeliveryDate |
| Delivery Type | PO.deliveryType |

**Line Items Table (grouped by PR for bundled POs):**
| Column | Source |
|--------|--------|
| Packet | PR reference (for bundled) |
| Line # | Index |
| SKU | item.sku |
| Description | item.description |
| Quantity | item.quantity |
| Unit Price | item.unitPrice |
| Line Total | Computed |

**Totals:**
| Field | Source |
|-------|--------|
| Subtotal | PO.subtotal |
| Tax | PO.tax |
| Total | PO.total |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click "Send" | Send via configured channel, update status |
| Click "Edit" | Enable editing (draft only) |
| Click "Record Response" | Open response entry modal |
| Click linked PR | Navigate to PR Detail |
| Click linked Invoice | Navigate to Invoice Detail |
| Click supplier name | Navigate to Supplier Detail |

**NOT Included:**

- Editing after send
- Adding items not from PRs
- Changing supplier after creation

---

### B3: PO Kanban

**Purpose:** Visual pipeline view of POs by status.

**Functional Criteria:**

- [ ] Displays POs in columns by status
- [ ] Columns: Draft → Sent → Confirmed → Received
- [ ] Cards show: PO#, Supplier, Value, Delivery Date, Escalation
- [ ] Drag-and-drop to change status (where valid)
- [ ] Click card to open PO Detail
- [ ] Column counts and totals
- [ ] Filter by supplier, date range
- [ ] Swimlanes option: by supplier

**Columns:**

| Column | Statuses Included | Actions |
|--------|-------------------|---------|
| Draft | draft, pending_approval, approved | Send |
| Sent | sent | Record Response |
| Confirmed | confirmed | Mark Received |
| Received | partially_received, received, completed | — |

**Card Display:**
- PO Number (bold)
- Supplier name
- Value (formatted)
- Delivery date
- Escalation indicator
- PRs count badge

**NOT Included:**

- Editing from kanban (detail view only)
- Bulk drag operations

---

### C1: Bundling Workspace

**Purpose:** Group multiple PRs into optimized purchase orders.

**Functional Criteria:**

- [ ] Two-panel layout: Available PRs (left), Bundle Preview (right)
- [ ] Available PRs filtered to approved, unbundled
- [ ] Auto-suggest bundles by same supplier + location
- [ ] Manual drag-drop to add/remove from bundle
- [ ] Shows savings estimate (freight consolidation)
- [ ] Validates bundling rules:
  - [ ] Same supplier required
  - [ ] Same delivery location required
  - [ ] Compatible delivery dates
  - [ ] Supplier supports packet labeling
- [ ] Preview bundle as PO before creation
- [ ] "Create PO" generates PO with packet separation
- [ ] "Auto-Bundle" creates optimal bundles automatically

**Available PRs Panel:**
| Field | Display |
|-------|---------|
| PR Number | Link |
| Supplier | Text |
| Branch | Text |
| Value | Formatted |
| Need By | Date |
| Compatible | ✓/✗ indicator |

**Bundle Preview Panel:**
| Field | Display |
|-------|---------|
| Supplier | Header |
| PRs Included | List with remove button |
| Total Value | Sum |
| Packet Count | Count of PRs |
| Earliest Need By | Date |
| Estimated Freight | Calculated |

**User Interactions:**

| Action | Result |
|--------|--------|
| Drag PR to bundle | Add to bundle, update totals |
| Click remove | Remove from bundle |
| Click "Create PO" | Generate PO, navigate to PO Detail |
| Click "Auto-Bundle" | System creates optimal bundles |
| Click "Clear" | Reset workspace |

**Validation Errors:**
- "Cannot bundle: Different suppliers"
- "Cannot bundle: Different delivery locations"
- "Cannot bundle: Supplier does not support packet labeling"
- "Warning: Delivery dates differ by more than 3 days"

**NOT Included:**

- Cross-supplier bundling
- Split delivery bundling
- Partial PR bundling (all lines or none)

---

### D1: Invoice List

**Purpose:** Central view for managing supplier invoices and matching status.

**Functional Criteria:**

- [ ] Displays all invoices
- [ ] Default view: Grouped by Match Confidence
  - Investigation Needed (>5% variance)
  - Quick Review (<2% variance)
  - Auto-Approve Candidates (full match)
  - Missing PO Reference
- [ ] Alternative view: Flat list
- [ ] Supports filtering by:
  - [ ] Status (Received, Pending Match, Matched, Discrepancy, Approved, Paid)
  - [ ] Match result (Full, Qty Mismatch, Price Mismatch, Missing PO)
  - [ ] Supplier
  - [ ] Date range
  - [ ] Value band
- [ ] Search by invoice number, supplier name, PO number
- [ ] Displays discrepancy amount prominently
- [ ] Guidance banners:
  - [ ] "DKK X in discrepancies across Y invoices"
  - [ ] Pattern detection: "Supplier X: N discrepancies this month"
- [ ] Bulk actions: Approve All Matching

**Data Displayed per Row:**

| Field | Source |
|-------|--------|
| Invoice Number | Invoice.invoiceNumber |
| Supplier Ref | Invoice.supplierInvoiceRef |
| Supplier | Invoice.supplierName |
| Invoice Date | Invoice.invoiceDate |
| Total | Invoice.total |
| Match Result | Invoice.matchResult (badge) |
| Discrepancy | Invoice.discrepancyAmount |
| Status | Invoice.status |
| Escalation | Invoice.escalationLevel |
| Age | Computed from receivedDate |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click row | Navigate to Invoice Detail (D2) |
| Click "Approve" | Approve invoice (if matched) |
| Click "Review" | Navigate to Match Results (D3) |
| Toggle view mode | Switch between grouped/flat |

**Empty State:**

> "No invoices found. Invoices will appear here when received from suppliers."

**NOT Included:**

- Creating invoices manually (received from suppliers)
- Editing invoice amounts (source data is immutable)

---

### D2: Invoice Detail

**Purpose:** View individual invoice with matching details and approval actions.

**Functional Criteria:**

- [ ] Displays invoice header (number, supplier, dates, status)
- [ ] Displays supplier information
- [ ] Lists all line items
- [ ] Shows matched PO(s) side-by-side comparison
- [ ] Highlights discrepancies per line (qty, price)
- [ ] Shows match summary (matched %, variance %)
- [ ] Displays approval history
- [ ] Action buttons based on status:
  - Pending Match: "Match to PO"
  - Discrepancy: "Accept", "Reject", "Escalate"
  - Matched: "Approve", "Reject"
  - Approved: View only

**Data Displayed:**

**Header Section:**
| Field | Source |
|-------|--------|
| Invoice Number | Invoice.invoiceNumber |
| Supplier Ref | Invoice.supplierInvoiceRef |
| Status | Invoice.status |
| Invoice Date | Invoice.invoiceDate |
| Received Date | Invoice.receivedDate |
| Due Date | Invoice.dueDate |

**Match Summary:**
| Field | Source |
|-------|--------|
| Match Result | Invoice.matchResult |
| Matched POs | Invoice.poIds |
| Total Variance | Invoice.discrepancyAmount |
| Variance % | Computed |

**Line Items with Comparison:**
| Invoice | PO | Variance |
|---------|----|---------|
| SKU / Qty / Price | SKU / Qty / Price | Diff highlighted |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click "Approve" | Set status approved, log action |
| Click "Reject" | Prompt for reason, set rejected |
| Click "Accept Variance" | Accept discrepancy, approve |
| Click linked PO | Navigate to PO Detail |
| Click "Match to PO" | Open PO selection modal |

**NOT Included:**

- Editing invoice line items
- Creating credit notes
- Payment processing

---

### D3: Match Results

**Purpose:** Side-by-side comparison of invoice vs PO for discrepancy resolution.

**Functional Criteria:**

- [ ] Two-column layout: Invoice (left), PO (right)
- [ ] Line-by-line matching with visual diff
- [ ] Highlights: Qty differences, Price differences, Missing lines
- [ ] Tolerance indicators (within/outside tolerance)
- [ ] Summary statistics at top
- [ ] Action buttons: "Accept All", "Accept with Note", "Reject"
- [ ] Comments/notes field for resolution

**Display:**

**Summary Bar:**
| Metric | Value |
|--------|-------|
| Lines Matched | X of Y |
| Total Variance | DKK amount |
| Within Tolerance | Yes/No |

**Line Comparison Table:**
| Invoice Line | PO Line | Variance | Action |
|--------------|---------|----------|--------|
| SKU, Qty, Price | SKU, Qty, Price | Highlighted diff | Accept/Reject |

**NOT Included:**

- Editing either document
- Partial line acceptance

---

### D4: Discrepancy Queue

**Purpose:** Focused view of invoices requiring manual resolution.

**Functional Criteria:**

- [ ] Shows only invoices with status = discrepancy
- [ ] Sorted by age (oldest first) and value (highest first)
- [ ] Groups by discrepancy type:
  - Quantity Mismatch
  - Price Mismatch
  - Missing PO
- [ ] Shows financial impact per group
- [ ] Quick action buttons inline
- [ ] Guidance: "Resolve X to unblock DKK Y in payments"

**Data Displayed:**

| Field | Source |
|-------|--------|
| Invoice Number | Link to detail |
| Supplier | Invoice.supplierName |
| Discrepancy Type | Invoice.matchResult |
| Variance Amount | Invoice.discrepancyAmount |
| Age | Days since received |
| Linked PO | Invoice.poIds |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click "Review" | Navigate to Match Results |
| Click "Accept" | Accept variance, approve invoice |
| Click "Reject" | Reject invoice |

---

### E1: Approval Queue

**Purpose:** Central view for items awaiting user's approval.

**Functional Criteria:**

- [ ] Shows pending approvals for current user
- [ ] Default view: Grouped by Approval Reason
  - Threshold Exceeded
  - Discrepancy Resolution
  - Policy Exception
  - Budget Review
- [ ] Shows decision impact:
  - "X approvals waiting (DKK Y)"
  - "Z blocking payment"
- [ ] Batch approval for same-requester items
- [ ] Inline context (value, requester, reason)
- [ ] Quick actions: Approve, Reject, Delegate

**Data Displayed:**

| Field | Source |
|-------|--------|
| Entity Type | approval.entityType (PR/PO/Invoice) |
| Entity Reference | Link to entity |
| Requester | approval.requestedByName |
| Amount | approval.amount |
| Threshold | approval.threshold |
| Reason | approval.reason |
| Requested Date | approval.requestedAt |
| Age | Days waiting |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click "Approve" | Approve, log action, notify requester |
| Click "Reject" | Prompt for reason, reject, notify |
| Click "Delegate" | Select alternate approver |
| Click entity reference | Navigate to entity detail |
| Click "Approve All" | Batch approve selected |

**NOT Included:**

- Modifying the underlying entity
- Changing approval thresholds (admin function)

---

### E2: Approval History

**Purpose:** Audit trail of all approval decisions.

**Functional Criteria:**

- [ ] Shows all approval decisions (approved, rejected)
- [ ] Filterable by:
  - [ ] Date range
  - [ ] Decision (approved/rejected)
  - [ ] Entity type
  - [ ] Approver
  - [ ] Requester
- [ ] Searchable by entity reference
- [ ] Shows full context per decision
- [ ] Export to CSV

**Data Displayed:**

| Field | Source |
|-------|--------|
| Date | approval.decidedAt |
| Entity | approval.entityType + reference |
| Amount | approval.amount |
| Decision | approved/rejected (badge) |
| Decided By | approval.decidedBy |
| Requester | approval.requestedByName |
| Reason | approval.decisionReason |

**NOT Included:**

- Modifying historical records
- Reversing decisions

---

### F1: Supplier List

**Purpose:** View and manage supplier master data.

**Functional Criteria:**

- [ ] Lists all suppliers
- [ ] Supports filtering by:
  - [ ] Status (Active/Inactive)
  - [ ] Category
  - [ ] Communication preference (EDI/Email)
  - [ ] Performance rating
- [ ] Searchable by name, supplier number
- [ ] Shows key metrics per supplier:
  - [ ] Open POs count
  - [ ] YTD spend
  - [ ] On-time delivery %
- [ ] Sortable by name, spend, performance

**Data Displayed per Row:**

| Field | Source |
|-------|--------|
| Supplier Number | Supplier.supplierNumber |
| Name | Supplier.name |
| Category | Supplier.categories |
| Communication | Supplier.preferredCommunication |
| Lead Time | Supplier.averageLeadTimeDays |
| On-Time % | Supplier.onTimeDeliveryRate |
| Quality Score | Supplier.qualityScore |
| Status | Supplier.isActive |

**User Interactions:**

| Action | Result |
|--------|--------|
| Click row | Navigate to Supplier Detail |
| Click "Add Supplier" | Open create form |

**NOT Included:**

- Supplier onboarding workflow
- Document management
- Contract integration

---

### F2: Supplier Detail

**Purpose:** View individual supplier with performance and activity.

**Functional Criteria:**

- [ ] Displays supplier header (name, ID, status)
- [ ] Displays contact information
- [ ] Displays capabilities (EDI, packet labeling)
- [ ] Shows performance metrics:
  - [ ] On-time delivery rate
  - [ ] Quality score
  - [ ] Average lead time
- [ ] Shows recent activity:
  - [ ] Recent POs
  - [ ] Recent invoices
- [ ] Shows YTD statistics
- [ ] Edit button (for authorized users)

**Data Displayed:**

**Header:**
| Field | Source |
|-------|--------|
| Supplier Name | Supplier.name |
| Supplier Number | Supplier.supplierNumber |
| Status | Supplier.isActive |

**Contact:**
| Field | Source |
|-------|--------|
| Email | Supplier.email |
| Phone | Supplier.phone |
| Address | Supplier.address |

**Capabilities:**
| Field | Source |
|-------|--------|
| EDI Support | Supplier.supportsEDI |
| Packet Labeling | Supplier.supportsPacketLabeling |
| Preferred Channel | Supplier.preferredCommunication |
| Payment Terms | Supplier.paymentTerms |

**Performance:**
| Metric | Source |
|--------|--------|
| On-Time Delivery | Supplier.onTimeDeliveryRate |
| Quality Score | Supplier.qualityScore |
| Avg Lead Time | Supplier.averageLeadTimeDays |

**Recent Activity:**
- Last 5 POs (number, date, value, status)
- Last 5 Invoices (number, date, value, status)

**NOT Included:**

- Contract management
- Certificate tracking
- Supplier portal access

---

### G1: Dashboard

**Purpose:** Morning briefing with key metrics and action items.

**Functional Criteria:**

- [ ] Morning Briefing section with 3 key metrics:
  - [ ] Cut-off Countdown (POs needing action before cut-off)
  - [ ] Requires Your Decision (responses needing review)
  - [ ] Delivery Risk Today (orders at risk)
- [ ] Handle Now queue (exceptions requiring action)
  - [ ] Grouped by exception type
  - [ ] Inline action buttons
  - [ ] Shows business impact
- [ ] My Queue Today (time-grouped work items)
  - [ ] Before Cut-off
  - [ ] Before 14:00
  - [ ] Today (flexible)
- [ ] Overnight Automation report
  - [ ] PRs processed automatically
  - [ ] POs sent automatically
  - [ ] Invoices auto-matched
  - [ ] Items requiring manual review
  - [ ] Automation rate %
- [ ] PO Pipeline visualization
- [ ] Activity feed (recent events)

**Morning Briefing Cards:**

| Card | Data | Action |
|------|------|--------|
| Cut-off Countdown | Count of urgent POs, next cut-off time | Link to PO list |
| Requires Decision | Count of items needing review | Link to queue |
| Delivery Risk | Count at risk, stores affected | Link to at-risk POs |

**Handle Now Queue:**

| Exception Type | Display | Actions |
|----------------|---------|---------|
| Delivery Delay | PO#, supplier, days delayed | Notify Store, Accept Delay |
| Price Increase | Invoice#, supplier, variance | Accept, Reject |
| Quantity Partial | Invoice#, supplier, variance | Review, Resolve |

**NOT Included:**

- Custom dashboard configuration
- Widget drag-and-drop
- External data widgets

---

### H1: Settings

**Purpose:** User preferences and system configuration.

**Functional Criteria:**

- [ ] User preferences:
  - [ ] Default list page size
  - [ ] Default view mode (grouped/flat)
  - [ ] Email notification preferences
  - [ ] Dashboard widget visibility
- [ ] Approval thresholds (admin only):
  - [ ] Value thresholds per role
  - [ ] Escalation timeouts
- [ ] Integration status:
  - [ ] Connection status per system
  - [ ] Last sync timestamps
- [ ] Tolerance settings (admin only):
  - [ ] Invoice matching tolerances

**User Preferences:**

| Setting | Type | Default |
|---------|------|---------|
| Page Size | Select (25/50/100) | 50 |
| Default View | Select (Grouped/Flat) | Grouped |
| Email Notifications | Toggle | On |
| Show Automation Report | Toggle | On |

**NOT Included:**

- Role management (SSO/IAM)
- Audit log configuration
- Database settings

---

## Appendix B: API Contracts

### B.1 API Overview

**Base URL:** `https://procurement.stark.dev/api/v1`

**Authentication:** Bearer token (JWT from SSO)

**Common Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>
```

**Common Response Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [
      { "field": "supplierId", "message": "Supplier not found" }
    ]
  }
}
```

---

### B.2 Inbound APIs (We Expose)

#### POST /api/v1/prs/relex

**Purpose:** Receive purchase request from Relex SCP

**Rate Limit:** 1000 requests/minute

**Request:**
```json
{
  "sourceReference": "RELEX-2026-123456",
  "branchId": "DK-084",
  "branchName": "Esbjerg Harbor",
  "supplierId": "SUP-10042",
  "supplierName": "ElectroSupply Nordic",
  "needByDate": "2026-03-25T00:00:00Z",
  "priority": "normal",
  "items": [
    {
      "lineNumber": 1,
      "sku": "SKU-12345",
      "description": "Electrical Cable 3x2.5mm 100m",
      "quantity": 100,
      "unit": "ROLL",
      "unitPrice": 245.00,
      "currency": "DKK"
    }
  ],
  "metadata": {
    "forecastId": "FC-2026-789",
    "replenishmentType": "regular"
  }
}
```

**Response: 201 Created**
```json
{
  "prId": "pr-uuid-here",
  "prNumber": "PR-2026-00001",
  "status": "pending",
  "createdAt": "2026-03-22T08:30:00Z",
  "estimatedPOSendTime": "2026-03-22T10:00:00Z"
}
```

**Validation Rules:**
- `sourceReference`: Required, unique per source
- `branchId`: Required, must exist in branch master
- `supplierId`: Required, must exist in supplier master
- `needByDate`: Required, must be future date
- `items`: At least 1 item required
- `items[].quantity`: Must be > 0
- `items[].unitPrice`: Must be >= 0

---

#### POST /api/v1/prs/ecom

**Purpose:** Receive drop-shipment PR from ECom (stark.dk)

**Rate Limit:** 500 requests/minute

**Request:**
```json
{
  "sourceReference": "ECOM-2026-789012",
  "orderId": "WEB-2026-456789",
  "customerId": "CUST-123",
  "customerName": "Hansen Construction ApS",
  "deliveryAddress": {
    "street": "Industrivej 42",
    "city": "Odense",
    "postalCode": "5000",
    "country": "DK"
  },
  "supplierId": "SUP-20084",
  "supplierName": "Nordic Building Supplies",
  "requestedDeliveryDate": "2026-03-28T00:00:00Z",
  "items": [
    {
      "lineNumber": 1,
      "sku": "SKU-67890",
      "description": "Insulation Panel 100mm",
      "quantity": 50,
      "unit": "PCS",
      "unitPrice": 189.00,
      "currency": "DKK"
    }
  ]
}
```

**Response: 201 Created**
```json
{
  "prId": "pr-uuid-here",
  "prNumber": "PR-2026-00002",
  "status": "approved",
  "poNumber": "PO-2026-00001",
  "estimatedDelivery": "2026-03-28T00:00:00Z"
}
```

**Note:** ECom PRs are auto-approved and immediately converted to PO.

---

#### POST /api/v1/prs/salesapp

**Purpose:** Receive PR from SalesApp (salesperson orders)

**Rate Limit:** 200 requests/minute

**Request:**
```json
{
  "sourceReference": "SALES-2026-345678",
  "salesOrderId": "SO-2026-1234",
  "salespersonId": "EMP-567",
  "salespersonName": "Lars Nielsen",
  "customerId": "CUST-456",
  "customerName": "Byggefirma Jensen",
  "branchId": "DK-012",
  "branchName": "København Central",
  "supplierId": "SUP-30012",
  "supplierName": "QualityStone AS",
  "deliveryType": "branch",
  "needByDate": "2026-04-01T00:00:00Z",
  "poSendTiming": "at_cutoff",
  "fixedPrices": true,
  "items": [
    {
      "lineNumber": 1,
      "sku": "SKU-11111",
      "description": "Granite Tiles 60x60cm",
      "quantity": 200,
      "unit": "M2",
      "unitPrice": 425.00,
      "currency": "DKK"
    }
  ],
  "notes": "Customer requested specific color: Anthracite Grey"
}
```

**Response: 201 Created**
```json
{
  "prId": "pr-uuid-here",
  "prNumber": "PR-2026-00003",
  "status": "pending",
  "requiresApproval": true,
  "approvalReason": "threshold_exceeded"
}
```

**poSendTiming Options:**
- `immediate`: Send PO now
- `at_cutoff`: Send at supplier's next cut-off
- `specified_date`: Send on `scheduledSendDate`

---

#### POST /api/v1/pos/aspect4

**Purpose:** Receive PO from Aspect4 (interim routing)

**Rate Limit:** 500 requests/minute

**Request:**
```json
{
  "aspect4Reference": "A4-PO-2026-999888",
  "supplierId": "SUP-40001",
  "supplierName": "Hilti Denmark",
  "branchId": "DK-044",
  "branchName": "Aalborg Nord",
  "requestedDeliveryDate": "2026-03-30T00:00:00Z",
  "sendVia": "edi",
  "items": [
    {
      "lineNumber": 1,
      "sku": "HILTI-12345",
      "description": "Anchor Bolt Kit M12",
      "quantity": 25,
      "unit": "KIT",
      "unitPrice": 1250.00,
      "currency": "DKK"
    }
  ]
}
```

**Response: 201 Created**
```json
{
  "poId": "po-uuid-here",
  "poNumber": "PO-2026-00050",
  "status": "approved",
  "willSendAt": "2026-03-22T09:00:00Z",
  "sendVia": "edi"
}
```

---

#### POST /api/v1/invoices

**Purpose:** Receive invoice from supplier (via EDI or manual entry)

**Rate Limit:** 500 requests/minute

**Request:**
```json
{
  "supplierInvoiceRef": "INV-SUP-2026-123",
  "supplierId": "SUP-10042",
  "supplierName": "ElectroSupply Nordic",
  "invoiceDate": "2026-03-20T00:00:00Z",
  "dueDate": "2026-04-20T00:00:00Z",
  "poReferences": ["PO-2026-00001"],
  "items": [
    {
      "lineNumber": 1,
      "sku": "SKU-12345",
      "description": "Electrical Cable 3x2.5mm 100m",
      "quantity": 100,
      "unit": "ROLL",
      "unitPrice": 245.00,
      "currency": "DKK"
    }
  ],
  "subtotal": 24500.00,
  "tax": 6125.00,
  "total": 30625.00,
  "currency": "DKK"
}
```

**Response: 201 Created**
```json
{
  "invoiceId": "inv-uuid-here",
  "invoiceNumber": "INV-2026-00001",
  "status": "pending_match",
  "matchResult": null
}
```

---

### B.3 Status APIs (We Expose)

#### GET /api/v1/prs/{id}

**Purpose:** Get PR status (for source systems to query)

**Response: 200 OK**
```json
{
  "prId": "pr-uuid-here",
  "prNumber": "PR-2026-00001",
  "sourceReference": "RELEX-2026-123456",
  "source": "relex",
  "status": "converted",
  "linkedPOs": [
    {
      "poId": "po-uuid-here",
      "poNumber": "PO-2026-00001",
      "status": "sent"
    }
  ],
  "createdAt": "2026-03-22T08:30:00Z",
  "updatedAt": "2026-03-22T10:00:00Z"
}
```

---

#### GET /api/v1/pos/{id}

**Purpose:** Get PO status

**Response: 200 OK**
```json
{
  "poId": "po-uuid-here",
  "poNumber": "PO-2026-00001",
  "status": "confirmed",
  "supplierId": "SUP-10042",
  "supplierName": "ElectroSupply Nordic",
  "total": 24500.00,
  "currency": "DKK",
  "requestedDeliveryDate": "2026-03-25T00:00:00Z",
  "confirmedDeliveryDate": "2026-03-26T00:00:00Z",
  "sentAt": "2026-03-22T10:00:00Z",
  "sentVia": "edi",
  "confirmedAt": "2026-03-22T14:30:00Z",
  "supplierOrderNumber": "SUP-ORD-789",
  "linkedPRs": ["PR-2026-00001"],
  "linkedInvoices": []
}
```

---

#### GET /api/v1/invoices/{id}

**Purpose:** Get invoice status

**Response: 200 OK**
```json
{
  "invoiceId": "inv-uuid-here",
  "invoiceNumber": "INV-2026-00001",
  "supplierInvoiceRef": "INV-SUP-2026-123",
  "status": "approved",
  "matchResult": "full_match",
  "total": 30625.00,
  "currency": "DKK",
  "linkedPOs": ["PO-2026-00001"],
  "approvedAt": "2026-03-21T16:00:00Z",
  "approvedBy": "Marie Hansen"
}
```

---

### B.4 Outbound APIs (We Consume)

#### Stark Output: Send PO via EDI

**Endpoint:** `POST https://output.stark.dev/api/v1/send/edi`

**Request:**
```json
{
  "messageType": "ORDERS",
  "recipient": {
    "gln": "5790000123456",
    "name": "ElectroSupply Nordic"
  },
  "document": {
    "poNumber": "PO-2026-00001",
    "issueDate": "2026-03-22",
    "deliveryDate": "2026-03-25",
    "deliveryAddress": {
      "gln": "5790000654321",
      "name": "STARK Esbjerg Harbor",
      "street": "Havnevej 12",
      "city": "Esbjerg",
      "postalCode": "6700"
    },
    "lines": [
      {
        "lineNumber": 1,
        "gtin": "5790000111111",
        "description": "Electrical Cable 3x2.5mm 100m",
        "quantity": 100,
        "unit": "ROLL",
        "unitPrice": 245.00
      }
    ],
    "totals": {
      "netAmount": 24500.00,
      "currency": "DKK"
    }
  },
  "packetLabels": [
    { "packetId": "PR-2026-00001", "lines": [1] }
  ]
}
```

**Response: 202 Accepted**
```json
{
  "messageId": "msg-uuid-here",
  "status": "queued",
  "estimatedDelivery": "2026-03-22T10:05:00Z"
}
```

---

#### Stark Output: Send PO via Email

**Endpoint:** `POST https://output.stark.dev/api/v1/send/email`

**Request:**
```json
{
  "templateId": "po-standard-dk",
  "recipient": {
    "email": "orders@electrosupply.dk",
    "name": "ElectroSupply Nordic"
  },
  "data": {
    "poNumber": "PO-2026-00001",
    "issueDate": "2026-03-22",
    "deliveryDate": "2026-03-25",
    "buyerContact": "indkob@stark.dk",
    "lines": [...]
  },
  "attachments": [
    {
      "filename": "PO-2026-00001.pdf",
      "contentType": "application/pdf",
      "content": "<base64-encoded-pdf>"
    }
  ]
}
```

**Response: 202 Accepted**
```json
{
  "messageId": "msg-uuid-here",
  "status": "queued"
}
```

---

### B.5 Webhook Events (We Publish to Kafka)

**Topic Naming:** `stark.procurement.{entity}.{event}`

#### PR Events

**Topic:** `stark.procurement.pr.received`
```json
{
  "eventId": "evt-uuid",
  "eventType": "pr.received",
  "timestamp": "2026-03-22T08:30:00Z",
  "data": {
    "prId": "pr-uuid",
    "prNumber": "PR-2026-00001",
    "source": "relex",
    "sourceReference": "RELEX-2026-123456",
    "supplierId": "SUP-10042",
    "branchId": "DK-084",
    "totalValue": 24500.00,
    "currency": "DKK"
  }
}
```

**Topic:** `stark.procurement.pr.converted`
```json
{
  "eventId": "evt-uuid",
  "eventType": "pr.converted",
  "timestamp": "2026-03-22T10:00:00Z",
  "data": {
    "prId": "pr-uuid",
    "prNumber": "PR-2026-00001",
    "poId": "po-uuid",
    "poNumber": "PO-2026-00001"
  }
}
```

#### PO Events

**Topic:** `stark.procurement.po.created`
```json
{
  "eventId": "evt-uuid",
  "eventType": "po.created",
  "timestamp": "2026-03-22T10:00:00Z",
  "data": {
    "poId": "po-uuid",
    "poNumber": "PO-2026-00001",
    "supplierId": "SUP-10042",
    "prIds": ["pr-uuid"],
    "totalValue": 24500.00,
    "currency": "DKK"
  }
}
```

**Topic:** `stark.procurement.po.sent`
```json
{
  "eventId": "evt-uuid",
  "eventType": "po.sent",
  "timestamp": "2026-03-22T10:00:00Z",
  "data": {
    "poId": "po-uuid",
    "poNumber": "PO-2026-00001",
    "sentVia": "edi",
    "recipientGln": "5790000123456"
  }
}
```

**Topic:** `stark.procurement.po.confirmed`
```json
{
  "eventId": "evt-uuid",
  "eventType": "po.confirmed",
  "timestamp": "2026-03-22T14:30:00Z",
  "data": {
    "poId": "po-uuid",
    "poNumber": "PO-2026-00001",
    "supplierOrderNumber": "SUP-ORD-789",
    "confirmedDeliveryDate": "2026-03-26T00:00:00Z",
    "quantityConfirmed": "full"
  }
}
```

#### Invoice Events

**Topic:** `stark.procurement.invoice.received`
```json
{
  "eventId": "evt-uuid",
  "eventType": "invoice.received",
  "timestamp": "2026-03-20T12:00:00Z",
  "data": {
    "invoiceId": "inv-uuid",
    "invoiceNumber": "INV-2026-00001",
    "supplierId": "SUP-10042",
    "totalValue": 30625.00,
    "currency": "DKK"
  }
}
```

**Topic:** `stark.procurement.invoice.matched`
```json
{
  "eventId": "evt-uuid",
  "eventType": "invoice.matched",
  "timestamp": "2026-03-20T12:05:00Z",
  "data": {
    "invoiceId": "inv-uuid",
    "invoiceNumber": "INV-2026-00001",
    "matchResult": "full_match",
    "matchedPOs": ["PO-2026-00001"],
    "varianceAmount": 0.00
  }
}
```

**Topic:** `stark.procurement.invoice.approved`
```json
{
  "eventId": "evt-uuid",
  "eventType": "invoice.approved",
  "timestamp": "2026-03-21T16:00:00Z",
  "data": {
    "invoiceId": "inv-uuid",
    "invoiceNumber": "INV-2026-00001",
    "approvedBy": "user-uuid",
    "approverName": "Marie Hansen",
    "totalValue": 30625.00,
    "currency": "DKK"
  }
}
```

---

## Appendix C: Data Model

### C.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  SUPPLIER       │       │  BRANCH         │       │  USER           │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ supplierNumber  │       │ branchCode      │       │ email           │
│ name            │       │ name            │       │ name            │
│ email           │       │ address         │       │ role            │
│ supportsEDI     │       │ region          │       │ approvalLimit   │
│ supportsPacket  │       └─────────────────┘       └─────────────────┘
│ cutoffTime      │              │                         │
│ leadTimeDays    │              │                         │
└─────────────────┘              │                         │
        │                        │                         │
        │                        ▼                         │
        │         ┌─────────────────────────┐              │
        │         │  PURCHASE_REQUEST (PR)  │              │
        │         ├─────────────────────────┤              │
        └────────►│ id (PK)                 │              │
                  │ prNumber                │              │
                  │ source                  │              │
                  │ sourceReference         │              │
                  │ supplierId (FK)         │◄─────────────┘
                  │ branchId (FK)           │
                  │ status                  │
                  │ escalationLevel         │
                  │ needByDate              │
                  │ totalEstimatedValue     │
                  │ createdAt               │
                  └─────────────────────────┘
                              │
                              │ 1:N
                              ▼
                  ┌─────────────────────────┐
                  │  PR_LINE_ITEM           │
                  ├─────────────────────────┤
                  │ id (PK)                 │
                  │ prId (FK)               │
                  │ lineNumber              │
                  │ sku                     │
                  │ description             │
                  │ quantity                │
                  │ unit                    │
                  │ unitPrice               │
                  └─────────────────────────┘

        ┌─────────────────────────┐
        │  PURCHASE_ORDER (PO)    │
        ├─────────────────────────┤
        │ id (PK)                 │
        │ poNumber                │
        │ status                  │◄──────────────────────────┐
        │ supplierId (FK)         │                           │
        │ branchId (FK)           │                           │
        │ deliveryAddress         │                           │
        │ requestedDeliveryDate   │                           │
        │ confirmedDeliveryDate   │                           │
        │ sentAt                  │                           │
        │ sentVia                 │                           │
        │ confirmedAt             │                           │
        │ supplierOrderNumber     │                           │
        │ subtotal                │                           │
        │ tax                     │                           │
        │ total                   │                           │
        │ escalationLevel         │                           │
        └─────────────────────────┘                           │
                  │                                           │
                  │ 1:N                                       │
                  ▼                                           │
        ┌─────────────────────────┐                           │
        │  PO_LINE_ITEM           │                           │
        ├─────────────────────────┤                           │
        │ id (PK)                 │                           │
        │ poId (FK)               │                           │
        │ prId (FK) ──────────────┼───► Links to PR           │
        │ lineNumber              │                           │
        │ sku                     │                           │
        │ description             │                           │
        │ quantity                │                           │
        │ unitPrice               │                           │
        │ packetLabel             │                           │
        └─────────────────────────┘                           │
                                                              │
        ┌─────────────────────────┐                           │
        │  INVOICE                │                           │
        ├─────────────────────────┤                           │
        │ id (PK)                 │                           │
        │ invoiceNumber           │                           │
        │ supplierInvoiceRef      │                           │
        │ supplierId (FK)         │                           │
        │ status                  │                           │
        │ matchResult             │                           │
        │ invoiceDate             │                           │
        │ dueDate                 │                           │
        │ receivedDate            │                           │
        │ subtotal                │                           │
        │ tax                     │                           │
        │ total                   │                           │
        │ discrepancyAmount       │                           │
        │ escalationLevel         │                           │
        └─────────────────────────┘                           │
                  │                                           │
                  │ 1:N                                       │
                  ▼                                           │
        ┌─────────────────────────┐                           │
        │  INVOICE_LINE_ITEM      │                           │
        ├─────────────────────────┤                           │
        │ id (PK)                 │                           │
        │ invoiceId (FK)          │                           │
        │ poLineId (FK) ──────────┼───► Links to PO line      │
        │ lineNumber              │                           │
        │ sku                     │                           │
        │ description             │                           │
        │ quantity                │                           │
        │ unitPrice               │                           │
        │ lineTotal               │                           │
        │ matchStatus             │                           │
        │ varianceAmount          │                           │
        └─────────────────────────┘                           │
                                                              │
        ┌─────────────────────────┐                           │
        │  INVOICE_PO_LINK        │                           │
        ├─────────────────────────┤                           │
        │ invoiceId (FK)          │                           │
        │ poId (FK) ──────────────┼───────────────────────────┘
        └─────────────────────────┘

        ┌─────────────────────────┐
        │  APPROVAL               │
        ├─────────────────────────┤
        │ id (PK)                 │
        │ entityType (pr/po/inv)  │
        │ entityId (FK)           │
        │ status                  │
        │ requestedBy (FK User)   │
        │ requestedAt             │
        │ amount                  │
        │ threshold               │
        │ reason                  │
        │ decidedBy (FK User)     │
        │ decidedAt               │
        │ decisionReason          │
        │ escalationLevel         │
        └─────────────────────────┘

        ┌─────────────────────────┐
        │  AUDIT_LOG              │
        ├─────────────────────────┤
        │ id (PK)                 │
        │ entityType              │
        │ entityId                │
        │ action                  │
        │ userId (FK)             │
        │ timestamp               │
        │ oldValue (JSON)         │
        │ newValue (JSON)         │
        │ ipAddress               │
        └─────────────────────────┘
```

---

### C.2 Entity Definitions

#### Purchase Request (PR)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| prNumber | String | Yes | Display number (PR-YYYY-NNNNN) |
| source | Enum | Yes | relex, ecom, salesapp, manual |
| sourceReference | String | Yes | ID from source system |
| supplierId | UUID (FK) | Yes | Reference to Supplier |
| supplierName | String | Yes | Denormalized for display |
| branchId | UUID (FK) | Yes | Reference to Branch |
| branchName | String | Yes | Denormalized for display |
| status | Enum | Yes | pending, approved, rejected, converted |
| escalationLevel | Enum | Yes | ambient, awareness, attention, action, urgent |
| needByDate | DateTime | Yes | When items are needed |
| totalEstimatedValue | Decimal | Yes | Sum of line items |
| currency | String | Yes | ISO currency code |
| notes | String | No | Free text notes |
| createdAt | DateTime | Yes | When received |
| updatedAt | DateTime | Yes | Last modification |
| approvedAt | DateTime | No | When approved |
| convertedAt | DateTime | No | When converted to PO |

**Status Transitions:**
```
pending → approved → converted
pending → rejected
```

---

#### Purchase Order (PO)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| poNumber | String | Yes | Display number (PO-YYYY-NNNNN) |
| status | Enum | Yes | draft, pending_approval, approved, sent, confirmed, partially_received, received, completed, cancelled |
| supplierId | UUID (FK) | Yes | Reference to Supplier |
| supplierName | String | Yes | Denormalized |
| supplierEmail | String | No | Contact email |
| branchId | UUID (FK) | Yes | Delivery location |
| branchName | String | Yes | Denormalized |
| deliveryAddress | String | Yes | Full delivery address |
| deliveryType | Enum | Yes | branch, direct_customer, warehouse |
| requestedDeliveryDate | DateTime | Yes | When we need it |
| confirmedDeliveryDate | DateTime | No | Supplier confirmed date |
| sentAt | DateTime | No | When sent to supplier |
| sentVia | Enum | No | edi, email, portal |
| confirmedAt | DateTime | No | When supplier confirmed |
| supplierOrderNumber | String | No | Supplier's reference |
| subtotal | Decimal | Yes | Before tax |
| tax | Decimal | Yes | Tax amount |
| total | Decimal | Yes | Final total |
| currency | String | Yes | ISO currency code |
| escalationLevel | Enum | Yes | Urgency indicator |
| supportsPacketLabeling | Boolean | Yes | From supplier master |
| packetCount | Integer | Yes | Number of PRs bundled |
| requiresApproval | Boolean | Yes | Needs approval workflow |
| approvedBy | UUID (FK) | No | Approver user ID |
| approvedAt | DateTime | No | When approved |
| createdAt | DateTime | Yes | Creation timestamp |
| updatedAt | DateTime | Yes | Last modification |

**Status Transitions:**
```
draft → pending_approval → approved → sent → confirmed → received → completed
draft → approved → sent (if no approval needed)
sent → cancelled
confirmed → partially_received → received → completed
```

---

#### Invoice

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| invoiceNumber | String | Yes | Our reference (INV-YYYY-NNNNN) |
| supplierInvoiceRef | String | Yes | Supplier's invoice number |
| supplierId | UUID (FK) | Yes | Reference to Supplier |
| supplierName | String | Yes | Denormalized |
| status | Enum | Yes | received, pending_match, matched, discrepancy, approved, paid, rejected |
| matchResult | Enum | No | full_match, quantity_mismatch, price_mismatch, missing_po, partial_match |
| invoiceDate | DateTime | Yes | Date on invoice |
| dueDate | DateTime | Yes | Payment due date |
| receivedDate | DateTime | Yes | When we received it |
| subtotal | Decimal | Yes | Before tax |
| tax | Decimal | Yes | Tax amount |
| total | Decimal | Yes | Final total |
| currency | String | Yes | ISO currency code |
| discrepancyAmount | Decimal | No | Variance from PO |
| escalationLevel | Enum | Yes | Urgency indicator |
| approvedBy | UUID (FK) | No | Approver user ID |
| approvedAt | DateTime | No | When approved |
| createdAt | DateTime | Yes | Creation timestamp |
| updatedAt | DateTime | Yes | Last modification |

**Status Transitions:**
```
received → pending_match → matched → approved → paid
received → pending_match → discrepancy → approved (after resolution)
received → pending_match → discrepancy → rejected
```

---

#### Supplier

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| supplierNumber | String | Yes | Business identifier |
| name | String | Yes | Legal/trading name |
| legalName | String | No | Full legal name |
| email | String | Yes | Primary contact |
| phone | String | No | Contact phone |
| website | String | No | Website URL |
| address | String | Yes | Street address |
| city | String | Yes | City |
| postalCode | String | Yes | Postal code |
| country | String | Yes | ISO country code |
| supportsPacketLabeling | Boolean | Yes | Can separate packages by PR |
| supportsEDI | Boolean | Yes | Has EDI capability |
| preferredCommunication | Enum | Yes | edi, email, portal |
| currency | String | Yes | Default currency |
| paymentTerms | String | Yes | e.g., "Net 30" |
| taxId | String | No | VAT number |
| averageLeadTimeDays | Integer | Yes | Typical delivery time |
| onTimeDeliveryRate | Decimal | Yes | Performance metric (0-100) |
| qualityScore | Decimal | Yes | Quality metric (0-100) |
| categories | String[] | Yes | Product categories |
| isActive | Boolean | Yes | Active/inactive |
| createdAt | DateTime | Yes | Creation timestamp |
| updatedAt | DateTime | Yes | Last modification |

---

#### Approval

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| entityType | Enum | Yes | pr, po, invoice |
| entityId | UUID | Yes | Reference to entity |
| status | Enum | Yes | pending, approved, rejected |
| requestedBy | UUID (FK) | Yes | User who requested |
| requestedByName | String | Yes | Denormalized |
| requestedAt | DateTime | Yes | When requested |
| amount | Decimal | Yes | Value requiring approval |
| currency | String | Yes | ISO currency code |
| threshold | Decimal | Yes | Threshold that was exceeded |
| reason | Enum | Yes | threshold, discrepancy, policy, budget |
| escalationLevel | Enum | Yes | Urgency indicator |
| decidedBy | UUID (FK) | No | Approver user ID |
| decidedByName | String | No | Denormalized |
| decidedAt | DateTime | No | When decided |
| decisionReason | String | No | Why rejected (if rejected) |

---

### C.3 Enumerations

#### PR Source
```typescript
type PRSource = "relex" | "ecom" | "salesapp" | "manual";
```

#### PR Status
```typescript
type PRStatus = "pending" | "approved" | "rejected" | "converted";
```

#### PO Status
```typescript
type POStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "confirmed"
  | "partially_received"
  | "received"
  | "completed"
  | "cancelled";
```

#### Invoice Status
```typescript
type InvoiceStatus =
  | "received"
  | "pending_match"
  | "matched"
  | "discrepancy"
  | "approved"
  | "paid"
  | "rejected";
```

#### Match Result
```typescript
type MatchResult =
  | "full_match"
  | "quantity_mismatch"
  | "price_mismatch"
  | "missing_po"
  | "partial_match";
```

#### Escalation Level
```typescript
type EscalationLevel =
  | "ambient"      // No visual indicator
  | "awareness"    // Subtle indicator
  | "attention"    // Visible indicator
  | "action"       // Prominent indicator
  | "urgent";      // Critical indicator
```

#### Approval Reason
```typescript
type ApprovalReason =
  | "threshold"    // Value exceeds user's limit
  | "discrepancy"  // Invoice variance
  | "policy"       // Policy exception
  | "budget";      // Budget exceeded
```

#### Delivery Type
```typescript
type DeliveryType =
  | "branch"           // Deliver to STARK branch
  | "direct_customer"  // Drop-ship to customer
  | "warehouse";       // Central warehouse
```

#### Communication Channel
```typescript
type CommunicationChannel = "edi" | "email" | "portal";
```

---

### C.4 Indexes

**Performance-critical indexes:**

```sql
-- PR queries
CREATE INDEX idx_pr_status ON purchase_request(status);
CREATE INDEX idx_pr_source ON purchase_request(source);
CREATE INDEX idx_pr_supplier ON purchase_request(supplier_id);
CREATE INDEX idx_pr_branch ON purchase_request(branch_id);
CREATE INDEX idx_pr_created ON purchase_request(created_at DESC);
CREATE INDEX idx_pr_escalation ON purchase_request(escalation_level);

-- PO queries
CREATE INDEX idx_po_status ON purchase_order(status);
CREATE INDEX idx_po_supplier ON purchase_order(supplier_id);
CREATE INDEX idx_po_delivery_date ON purchase_order(requested_delivery_date);
CREATE INDEX idx_po_sent ON purchase_order(sent_at DESC);
CREATE INDEX idx_po_escalation ON purchase_order(escalation_level);

-- Invoice queries
CREATE INDEX idx_inv_status ON invoice(status);
CREATE INDEX idx_inv_match ON invoice(match_result);
CREATE INDEX idx_inv_supplier ON invoice(supplier_id);
CREATE INDEX idx_inv_received ON invoice(received_date DESC);
CREATE INDEX idx_inv_escalation ON invoice(escalation_level);

-- Approval queries
CREATE INDEX idx_approval_status ON approval(status);
CREATE INDEX idx_approval_entity ON approval(entity_type, entity_id);
CREATE INDEX idx_approval_requested ON approval(requested_at DESC);

-- Audit log queries
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

---

---

## Section 6: Commercial & Operational Terms

### 6.1 Operating Model

**Fixed-Fee Software Operations**

| Term | Value |
|------|-------|
| Annual Operating Fee | DKK 300,000 |
| Coverage | Continuous improvement, upgrades, support |
| Change Control | None — included in operating model |
| Feature Requests | Processed via Feedback Agent in Command Center |

**No Change Control Process:** Unlike traditional software contracts, there is no formal change request process. All changes flow through the Command Center Feedback Agent:

1. User submits feedback via in-app widget
2. Feedback Agent categorizes and prioritizes
3. Changes delivered in continuous deployment
4. User notified when implemented

**What's Included in DKK 300K/year:**
- Bug fixes (unlimited)
- Security patches (immediate)
- Performance optimization
- Minor feature enhancements (FLEXIBLE tier)
- Major features (if within ADDITIVE capacity)
- Uptime monitoring and incident response
- Design system updates

**Not Included:**
- New integrations (separate scope)
- Multi-language/multi-country expansion
- Mobile native app development

---

### 6.2 Acceptance Process

**Command Center Philosophy**

Acceptance is continuous, not milestone-based. The process:

```
┌──────────────────────────────────────────────────────────────────┐
│                    FEEDBACK-DRIVEN ACCEPTANCE                     │
├──────────────────────────────────────────────────────────────────┤
│  1. Feature deployed to production                               │
│  2. User tests in real workflow                                  │
│  3. Feedback submitted via Command Center widget                 │
│  4. Feedback Agent:                                              │
│     ├── Auto-categorizes (bug, enhancement, question)            │
│     ├── Links to screen/component                                │
│     ├── Routes to appropriate handler                            │
│  5. Resolution delivered (typically same day)                    │
│  6. User confirms or iterates                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Formal Sign-Off:**
- Per-screen acceptance criteria (Appendix A) used as checklist
- Delivered via Command Center Feedback Agent verification flow
- Sign-off recorded in audit trail

**No Traditional UAT Phases:**
- Working software available daily
- Acceptance is continuous validation
- Issues fixed immediately, not queued for sprints

---

### 6.3 Warranty & Uptime

**Warranty Coverage**

| Aspect | Commitment |
|--------|------------|
| Period | Perpetual (included in operating fee) |
| Bug Fixes | Unlimited, no severity limits |
| Defect Definition | Does not meet acceptance criteria in Appendix A |
| Response Time | See SLA below |

**Uptime Commitment**

| Metric | Target |
|--------|--------|
| Availability | 99.5% monthly |
| Allowed Downtime | 3.65 hours/month |
| Maintenance Window | Sundays 02:00-06:00 CET (excluded from SLA) |
| Planned Downtime | 24h notice via email |

**Incident Response SLAs**

| Severity | Definition | Response | Resolution |
|----------|------------|----------|------------|
| P1 Critical | System unusable, all users affected | 15 minutes | 4 hours |
| P2 High | Major feature broken, workaround exists | 1 hour | 8 hours |
| P3 Medium | Feature degraded, impact limited | 4 hours | 24 hours |
| P4 Low | Cosmetic, minor inconvenience | 24 hours | Best effort |

**Exclusions from SLA:**
- Scheduled maintenance
- Third-party system outages (Relex, ECom, Stark Output)
- Force majeure
- User error or misconfiguration

---

### 6.4 Data Migration

**No Historical Data Migration**

| Item | Approach |
|------|----------|
| Historical PRs | Not migrated — system starts fresh |
| Historical POs | Not migrated — Aspect4 retains history |
| Historical Invoices | Not migrated — SAP Finance retains history |
| Supplier Master | Seeded from current MDM export |
| Branch Master | Seeded from current MDM export |
| User Data | Provisioned via SSO (no migration) |

**Seed Data Formatting**

We will:
1. Receive CSV/JSON export of current master data
2. Transform to our schema format
3. Load as initial seed
4. Validate counts and key references

**STARK Responsibilities:**
- Provide supplier export (CSV)
- Provide branch export (CSV)
- Validate loaded data within 5 business days

**Not Included:**
- Data cleansing (we load as-is)
- Duplicate resolution
- Historical trend analysis
- Year-over-year comparisons

---

### 6.5 Security Measures

**Security Architecture**

| Layer | Implementation |
|-------|----------------|
| Authentication | SSO via SAML 2.0 / OIDC (STARK IAM) |
| Authorization | Role-Based Access Control (RBAC) |
| Transport | TLS 1.3 enforced |
| Storage | AES-256 encryption at rest |
| Secrets | Environment variables (Vercel) |
| API Security | JWT tokens, 1-hour expiry |

**Application Security**

| Control | Implementation |
|---------|----------------|
| Input Validation | Server-side Zod schemas |
| SQL Injection | Parameterized queries (Prisma ORM) |
| XSS Prevention | React auto-escaping, CSP headers |
| CSRF Protection | SameSite cookies, token validation |
| Rate Limiting | 1000 req/min per IP (API) |
| Audit Logging | All mutations logged with user, timestamp, IP |

**Compliance Alignment**

| Standard | Status |
|----------|--------|
| GDPR | User data minimal, consent managed by STARK |
| SOC 2 Type II | Vercel platform certified |
| ISO 27001 | Vercel platform certified |
| PCI DSS | Not applicable (no payment processing) |

**Security Testing**

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Dependency Scanning | Continuous (Dependabot) | Vendor |
| SAST | Continuous (ESLint security rules) | Vendor |
| Penetration Testing | Annual | STARK Security Team |
| Vulnerability Response | Within 24h of disclosure | Vendor |

---

### 6.6 Integration Resilience

**Resilience Patterns**

| Pattern | Implementation |
|---------|----------------|
| Retry with Backoff | Exponential backoff (1s, 2s, 4s, 8s, max 30s) |
| Circuit Breaker | Open after 5 failures, half-open after 30s |
| Timeout | API calls: 30s, EDI: 60s |
| Fallback | Graceful degradation per system |
| Dead Letter Queue | Failed messages retained for replay |

**Per-Integration Resilience**

| System | Failure Mode | Fallback |
|--------|--------------|----------|
| Relex | No PRs received | Manual PR entry available |
| ECom | No PRs received | Manual PR entry available |
| Stark Output | POs not sent | Queue for retry, alert user |
| SSO | Users cannot login | N/A — hard dependency |
| Supplier MDM | Stale data | Use cached data (up to 24h) |

**Monitoring & Alerting**

| Metric | Alert Threshold | Channel |
|--------|-----------------|---------|
| Integration Error Rate | >5% over 5 min | PagerDuty |
| Circuit Breaker Open | Any | PagerDuty |
| Message Queue Depth | >1000 | Slack |
| Response Time P95 | >3s | Slack |

**Kafka Message Guarantees**

| Aspect | Configuration |
|--------|---------------|
| Delivery | At-least-once |
| Ordering | Per-partition (keyed by entity ID) |
| Retention | 7 days |
| Consumer Lag Alert | >1000 messages |

---

### 6.7 Integrations NOT Delivered

**STARK Ownership Required**

| Integration | Owner Org | Responsible Person | Our Workaround |
|-------------|-----------|-------------------|----------------|
| SAP Finance (invoice push) | STARK Finance | [TBD - Finance Director] | CSV export for manual import |
| NYCE WMS (goods receipt) | STARK Operations | [TBD - WMS Lead] | Manual GR flag in our system |
| Pricing Domain (live lookup) | STARK Commercial | [TBD - Pricing Manager] | Use PR prices or fallback table |
| SalesApp (bidirectional) | STARK Digital | [TBD - SalesApp PM] | One-way: they push to us |
| Contract Management (Icertis) | STARK Legal | [TBD - Contracts Lead] | Manual contract reference |
| 3-Way Match | STARK Operations | [TBD - WMS Lead] | 2-way match until NYCE ready |
| Stock Transfer Orders | STARK Operations | [TBD - WMS Lead] | Out of scope until NYCE |

**Required: STARK to Confirm**
1. Responsible person name for each integration
2. Target go-live date for each system
3. API/interface specification owner

---

### 6.8 Data Ownership

**Data Responsibility Matrix**

| Data Type | System of Record | STARK Owner | Our Role |
|-----------|-----------------|-------------|----------|
| Supplier Master | MDM | [TBD - MDM Admin] | Consume, cache locally |
| Product Master | PIM | [TBD - PIM Admin] | Consume, cache locally |
| Branch Master | MDM | [TBD - MDM Admin] | Consume, cache locally |
| User/Role Data | IAM/SSO | STARK IT | Consume via SSO |
| Pricing Data | Pricing Domain | [TBD - Pricing Manager] | Consume PR prices |
| Purchase Requests | Procurement System | Procurement Team | Create, manage |
| Purchase Orders | Procurement System | Procurement Team | Create, manage |
| Invoices | Procurement System | Procurement Team | Receive, match |
| Approvals | Procurement System | Procurement Team | Create, manage |

**Required: STARK to Confirm**
1. Responsible person for each data domain
2. Data quality SLA (freshness, accuracy)
3. Escalation path for data issues

---

### 6.9 Intellectual Property

**Ownership**

| Asset | Owner |
|-------|-------|
| Application Source Code | Agentic Agency |
| Design System Components | Agentic Agency (via Command Center) |
| Business Configuration | STARK (data, thresholds, rules) |
| User Data | STARK |
| Transaction Data | STARK |

**License Grant**

STARK receives:
- Perpetual, non-exclusive license to use the software
- Right to access and export all data
- Right to receive updates during operating agreement

**Non-Compete Commitment**

Agentic Agency commits:
- Not to sell substantially similar procurement software to named competitors:
  - Bauhaus (Denmark)
  - Silvan (Denmark)
  - XL-BYG (Denmark)
  - Beijer Byggmaterial (Nordic)
  - Optimera (Nordic)
- Duration: Term of operating agreement + 2 years
- Scope: Denmark market only

**Exclusions from Non-Compete:**
- Generic procurement SaaS (not customized for building materials)
- Platform components (Command Center, Design System)
- Different industry verticals

---

### 6.10 Training & Onboarding

**AI Academy Approach**

Training is embedded in the STARK Command Center platform:

| Component | Delivery |
|-----------|----------|
| In-App Guidance | Contextual tooltips, guided tours |
| AI Academy Courses | Online modules in Command Center |
| Role-Based Paths | Buyer, Approver, Admin tracks |
| Assessment | Quiz-based certification |

**Training Content**

| Module | Duration | Audience |
|--------|----------|----------|
| Platform Overview | 30 min | All users |
| PR Management | 45 min | Buyers |
| PO Bundling & Sending | 60 min | Buyers |
| Invoice Matching | 45 min | Buyers |
| Approval Workflow | 30 min | Approvers |
| System Administration | 60 min | Admins |

**No Traditional Training Sessions:**
- No classroom training
- No on-site trainers
- Self-paced, available 24/7
- Progress tracked in Command Center

---

### 6.11 Timeline & Milestones

**Delivery Schedule**

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| M1: Foundation | Week 2 | Design system, data model, seed data |
| M2: Core Screens | Week 4 | Dashboard, PR List, PO List, Supplier List |
| M3: Workflows | Week 6 | PR→PO conversion, bundling, sending |
| M4: Invoicing | Week 8 | Invoice matching, discrepancy queue |
| M5: Approvals | Week 9 | Approval workflow, delegation |
| M6: Integration | Week 10 | Relex, ECom, Stark Output connections |
| M7: Polish | Week 11 | Performance, UX refinement |
| M8: Go-Live | Week 12 | Production deployment, user onboarding |

**Dependencies for Go-Live:**

| Item | Owner | Required By |
|------|-------|-------------|
| SSO Configuration | STARK IT | Week 6 |
| Supplier Data Export | STARK MDM | Week 2 |
| Branch Data Export | STARK MDM | Week 2 |
| Stark Output API Access | STARK Integration | Week 6 |
| Relex API Access | STARK Integration | Week 6 |
| ECom API Access | STARK Digital | Week 6 |

---

## Section 7: Non-Functional Requirements (NFRs)

### 7.1 Performance Requirements

**Response Time Targets**

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Dashboard Load | 1.5s | 2.5s | 4s |
| List View (50 items) | 0.8s | 1.5s | 2.5s |
| Detail View | 0.5s | 1s | 1.5s |
| Search Results | 1s | 2s | 3s |
| Create/Update | 0.5s | 1s | 2s |
| Report Generation | 3s | 5s | 10s |

**Throughput Capacity**

| Metric | Baseline | Sustained | Burst |
|--------|----------|-----------|-------|
| API Requests/min | 500 | 1,000 | 3,000 |
| Concurrent Users | 30 | 60 | 100 |
| POs/hour | 250 | 500 | 1,500 |
| Invoices/hour | 150 | 300 | 1,000 |

**Database Performance**

| Metric | Target |
|--------|--------|
| Query P95 | <100ms |
| Write P95 | <50ms |
| Connection Pool | 50 connections |
| Index Usage | >99% of queries |

### 7.2 Scalability Analysis

**Baseline Volumes (Current)**

| Metric | Annual | Daily | Hourly (Peak) |
|--------|--------|-------|---------------|
| POs | 750,000 | 2,054 | 257 |
| PRs (estimated 1.5x POs) | 1,125,000 | 3,082 | 385 |
| Invoices (estimated 0.8x POs) | 600,000 | 1,644 | 206 |
| Approvals (estimated 0.1x POs) | 75,000 | 206 | 26 |
| Total Transactions | ~2.5M | ~7,000 | ~875 |

**Sensitivity Analysis: Volume Scaling**

| Scale | POs/Year | POs/Hour (Peak) | DB Rows/Year | Infrastructure Impact |
|-------|----------|-----------------|--------------|----------------------|
| **1x (Current)** | 750K | 257 | ~10M | Single Vercel region |
| **20x** | 15M | 5,140 | ~200M | Multi-region, read replicas |
| **50x** | 37.5M | 12,850 | ~500M | Sharding, dedicated DB |
| **100x** | 75M | 25,700 | ~1B | Enterprise architecture |
| **200x** | 150M | 51,400 | ~2B | Requires re-architecture |

**Stack Capability Assessment**

| Component | 1x | 20x | 50x | 100x | 200x |
|-----------|----|----|-----|------|------|
| **Next.js on Vercel** | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **PostgreSQL (Managed)** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Redis Cache** | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Kafka** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dexie (Client)** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Handles with current architecture
- ⚠️ Requires optimization (indexing, caching, read replicas)
- ❌ Requires architectural changes (sharding, dedicated instances)

**Scaling Recommendations by Tier**

**At 20x (15M POs/year):**
- Add PostgreSQL read replicas
- Implement aggressive caching (Redis)
- Add multi-region deployment
- Estimated additional cost: +50% infrastructure

**At 50x (37.5M POs/year):**
- Horizontal partitioning (by branch/region)
- Dedicated database cluster
- CDN for static content
- Consider migration to serverless PostgreSQL (Neon, PlanetScale)
- Estimated additional cost: +200% infrastructure

**At 100x (75M POs/year):**
- Complete re-architecture required
- Microservices decomposition
- Event sourcing for write-heavy entities
- Dedicated infrastructure (not shared platform)
- Estimated additional cost: +500% infrastructure + re-development

**At 200x (150M POs/year):**
- Enterprise-grade data platform
- Geographic sharding
- Specialized procurement data warehouse
- Likely requires vendor consolidation or custom build
- Out of scope for current architecture

### 7.3 Extensibility

**Built-In Extension Points**

| Extension Point | Mechanism | Example Use |
|-----------------|-----------|-------------|
| PR Sources | API endpoint per source | Add new ordering system |
| Supplier Channels | Channel adapter pattern | Add supplier portal |
| Matching Rules | Configurable tolerance | Adjust per supplier |
| Approval Workflow | Threshold configuration | Add new approval levels |
| Dashboard Widgets | Component composition | Add custom KPI |
| Export Formats | Report generator | New CSV/Excel format |

**Future Integration Patterns**

| Pattern | When to Use |
|---------|-------------|
| Webhook | Push notifications to external systems |
| Polling API | External systems query our status |
| Kafka Events | Event-driven integration (recommended) |
| File Drop | Legacy system compatibility |

**Multi-Country Extensibility**

Current scope: Denmark only

For multi-country expansion (Sweden, Norway, Finland):

| Aspect | Effort |
|--------|--------|
| Multi-currency | Medium (schema change) |
| Multi-language UI | Medium (i18n framework) |
| Country-specific tax | High (tax rule engine) |
| Local regulations | High (compliance review) |
| Estimated total | 4-6 week project per country |

### 7.4 Reliability Requirements

| Metric | Target |
|--------|--------|
| Mean Time Between Failures (MTBF) | >720 hours (30 days) |
| Mean Time To Recovery (MTTR) | <30 minutes |
| Recovery Point Objective (RPO) | 1 hour |
| Recovery Time Objective (RTO) | 4 hours |

**Backup Strategy**

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| PostgreSQL | Continuous (WAL) | 30 days | Multi-region |
| Point-in-time Recovery | Available | 7 days | Same region |
| Application Code | Git | Indefinite | GitHub |
| Configuration | Git | Indefinite | GitHub |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 DRAFT | 2026-03-22 | Claude + DHK | Initial draft for discussion |
| 1.1 DRAFT | 2026-03-22 | Claude + DHK | Added Appendix A (Screen Criteria) |
| 1.2 DRAFT | 2026-03-22 | Claude + DHK | Added Appendix B (API Contracts) and C (Data Model) |
| 1.3 DRAFT | 2026-03-23 | Claude + DHK | Added Section 6 (Commercial & Operational Terms) and Section 7 (NFRs with Scalability Analysis) |
