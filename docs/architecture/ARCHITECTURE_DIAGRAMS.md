# STARK Procurement — Architecture Diagrams

> **Purpose:** Visual architecture documentation for enterprise stakeholders
> **Framework:** TOGAF-aligned using ai-assisted-architecture standards
> **Last Updated:** 2026-03-23

---

## 1. System Context (C4 Level 1)

Shows STARK Procurement and its interactions with external systems and users.

```mermaid
C4Context
    title STARK Procurement — System Context

    Person(buyer, "Buyer", "Procurement specialist<br/>~20 users")
    Person(approver, "Approver", "Decision authority<br/>~8 users")
    Person(admin, "Admin", "System configuration<br/>~2 users")

    System(procurement, "STARK Procurement", "Purchase-to-Pay workflow<br/>PR → PO → Invoice → Approval")

    System_Ext(relex, "Relex SCP", "Automated replenishment<br/>~70% of PRs")
    System_Ext(ecom, "stark.dk", "E-commerce orders<br/>Drop shipment PRs")
    System_Ext(salesapp, "SalesApp", "Salesperson requests<br/>Manual PRs")
    System_Ext(aspect4, "Aspect4", "Legacy ERP<br/>Interim PO routing")
    System_Ext(starkoutput, "Stark Output", "Supplier communication<br/>EDI/Email delivery")
    System_Ext(sapfinance, "SAP Finance", "Invoice to payment<br/>Financial accounting")
    System_Ext(nyce, "NYCE WMS", "Warehouse management<br/>Goods receipt [FUTURE]")
    System_Ext(kafka, "STARK Kafka", "Event infrastructure<br/>Message broker")
    System_Ext(sso, "STARK SSO", "Identity provider<br/>SAML/OIDC")

    Rel(buyer, procurement, "Reviews PRs, creates POs,<br/>matches invoices")
    Rel(approver, procurement, "Approves POs/Invoices,<br/>handles exceptions")
    Rel(admin, procurement, "Configures thresholds,<br/>manages delegations")

    Rel(relex, kafka, "Publishes PRs")
    Rel(ecom, kafka, "Publishes PRs")
    Rel(salesapp, kafka, "Publishes PRs")
    Rel(kafka, procurement, "Consumes PRs")

    Rel(procurement, kafka, "Publishes POs, Events")
    Rel(kafka, starkoutput, "Consumes POs")
    Rel(kafka, sapfinance, "Consumes approved invoices")

    Rel(aspect4, procurement, "Interim PO data [TOGGLE-READY]")
    Rel(procurement, sso, "Authenticates users")

    BiRel(procurement, nyce, "Goods receipt [FUTURE]")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
```

---

## 2. Container Diagram (C4 Level 2)

Shows the internal containers of STARK Procurement.

```mermaid
C4Container
    title STARK Procurement — Container Diagram

    Person(user, "Procurement User", "Buyer / Approver / Admin")

    Container_Boundary(procurement, "STARK Procurement") {
        Container(webapp, "Web Application", "Next.js on Vercel", "User interface<br/>16 screens")
        Container(api, "API Layer", "Next.js API Routes", "REST endpoints<br/>Business logic")
        ContainerDb(db, "Database", "PostgreSQL", "PRs, POs, Invoices<br/>Approvals, Audit")
        ContainerDb(cache, "Cache", "Redis", "Sessions<br/>Rate limiting")
        Container(consumers, "Kafka Consumers", "Node.js", "PR ingestion<br/>Per-source consumers")
        Container(producers, "Kafka Producers", "Node.js", "PO publishing<br/>Event emission")
    }

    System_Ext(kafka, "STARK Kafka", "Message broker")
    System_Ext(sso, "STARK SSO", "Identity provider")

    Rel(user, webapp, "HTTPS")
    Rel(webapp, api, "Internal calls")
    Rel(api, db, "SQL")
    Rel(api, cache, "Redis protocol")
    Rel(kafka, consumers, "Consume messages")
    Rel(producers, kafka, "Publish messages")
    Rel(consumers, api, "Process PRs")
    Rel(api, producers, "Trigger events")
    Rel(webapp, sso, "SAML/OIDC")
```

