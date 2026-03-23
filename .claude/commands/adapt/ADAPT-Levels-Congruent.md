# ADAPT Framework — Congruent Hierarchy Levels

> This document defines the canonical ADAPT hierarchy, harmonized from the original Devmeta framework with enterprise-ready terminology. Every term, duration, and mechanic is cross-referenced against the ADAPT Executive Summary deck, the corrected command files, and the Devmeta→ADAPT mapping.

---

## Level 1: Increment

**Duration:** 30 minutes – 15 hours
**Contains:** 2–6 Iterations
**SAFe analog:** Program Increment — but scope-boxed (not time-boxed), on-demand (not cadenced)
**Command:** `/adapt:start-increment-spec`

A major capability milestone. After an Increment, the user can do something they couldn't before. Scope is defined interactively between one human and one orchestrating agent, then frozen into an `_overview.md` with: on-screen deliverables, under-the-hood work, explicit deferral table, iteration map, and testable exit criteria. Scope is immutable once execution starts — only the human can cut scope.

**Key distinction from SAFe PI:** No Big Room Planning. No quarterly cadence. No multi-team coordination ceremony. One human defines scope with one agent in minutes. The Increment is triggered on-demand when there's a coherent set of capabilities to ship.

**Devmeta origin:** Epoch (renamed because "Epoch" has no agile precedent)

---

## Level 2: Iteration

**Duration:** 30 minutes – 4 hours
**Contains:** 2–4 Features
**SAFe analog:** Sprint — but scope-boxed, with automated graph-partitioned planning
**Commands:** `/adapt:plan-iteration`, `/adapt:go`

A coherent execution chunk that produces reviewed, tested, mergeable code (one PR). Every execution Iteration is structurally paired with an I&A Cycle — this is not optional. The Execute → Reflect rhythm is the heartbeat of ADAPT.

Planning is automated: the `/adapt:plan-iteration` command performs graph-partitioning of deliverables into file-independent Features, computes parallel Execution Waves, and creates the full tick structure. What takes a human team 2+ hours of Sprint Planning happens in seconds.

**Key distinction from SAFe Sprint:** No planning ceremony. No daily standups. No Sprint Review as a separate event. All coordination happens through persistent artifacts (Agent Backlog, Shared Context Logs, Knowledge Stores).

**Devmeta origin:** Iteration (name kept — already SAFe-native)

---

## Level 3: Feature

**Duration:** 15 minutes – 2 hours
**Contains:** 3–6 Tasks
**SAFe analog:** Feature (Agile Team level) — owned by one team, deliverable within one PI
**Command:** `/adapt:run` (spawns one worker agent per Feature)

The unit of agent context isolation. One agent gets one Feature, works it on an isolated git branch (worktree), completes all Tasks sequentially in a single session. The hard constraint: **zero cross-Feature file overlap** — enforced by the graph-partitioning algorithm during Iteration planning.

Features execute in parallel Execution Waves, ordered by dependency. Each Feature targets 60–70% of agent context window. Always ends with a "Re-ground" Task that writes to the Shared Context Log and Knowledge Stores.

**Key distinction from SAFe Feature:** In SAFe, Features can share files and require cross-team coordination. In ADAPT, Features are architecturally independent by construction — the graph-partitioning algorithm guarantees this. No coordination meetings needed.

**Devmeta origin:** Epic (renamed — CRITICAL change. SAFe Epic is portfolio-level, the largest container. Devmeta Epic was a worker assignment, the smallest container. This hierarchy inversion was the most urgent rename.)

---

## Level 4: Task

**Duration:** 5–30 minutes
**Contains:** Atomic (no children)
**SAFe analog:** Task — direct 1:1 mapping
**Command:** Within Feature execution (sequential)

Atomic work unit with: objective, spec reference, file scope, implementation steps, and surgical test commands. Sequential within a Feature — later Tasks reference earlier Tasks' work.

**Iron rule:** A Task cannot close with failing tests. The agent loops (implement → test → fail → debug → fix → test) until green. There is no "known failure" state. There is no "defer testing to later." The test-gate is structural, not aspirational.

**Key distinction from SAFe Task:** SAFe Tasks rely on team discipline for Definition of Done compliance. ADAPT Tasks structurally enforce it — the automation won't proceed until tests pass.

**Devmeta origin:** Task (name kept — universal, no confusion)

---

## Cross-Cutting: Inspect & Adapt Cycle (I&A)

