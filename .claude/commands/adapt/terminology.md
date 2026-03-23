# ADAPT Terminology — Canonical Reference

## Hierarchy Levels

| Level | ADAPT Term | Duration | Contains | SAFe Analog | Key Distinction |
|-------|-----------|----------|----------|-------------|----------------|
| 1 | **Increment** | 30min–15hr | 2–6 Iterations | Program Increment | Scope-boxed (not time-boxed), on-demand (not cadenced) |
| 2 | **Iteration** | 30min–4hr | 2–4 Features | Sprint | Planning is automated graph-partitioning, not a human ceremony |
| 3 | **Feature** | 15min–2hr | 3–6 Tasks | Feature (team level) | Unit of agent context isolation, zero cross-Feature file overlap |
| 4 | **Task** | 5–30min | Atomic | Task | Structural test-gate — cannot close with failing tests |
| X | **I&A Cycle** | 10–30min | Cross-cutting | Inspect & Adapt | 12-step automated process every Iteration (not once per PI) |

## Supporting Concepts

| ADAPT Term | Definition | SAFe Analog |
|-----------|-----------|-------------|
| **Delivery Engine** | The autonomous execution loop: assess → plan → execute → reflect → next. Zero decision points. | No equivalent (SAFe is ceremony-driven) |
| **Execution Wave** | Dependency-ordered groups of Features executing in parallel on isolated git worktrees | ART Sync |
| **Agent Backlog** | Git-tracked JSON issue structure. `tk next` provides algorithmic prioritization in 35ms | Team Backlog (human-prioritized) |
| **Shared Context Log** | Per-Feature markdown files enabling inter-agent communication across context boundaries | Shared Slack / war room |
| **Knowledge Stores** | 7 persistent artifact types that accumulate across Iterations: Lessons Learned, Decision Log, Implementation Log, Increment Overview, I&A Records, Shared Context Log, Tick Notes | People's heads + meeting notes |

## Forbidden Terms

| Do NOT use | Use instead | Reason |
|-----------|-------------|--------|
| Epic (as work unit) | **Feature** | SAFe Epic = portfolio-level (largest). Devmeta Epic = worker assignment (smallest). Hierarchy inversion confuses enterprise audiences |
| Epoch | **Increment** | "Epoch" is not recognized in agile frameworks. "Increment" maps to SAFe without the ceremony baggage |
| Sprint | **Iteration** | Already the ADAPT term. "Sprint" implies 2-week time-box |
| Ceremony | (describe the artifact instead) | ADAPT has zero ceremonies. Always frame the replacement artifact |
| 100–1000x | "10–20x proven; 100x+ wall-clock" | Evidence-backed framing per METR/Devin research |

## The Fundamental Insight

SAFe coordinates **humans** through **ceremonies** (synchronous, facilitated, scheduled).
ADAPT coordinates **agents** through **artifacts** (asynchronous, machine-readable, persistent).

Timescale compression (10–100x+) is a **consequence** of this shift, not the cause.
The cause is the elimination of coordination cost.