---

## 3. Kafka Integration Architecture

Shows the topic topology for Kafka-native integration.

```mermaid
flowchart TB
    subgraph Sources["Source Systems"]
        relex[Relex SCP]
        ecom[stark.dk ECom]
        salesapp[SalesApp]
        aspect4[Aspect4]
    end

    subgraph InboundTopics["Inbound Kafka Topics"]
        t_relex[stark.procurement<br/>.inbound.prs.relex]
        t_ecom[stark.procurement<br/>.inbound.prs.ecom]
        t_salesapp[stark.procurement<br/>.inbound.prs.salesapp]
        t_aspect4[stark.procurement<br/>.inbound.pos.aspect4]
    end

    subgraph DLQInbound["Dead Letter Queues"]
        dlq_relex[.relex.dlq]
        dlq_ecom[.ecom.dlq]
        dlq_salesapp[.salesapp.dlq]
        dlq_aspect4[.aspect4.dlq]
    end

    subgraph Procurement["STARK Procurement"]
        consumers[Kafka Consumers<br/>Per-source]
        core[Core Application<br/>Business Logic]
        producers[Kafka Producers<br/>Per-channel]
    end

    subgraph OutboundTopics["Outbound Kafka Topics"]
        t_edi[stark.procurement<br/>.outbound.pos.edi]
        t_email[stark.procurement<br/>.outbound.pos.email]
        t_finance[stark.procurement<br/>.outbound.finance.invoices]
    end

    subgraph EventTopics["Event Topics (Informational)"]
        e_pr[.events.pr.received]
        e_po_created[.events.po.created]
        e_po_sent[.events.po.sent]
        e_inv_matched[.events.invoice.matched]
    end

    subgraph Consumers["Consumer Systems"]
        starkoutput[Stark Output<br/>EDI/Email]
        sapfinance[SAP Finance]
        dashboards[Monitoring<br/>Dashboards]
    end

    relex --> t_relex
    ecom --> t_ecom
    salesapp --> t_salesapp
    aspect4 --> t_aspect4

    t_relex --> consumers
    t_ecom --> consumers
    t_salesapp --> consumers
    t_aspect4 --> consumers

    consumers -.->|failures| dlq_relex
    consumers -.->|failures| dlq_ecom
    consumers -.->|failures| dlq_salesapp
    consumers -.->|failures| dlq_aspect4

    consumers --> core
    core --> producers

    producers --> t_edi
    producers --> t_email
    producers --> t_finance
    producers --> e_pr
    producers --> e_po_created
    producers --> e_po_sent
    producers --> e_inv_matched

    t_edi --> starkoutput
    t_email --> starkoutput
    t_finance --> sapfinance
    e_pr --> dashboards
    e_po_created --> dashboards
```

---

## 4. Process Flow: PR to Payment

Shows the end-to-end procurement workflow.

```mermaid
flowchart LR
    subgraph Ingestion["1. PR Ingestion"]
        pr_receive[Receive PR<br/>via Kafka]
        pr_validate[Validate<br/>& Deduplicate]
        pr_classify[Classify by<br/>Source & Value]
    end

    subgraph POGen["2. PO Generation"]
        bundle[Bundling<br/>Workspace]
        po_create[Create PO<br/>with Packets]
        po_price[Apply<br/>Pricing]
    end

    subgraph Approval1["3. PO Approval"]
        po_route[Route by<br/>Value & Authority]
        po_approve{Within<br/>Limit?}
        po_chain[Multi-Level<br/>Chain]
    end

    subgraph Send["4. Supplier Communication"]
        po_format[Format for<br/>Channel]
        po_send[Send via<br/>Stark Output]
        po_confirm[Await<br/>Confirmation]
    end

    subgraph Invoice["5. Invoice Processing"]
        inv_receive[Receive<br/>Invoice]
        inv_match[2-Way<br/>Match]
        inv_discrepancy{Match<br/>OK?}
    end

    subgraph Approval2["6. Invoice Approval"]
        inv_route[Route by<br/>Value]
        inv_approve[Approve for<br/>Payment]
        inv_export[Export to<br/>SAP Finance]
    end

    pr_receive --> pr_validate --> pr_classify
    pr_classify --> bundle --> po_create --> po_price
    po_price --> po_route --> po_approve
    po_approve -->|Yes| po_format
    po_approve -->|No| po_chain --> po_format
    po_format --> po_send --> po_confirm
    po_confirm --> inv_receive --> inv_match --> inv_discrepancy
    inv_discrepancy -->|Yes| inv_route
    inv_discrepancy -->|No| bundle
    inv_route --> inv_approve --> inv_export
```