**Duration:** 10–30 minutes
**Frequency:** Every Iteration (not once per Increment)
**SAFe analog:** Inspect & Adapt — but collapses 5 separate SAFe ceremonies into one automated sequence
**Command:** `/adapt:reflect`

A 12-step automated process that runs at every Iteration boundary:

1. Gather learnings from all sources
2. Categorize by destination document
3. Code quality review (reads actual code for drift patterns)
4. Outside-in gap verification against scope (trusts code, not tick status)
5. Cross-Feature pattern problem detection
6. Living documentation audit
7. Apply updates to permanent Knowledge Stores
8. Update Iteration status
9. Tag and prune ticks
10. Write narrative diary entry
11. Reassess remaining Iteration plan
12. Produce structured report

The I&A Cycle collapses Sprint Review + Retrospective + Code Review + Documentation Update + Sprint Planning into one automated 20-minute sequence. Critically: the last task IS real work for the next Iteration — it eliminates the stop-and-ask boundary where agents historically stall.

**Key distinction from SAFe I&A:** SAFe I&A is once per PI (every 8–12 weeks). ADAPT I&A runs every Iteration (every 30 minutes to 4 hours). SAFe I&A is a facilitated workshop. ADAPT I&A reads code, verifies gaps, and produces permanent artifacts.

**Devmeta origin:** Reflection (renamed to map to SAFe terminology while preserving the 12-step operational depth)

---

## Supporting Concepts

### Delivery Engine

The autonomous execution loop (`/adapt:go`). Assess state → plan → execute → reflect → next. Zero decision points. `tk next` drives every transition. Replaces SAFe's 7+ recurring ceremonies with one continuous flow.

**Devmeta origin:** `/devmeta:go` autonomous loop

### Execution Waves

Dependency-ordered groups of Features executing in parallel on isolated git worktrees. Computed automatically from the Feature dependency graph during Iteration planning. Replaces the weekly ART Sync meeting.

**Devmeta origin:** Waves

### Agent Backlog

Git-tracked JSON issue structure (`.tick/issues/`). Two types: Feature (container) and Task (work item). `tk next` provides algorithmic prioritization in 35ms — eliminates all decision points. Offline-first, travels with the code.

**Devmeta origin:** Ticks (tk) — tool name preserved, concept renamed for enterprise audiences

### Shared Context Log

Per-Feature markdown files that serve as the inter-agent communication channel. Since Feature workers run in separate sessions and cannot communicate directly, the Shared Context Log is how Feature B learns what Feature A discovered. Created during planning, written to by each worker, read by subsequent workers.

**Devmeta origin:** Implementation Notes — renamed to describe purpose (inter-agent communication) rather than format

### 7 Knowledge Stores

Persistent artifacts that accumulate across Iterations, making N+1 always smarter than N:

1. **Lessons Learned** — reusable patterns for future agents
2. **Decision Log** — why decisions were made
3. **Implementation Log** — file-by-file change record
4. **Increment Overview** — frozen scope contract
5. **I&A Records** — verification + gap analysis history
6. **Shared Context Log** — inter-agent communication
7. **Tick Notes** — per-item observations and escalations

---

## Evidence Base

| Metric | Source | Detail |
|--------|--------|--------|
| 20x | Devin (Cognition Labs, 2025) | Security fixes: 1.5 min vs 30 min human. Migrations: 3–4 hrs vs 30–40 hrs |
| 11.6x | METR transcript analysis (Feb 2026) | Power user with concurrent agents. Flagged as soft upper bound |
| 67% | Devin PR merge rate | Up from 34%. Majority of autonomous work production-ready |
| 77% | SWE-bench Verified (Sonnet 4.5) | Real GitHub issues. Up from 2% in 2024 |
| 11% | FeatureBench | Complex multi-file features. Current frontier — gap ADAPT's architecture addresses |

**Timescale claims:** 10–20x proven on well-scoped tasks. 100x+ wall-clock compression when ceremony latency is eliminated. This is elapsed time compression, not effort reduction.

**Autonomy claims:** Zero coordination ceremonies. Human-on-the-loop for exception handling. The build itself executes autonomously; human judgment at scope definition and acceptance.

---

## Brand Architecture

| Layer | Name | What it is |
|-------|------|-----------|
| Methodology | **ADAPT** | Agentic Development with Artifact Persistence & Testing |
| Execution Framework | **The Harness** | The runtime that implements ADAPT |
| Workshop | **The Spark** | 2-day hands-on course teaching ADAPT |
| Company | **The Agentic Agency** | Engineering > Prompting |
