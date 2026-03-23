# STARK Procurement — Possible Automation

> **Purpose:** Analysis of automation opportunities via agent and non-agent solutions
> **Status:** Internal discussion document — NOT part of contracted scope
> **Created:** 2026-03-23

---

## Executive Summary

This document explores automation opportunities beyond the core scope, analyzing what's possible with current AI capabilities (Claude, March 2026) and traditional automation patterns. These represent potential future phases or add-on proposals.

**Current scope delivers:** Better procurement software
**Agentic scope could deliver:** AI-powered procurement team

---

## Part 1: Current State Analysis

### User Time Allocation (Estimated)

| Activity | % of Time | Automation Potential |
|----------|-----------|---------------------|
| Routine matching/verification | 40% | High (agent) |
| Chasing confirmations/follow-ups | 25% | High (agent) |
| Exception investigation | 15% | Medium (agent-assisted) |
| Supplier relationships | 10% | Low (human + AI assist) |
| Strategic decisions | 10% | None (human only) |

### Volume Context

- 750,000 POs/year
- ~2,000 POs/day
- 30 users → ~67 POs/user/day across full lifecycle
- €1.1B annual spend under management

---

## Part 2: What Claude Can Reliably Do Today

### High Reliability (95%+)

| Capability | Use Case | Guardrails Needed |
|------------|----------|-------------------|
| Parse structured documents | EDI, API payloads | Schema validation |
| Apply business rules | Matching, routing, approval | Rule audit trail |
| Explain decisions | Audit narratives | Reasoning chain logged |
| Draft professional text | Emails, summaries | Human review option |
| Answer data queries | "Status of order X?" | Scoped to authorized data |

### Good Reliability (85-95%)

| Capability | Use Case | Guardrails Needed |
|------------|----------|-------------------|
| Parse PDF invoices | Document ingestion | Confidence scoring, human review queue |
| Extract from emails | Confirmation parsing | Structured confirmation flow |
| Spot anomalies | Fraud, errors | Configurable sensitivity |
| Multi-document synthesis | Cross-reference PO/Invoice/Delivery | Source citation |

### Emerging Reliability (70-85%)

| Capability | Use Case | Guardrails Needed |
|------------|----------|-------------------|
| Predict from patterns | Delivery delays | Confidence intervals, 6mo+ history |
| Negotiate within parameters | Price discussions | Strict limits, human escalation |
| Learn preferences | Personalization | Cannot modify own mandate |

---

## Part 3: Proposed Agent Types

### Agent 1: Document Processing Agent

**Function:** Ingest unstructured documents (PDF invoices, email confirmations, delivery notes)

| Capability | Description |
|------------|-------------|
| PDF parsing | Extract invoice data from supplier PDFs |
| Email extraction | Parse confirmation emails for dates, quantities |
| Multi-language | Danish + English support |
| Confidence scoring | Flag low-confidence extractions for human review |
| Learning | Improve extraction for repeat suppliers |

**Business impact:** If 30% of documents are unstructured → saves ~100 hours/month of data entry

**Authority:** No approval authority. Extraction only, human confirms.

---

### Agent 2: Supplier Communication Agent

**Function:** Manage routine supplier communications

| Capability | Description |
|------------|-------------|
| Draft follow-ups | "PO-12345 not confirmed after 48h" |
| Parse responses | Extract delivery dates, changes from replies |
| Handle queries | Auto-respond to routine supplier questions |
| Relationship context | Remember supplier preferences, contacts |
| Escalate negotiations | Flag when human judgment needed |

**Business impact:** 25% of buyer time is chasing → reclaim 7.5 FTE equivalent

**Authority modes:**
- **Draft-and-review:** Agent drafts, human sends (initial)
- **Auto-send routine:** Agent sends standard follow-ups autonomously (after trust established)
- **Never autonomous:** Negotiations, complaints, new relationships

---

### Agent 3: Invoice Match Agent

**Function:** Automated 2-way/3-way invoice matching

| Capability | Description |
|------------|-------------|
| Exact matching | PO number, line items, quantities, prices |
| Tolerance matching | Within configurable variance |
| Discrepancy detection | Flag mismatches with explanation |
| Auto-approval | Approve within mandate |
| Escalation | Route exceptions to human queue |

**Authority parameters:**
```
maxApprovalValueDKK: 5,000
matchTolerancePercent: 1.0
confidenceThreshold: 0.95
allowedSuppliers: [trusted-list] or *
requiresHumanReview: [new_supplier, first_order, price_increase]
```

**Business impact:** 80% of invoices auto-matched → focus human time on exceptions

---

### Agent 4: Root Cause Analyst Agent

**Function:** Investigate discrepancies automatically

| Capability | Description |
|------------|-------------|
| Cross-reference | Check PO, invoice, delivery note, confirmations |
| Timeline reconstruction | "Supplier confirmed qty 100 on [date], invoice shows 95" |
| Pattern matching | "This supplier frequently short-ships by 2-5%" |
| Resolution suggestion | "Accept (within tolerance)" or "Dispute (supplier error)" |
| Learning | "Last 5 times this happened, you accepted because [reason]" |