---

## 5. Approval Workflow

Shows the approval decision flow with authority matrix and escalation.

```mermaid
flowchart TB
    subgraph Input["Item for Approval"]
        item[PO or Invoice]
        value[Value: X DKK]
    end

    subgraph AuthCheck["Authority Check"]
        check_limit{User limit<br/>>= X?}
        check_chain{Multi-level<br/>required?}
    end

    subgraph SingleApproval["Single Approval Path"]
        single_approve[User Approves]
        single_audit[Audit Trail]
    end

    subgraph ChainApproval["Multi-Level Approval Path"]
        chain_1[Approver 1]
        chain_2[Approver 2]
        chain_n[Approver N...]
        chain_complete{All<br/>Approved?}
    end

    subgraph Delegation["Delegation Check"]
        delegate_check{User<br/>Delegated?}
        delegate_act[Delegate Acts<br/>on Behalf]
        delegate_audit[Audit: By X<br/>on behalf of Y]
    end

    subgraph Escalation["Escalation"]
        timeout{> 48h<br/>Pending?}
        escalate[Auto-Escalate<br/>to Next Level]
        notify[Notify<br/>Stakeholders]
    end

    subgraph Output["Outcome"]
        approved[APPROVED]
        rejected[REJECTED]
    end

    item --> value --> check_limit
    check_limit -->|Yes| delegate_check
    check_limit -->|No| check_chain

    delegate_check -->|No| single_approve
    delegate_check -->|Yes| delegate_act --> delegate_audit --> single_approve

    single_approve --> single_audit --> approved

    check_chain -->|Yes| chain_1 --> chain_2 --> chain_n --> chain_complete
    check_chain -->|No, Escalate| escalate

    chain_complete -->|Yes| approved
    chain_complete -->|No| timeout

    timeout -->|Yes| escalate --> notify --> chain_1
    timeout -->|No| rejected
```

---

## 6. Data Model Overview

Shows the key entities and their relationships.

```mermaid
erDiagram
    USER ||--o{ PURCHASE_REQUEST : creates
    USER ||--o{ PURCHASE_ORDER : creates
    USER ||--o{ APPROVAL : decides
    USER ||--o{ DELEGATION : "delegates to"

    PURCHASE_REQUEST ||--o{ PO_LINE_ITEM : "converted to"
    PURCHASE_REQUEST }o--|| SUPPLIER : "ordered from"

    PURCHASE_ORDER ||--|{ PO_LINE_ITEM : contains
    PURCHASE_ORDER }o--|| SUPPLIER : "sent to"
    PURCHASE_ORDER ||--o{ APPROVAL : requires

    INVOICE ||--|{ INVOICE_LINE_ITEM : contains
    INVOICE }o--|| SUPPLIER : "received from"
    INVOICE ||--o| PURCHASE_ORDER : "matched to"
    INVOICE ||--o{ APPROVAL : requires

    SUPPLIER ||--o{ PURCHASE_ORDER : receives
    SUPPLIER ||--o{ INVOICE : sends

    PURCHASE_REQUEST {
        uuid id PK
        string source "relex|ecom|salesapp"
        string sourceReference
        uuid supplierId FK
        date needByDate
        decimal totalValue
        string status
    }

    PURCHASE_ORDER {
        uuid id PK
        string poNumber "PO-YYYY-NNNNN"
        uuid supplierId FK
        date requestedDeliveryDate
        decimal total
        string status "draft|approved|sent|confirmed|received"
    }

    INVOICE {
        uuid id PK
        string invoiceNumber
        uuid supplierId FK
        uuid matchedPOId FK
        decimal total
        string matchResult "exact|within_tolerance|discrepancy"
        string status
    }

    APPROVAL {
        uuid id PK
        string entityType "PO|INVOICE"
        uuid entityId FK
        uuid decidedBy FK
        uuid onBehalfOf FK "nullable - delegation"
        string decision "approved|rejected"
        string reason
        timestamp decidedAt
    }

    DELEGATION {
        uuid id PK
        uuid delegatorId FK
        uuid delegateId FK
        date startDate
        date endDate
        string scope "ALL|PO_ONLY|INVOICE_ONLY"
    }
```

