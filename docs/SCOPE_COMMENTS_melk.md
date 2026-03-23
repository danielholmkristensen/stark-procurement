## Reading Comments

- would leave 3.3 Data Sync — IN SCOPE out. Not standard, not very useful, creates risk of problems / confusion. Not standard in "web-portals" towards live data. Makes for complicated and hard-to understand ops.
- 3.1 Data Storage — IN SCOPE - who manages maintenance, back-up, etc. Where hosted?
- Incoming REST api security model?
- Incoming REST api - well-defined how we can reject and what happens? well-defied what happens if we are unavailable (would a message queue be better, how does Stark normally deliver data around)
- Stark Output an existing infrastructure?
- What if we can't deliver - temporarily, permanently, bounces?
- 4.3 Outbound: Status Events — IN SCOPE - these are only "informational", not data-carrying transactional?
- 5.1 Infrastructure — IN SCOPE - det ser ud som om, du foreslår ekstern hosting af det hele (undtaget eksisterende systemer som kafka) - er det korrekt forstået - og er det det, de vil have / kan acceptere?
- Logging Structured JSON logs Queryable audit trail - logging af hvad? Og hvor sendes json hen?
- Authorization Role-based access control - har vi et UI interface til rollestyring? Og har vi en rolletabel i postgres? Burde vi måske lave rolletabellen direkte i scope med mulige handlinger?
- Måske burde introen gøre klart, hvem brugerne, og brugertyperne er?
- This project uses agentic development — AI-assisted coding at 8x traditional velocity - Hvis Kim er medlæser, måske ikke have dette med :-)

## Users & Roles — Missing from Scope

The document does not have a dedicated section defining who the users are. User information is scattered and implicit:

- "30 procurement staff" is mentioned in the Scale table, but never broken down
- Three role names — **Buyer, Approver, Admin** — appear only in the training content (section 6.10), never formally defined
- RBAC is referenced in Security (6.5) but the actual roles and their permissions are not listed
- Approval routing mentions "user role" thresholds without specifying which roles exist
- SSO/IAM is stated as the source of roles, but there is no mapping of what those roles grant


**What should be added (suggested placement: right after Executive Summary):**

1. **Role definitions** — what each role does, roughly how many of each
2. **Permission matrix** — which roles can access which screens and perform which actions (e.g., can a Buyer approve? Can an Admin edit POs?)
3. **Who is NOT a user** — suppliers (no portal), finance/AP (SAP), warehouse (NYCE), branch managers (BI tools)
4. **User journey context** — the dashboard implies a "morning briefing" workflow but there is no description of who does what during the day

Without this, a vendor has to guess the RBAC complexity and the number of distinct user journeys, which directly affects estimation.

## Outbound Delivery — Gaps in "What Leaves the System"

PO-to-supplier via Stark Output is well-specified (protocol, boundary, API contracts). The rest of the outbound story has gaps that matter for estimation and integration planning.

**1. Approved invoices → SAP Finance (the biggest gap)**
The doc says "Export approved invoices" / "Export CSV for manual import" but never specifies: what fields, what format SAP needs, who triggers it (button click, scheduled job, auto on approval), or where it goes (browser download, SFTP, email). No export screen exists in the 16 screens listed. This is the system's terminal financial output — it needs its own specification.

**2. Kafka event payloads — informational or transactional?**
The six events list field names like "PO ID, PR IDs, supplier" but don't clarify whether these are lightweight notifications (just IDs, consumers look up details) or full data payloads where the data is used as real data. This determines message size, schema contracts, and consumer complexity. (Relates to reading comment on 4.3.)

**3. Report/CSV exports — unspecified**
"Export to CSV/Excel" appears as a data query capability (3.2) but no screen defines an export button, which entities are exportable, or what columns are included.

**4. Outbound failure handling**
Line 2616 says "Queue for retry, alert user" when Stark Output is down, but there is no retry policy, dead-letter queue design, or alert mechanism specified. (Relates to reading comments on delivery failures.)

**Suggestion:** Add a dedicated "Outbound Data Flows" section in Domain 4 that lists every piece of data that leaves the system, with: destination, trigger, format, failure handling, and whether it's in scope or not.

## Integration Failure Modes — Not Specified

Every non-UI data interface (inbound and outbound) should have defined failure mode(s) and handling strategy/ies. The current scope describes the happy path but is largely silent on what happens when things go wrong. For a production system processing 750K POs/year, failure handling is not an edge case — it's a core requirement.

**What's needed per integration point:**
- **Inbound** (Relex, ECom, SalesApp, Aspect4): What happens on validation failure? On duplicate? On our unavailability — does the sender retry, or are messages lost? Is there a dead-letter mechanism?
- **Outbound** (Stark Output, Kafka, Status API): What happens on timeout, partial failure, or prolonged outage? Retry policy (count, backoff)? Dead-letter queue? How/when is the user alerted?

**Why it matters:** Without this, a vendor either under-scopes (builds only the happy path, system is fragile) or over-scopes (builds elaborate resilience the client didn't ask for). Either way leads to disputes. Defining failure modes up front also forces alignment on who is responsible for retry/recovery at each boundary.

**Suggestion:** Add a "Failure Modes" column to the integration tables in Domain 4 (sections 4.1–4.4), or add a cross-cutting "Integration Resilience" subsection covering: retry policy, dead-letter handling, alerting, and recovery responsibility for each interface.

---