**Business impact:** 15% of time on investigation → near-zero for routine discrepancies

**Authority:** No approval authority. Investigation and recommendation only.

---

### Agent 5: Morning Brief Orchestrator

**Function:** Prepare user's workday

| Capability | Description |
|------------|-------------|
| Overnight processing | Process arrivals while user sleeps |
| Priority queue | Rank items by urgency, value, deadline |
| Pre-drafted actions | Emails ready for review, approvals queued |
| Exception summary | "3 items need you — here's why" |
| Proactive alerts | "Supplier X hasn't responded to 3 POs" |

**User experience:**
```
08:00  Open Morning Brief
       → "Overnight: 42 invoices processed (38 auto-approved, 4 need review)"
       → "3 follow-up emails drafted, ready to send"
       → "Priority: Contract renewal with Supplier Y due Friday"
       → "Alert: Supplier X lead times increasing — review?"
```

**Business impact:** 30-60 min/day of triage → 5 min review

---

### Agent 6: Proactive Intelligence Agent

**Function:** Predict and prevent issues

| Capability | Description |
|------------|-------------|
| Delivery prediction | "PO-12345 likely 3 days late based on pattern" |
| Supplier trending | "Quality declining 15% over 6 months" |
| Price forecasting | "Commodity X trending up — order now?" |
| Cash flow projection | "Next week's PO commitments: DKK 2.3M" |
| Optimization suggestions | "Bundle these 5 PRs to save on shipping" |

**Business impact:** Prevention vs. fire-fighting. Fewer stockouts, better terms.

**Data requirements:** 6+ months of historical data for reliable predictions.

---

### Agent 7: Conversational Interface

**Function:** Natural language interaction with system

| Capability | Description |
|------------|-------------|
| Queries | "What's the status of orders to Supplier X?" |
| Commands | "Approve all invoices under 5K from trusted suppliers" |
| Drafting | "Write an email asking about late delivery" |
| Summarization | "Summarize this week's exceptions" |
| Onboarding | New users ask questions, agent guides |

**Channels:**
- In-app chat
- Slack/Teams integration
- Mobile app

**Business impact:** Reduced training time, executive adoption, accessibility.

---

## Part 4: Agent Governance Framework

### Core Principle: Agents Are Users, Not Gods