---

## 7. User Journey: Buyer's Morning

Shows a typical Buyer workflow using the system.

```mermaid
journey
    title Buyer's Morning Workflow
    section Morning Brief
      Open Dashboard: 5: Buyer
      Review overnight activity: 4: Buyer
      Check priority items: 4: Buyer
    section PR Processing
      Review Relex PRs: 3: Buyer
      Bundle related PRs: 4: Buyer
      Create optimized POs: 4: Buyer
    section PO Management
      Send POs to suppliers: 5: Buyer
      Check confirmation status: 3: Buyer
      Follow up on pending: 3: Buyer
    section Invoice Matching
      Review matched invoices: 4: Buyer
      Resolve discrepancies: 2: Buyer
      Approve within limit: 5: Buyer
    section End of Day
      Review completed work: 4: Buyer
      Check pending approvals: 3: Buyer
```

---

## 8. Screen Navigation Map

Shows how users navigate between screens.

```mermaid
flowchart TB
    subgraph Dashboard["G1: Dashboard"]
        morning[Morning Briefing]
        kpis[KPI Summary]
        actions[Action Items]
    end

    subgraph PRModule["PR Management"]
        A1[A1: PR Inbox]
        A2[A2: PR Detail]
    end

    subgraph POModule["PO Management"]
        B1[B1: PO List]
        B2[B2: PO Detail]
        B3[B3: PO Kanban]
        C1[C1: Bundling Workspace]
    end

    subgraph InvoiceModule["Invoice Management"]
        D1[D1: Invoice List]
        D2[D2: Invoice Detail]
        D3[D3: Match Results]
        D4[D4: Discrepancy Queue]
    end

    subgraph ApprovalModule["Approvals"]
        E1[E1: Approval Queue]
        E2[E2: Approval History]
    end

    subgraph SupplierModule["Suppliers"]
        F1[F1: Supplier List]
        F2[F2: Supplier Detail]
    end

    subgraph Settings["H1: Settings"]
        prefs[User Preferences]
        authority[Authority Limits]
        delegation[Delegation]
    end

    morning --> A1
    morning --> E1
    morning --> D4

    A1 --> A2
    A2 --> C1
    C1 --> B2

    B1 --> B2
    B1 <--> B3
    B2 --> E1

    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> E1

    E1 --> B2
    E1 --> D2
    E1 --> E2

    F1 --> F2
    F2 --> B1
```

---

## Appendix: Diagram Legend

### C4 Model Colors

| Element | Color | Description |
|---------|-------|-------------|
| Person | Blue | Human actors |
| System (Internal) | Navy | STARK Procurement |
| System (External) | Gray | External systems |
| Container | Light Blue | Deployable units |
| Database | Blue-Gray | Data stores |

### Flow Diagram Colors

| Element | Color | Description |
|---------|-------|-------------|
| Process | Blue | Active processing |
| Decision | Yellow | Decision point |
| Data Store | Green | Storage |
| External | Gray | External system |
| DLQ/Error | Orange | Error handling |

### Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| Success | Green | Completed successfully |
| Attention | Orange | Needs review |
| Urgent | Red | Immediate action |
| Pending | Gray | Awaiting action |

---

*These diagrams follow TOGAF and C4 model standards. Source: `.ai-assisted-architecture/` framework.*