```
┌─────────────────────────────────────────────────────────────────────┐
│  AUTHORITY HIERARCHY                                                │
│                                                                     │
│  ┌─────────────┐                                                   │
│  │   HUMAN     │  Can modify: Own delegation, own preferences      │
│  │   USERS     │  Cannot modify: Own authority limits              │
│  └─────────────┘                                                   │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │   AGENTS    │  Can modify: NOTHING about themselves             │
│  │             │  Cannot modify: Own mandate, limits, parameters   │
│  └─────────────┘                                                   │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │   ADMIN     │  Can modify: Human limits, agent mandates         │
│  │   (Human)   │  Constraint: Agent mandate changes require 2-eyes │
│  └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Authority Matrix Template

| Parameter | Description | Example |
|-----------|-------------|---------|
| `maxApprovalValueDKK` | Hard ceiling per transaction | 5,000 |
| `dailyApprovalLimitDKK` | Cumulative daily limit | 50,000 |
| `allowedSources` | Which PR sources agent can process | `[relex]` |
| `allowedSuppliers` | Supplier whitelist (or `*`) | `[trusted-list]` |
| `matchTolerancePercent` | Price/qty variance tolerance | 1.0% |
| `confidenceThreshold` | Min confidence to auto-approve | 0.95 |
| `requiresHumanReview` | Conditions forcing escalation | `[new_supplier]` |

### Who Can Modify What

| Entity | Can Modify | Cannot Modify | Approval Required |
|--------|------------|---------------|-------------------|
| **Buyer** | Own delegation | Own limits, any agent | — |
| **Approver** | Own delegation | Own limits, any agent | — |
| **Admin** | Human limits | Agent mandates alone | Single admin |
| **Admin** | Agent mandates | — | **2-admin approval** |
| **Agent** | **NOTHING** | Own mandate, limits, parameters | N/A |

### Agent Audit Trail

```json
{
  "approvalId": "apr-uuid",
  "approvedBy": {
    "type": "agent",
    "agentId": "InvoiceMatchAgent",
    "version": "1.2.3"
  },
  "decision": "APPROVED",
  "confidence": 0.987,
  "rulesApplied": [
    "exact_po_match",
    "quantity_within_tolerance",
    "known_supplier"
  ],
  "mandateAtDecision": {
    "maxApprovalValueDKK": 5000,
    "matchTolerancePercent": 1.0
  },
  "reasoning": "Invoice matches PO exactly. Supplier is on trusted list. Value 3,450 DKK within my limit of 5,000 DKK.",
  "timestamp": "2026-03-23T09:15:00Z"
}
```

---

## Part 5: Non-Agent Automation Opportunities

Traditional automation without AI:

| Opportunity | Implementation | Impact |
|-------------|----------------|--------|
| **Scheduled batch processing** | Cron jobs for overnight matching | 24/7 throughput |
| **Rule-based routing** | Business rules engine | Consistent triage |
| **Email templates** | Pre-defined follow-up templates | Faster communication |
| **Threshold alerts** | Value-based notifications | Proactive escalation |
| **Scheduled reports** | Auto-generated daily/weekly reports | Reduced manual reporting |
| **Bulk operations** | Multi-select UI actions | Efficiency for humans |
| **Auto-reminders** | Time-based follow-up triggers | Reduced manual tracking |

---

## Part 6: Business Case Summary

### Conservative Estimate (Core Agents Only)

| Agent | Time Saved/Month | Value (€60K/FTE/year) |
|-------|------------------|----------------------|
| Document Processing | 100 hours | €35K/year |
| Supplier Comms | 150 hours | €52K/year |
| Invoice Matching | 200 hours | €70K/year |
| Root Cause Analysis | 75 hours | €26K/year |
| Morning Brief | 60 hours | €21K/year |
| **Total** | **585 hours/month** | **€204K/year** |

### Aggressive Estimate (Full Agentic Suite)

| Metric | Current | Agentic | Improvement |
|--------|---------|---------|-------------|
| Routine work | 80% of time | 20% of time | 75% reduction |
| Effective capacity | 30 FTE | 100+ FTE equivalent | 3x+ |
| Processing window | 8 hours/day | 24 hours/day | 3x |
| Error rate | Human variance | Consistent | ~50% reduction |
| New hire ramp | 3-6 months | Days | 90%+ reduction |

**Value at scale:**
- 30 staff × €60K × 60% time savings = **€1.08M/year** labor value
- Plus: error reduction, faster processing, better supplier terms

---

## Part 7: Implementation Phasing

### Phase 1: Foundation (Months 1-3)
- Invoice Match Agent (auto-approve within limits)
- Document Processing Agent (PDF/email parsing)
- Root Cause Agent (investigation assistance)

### Phase 2: Communication (Months 4-6)
- Supplier Communication Agent (draft-and-review mode)
- Morning Brief Orchestrator
- Bulk operations enhancement

### Phase 3: Intelligence (Months 7-9)
- Proactive Intelligence Agent (predictions)
- Conversational Interface (in-app)
- Supplier Comms Agent (auto-send routine)

### Phase 4: Expansion (Months 10-12)
- Slack/Teams integration
- Mobile conversational access
- Advanced learning and personalization

---

## Part 8: Risk Considerations

| Risk | Mitigation |
|------|------------|
| Agent makes bad decision | Mandate limits, confidence thresholds, human oversight |
| Agent authority creep | 2-admin approval for mandate changes |
| Supplier relationship damage | Draft-and-review for communications initially |
| Data privacy | Scoped access, audit trails, no external data sharing |
| Over-reliance on agents | Clear human accountability, regular human review |
| Vendor lock-in | Standard interfaces, portable data |

---

## Appendix: Data Model for Agent Governance

```sql
-- Agent Registry
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,           -- e.g., "InvoiceMatchAgent"
    type VARCHAR NOT NULL,           -- MATCHER, CLASSIFIER, COMMUNICATOR, etc.
    version VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Agent Mandates (versioned)
CREATE TABLE agent_mandates (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    max_approval_value_dkk DECIMAL,
    daily_approval_limit_dkk DECIMAL,
    allowed_sources TEXT[],          -- e.g., ['relex', 'ecom']
    allowed_suppliers TEXT[],        -- e.g., ['*'] or specific IDs
    match_tolerance_percent DECIMAL,
    confidence_threshold DECIMAL,
    risk_tolerance VARCHAR,          -- CONSERVATIVE, STANDARD, AGGRESSIVE
    escalation_triggers TEXT[],      -- e.g., ['new_supplier', 'price_increase']
    approved_by_1 UUID REFERENCES users(id),
    approved_by_2 UUID REFERENCES users(id),  -- 2-eyes requirement
    approved_at TIMESTAMP
);

-- Agent Decision Log
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    decision_type VARCHAR NOT NULL,  -- APPROVE, REJECT, ESCALATE, DRAFT
    entity_type VARCHAR NOT NULL,    -- PR, PO, INVOICE, EMAIL
    entity_id UUID NOT NULL,
    confidence DECIMAL,
    rules_applied TEXT[],
    mandate_snapshot JSONB,          -- Frozen mandate at decision time
    reasoning TEXT,                  -- Human-readable explanation
    escalation_reason TEXT,
    superseded_by UUID,              -- If human overrides
    created_at TIMESTAMP
);
```

---

*This document is for internal planning and future roadmap discussions. Capabilities described here are NOT part of the current contracted scope.*
