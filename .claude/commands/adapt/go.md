<!-- ADAPT-harmonized version: terminology updated for ADAPT framework alignment -->

---
description: Autonomous project driver — starts or continues the project to completion
---

## Project Context

Read `devmeta.md` from the project root if it exists. It provides
project-specific test commands, environment checks, and additional rules.

If no `devmeta.md` exists:
- Testing: look for `package.json` test scripts
- Environment: skip checks
- Additional rules: none

---

## Purpose

This is the single command that drives the entire project. Run it to start. Run it again to continue. It figures out where the project is and does the next thing, autonomously, until it hits a genuine external blocker or closes all gaps.

**Current Increment:** Defined in `docs/epochs/current.md`. Follow the pointer to the active Increment's `_overview.md` for scope, iterations, and gap analysis.

**You are the project driver.** You don't ask the user what to do — you assess the state and act. The only time you stop and ask is when you need something that requires human action on their physical machine (installing software, creating accounts, providing API keys).

## Phase 0: Assess State

**Ticks are the single source of truth for project state.** Run these commands:

```bash
tk list --all --status all    # Full project state — iterations, Features, tasks
tk next                       # What should I do right now?
tk next <iteration-id>        # What's next within the current iteration?
```

Then read context files as needed:
1. `CLAUDE.md` (already loaded)
2. `docs/epochs/current.md` — which Increment is active
3. Current Increment's `_overview.md` — scope, iterations, gap analysis
4. Current iteration's `status.md` in the Increment's `iterations/` directory

**The rule: if `tk next` returns a task, do that task.** Don't interpret markdown files to figure out what to do — the tick structure already encodes the answer.

## Iteration Rhythm: Execute → Inspect & Adapt

Every execution iteration is followed by a dedicated I&A Cycle iteration. This is structural — not optional, not a task that can be forgotten.

```
Iteration N: Execute (code, tests, commits, PR)
    → closes with "Kick off I&A Cycle NR" task
Iteration NR: Inspect & Adapt (code review, docs audit, plan reassessment, context handoff)
    → last task IS the first concrete task of next iteration (e.g., "Plan Iteration N+1")
Iteration N+1: Execute
    → ...
```

Both execution and I&A Cycle iterations are top-level ticks with their own children. Continuity is ensured by making the last I&A Cycle task be **real work for the next iteration**, not a meta "Continue to" task. This eliminates the boundary where the agent historically stops.

### Execution Iteration Structure

```
Iteration N (Feature, top-level)
├── Feature A: <name> (Feature, parent: iteration)
│   ├── Task 1: <implementation work> (task)
│   ├── Task 2: <implementation work> (task)
│   └── Re-ground after Feature A (task)  ← ALWAYS LAST IN EVERY FEATURE
├── Feature B: <name> (Feature, parent: iteration)
│   └── ...
├── Create PR for iteration N (task, parent: iteration)
├── Merge PR and return to base branch (task, parent: iteration)  ← MERGE BEFORE I&A CYCLE
└── Kick off I&A Cycle NR (task, parent: iteration)  ← ALWAYS LAST
```

### Inspect & Adapt Cycle Iteration Structure

```
Iteration NR: Inspect & Adapt (Feature, top-level, blocked by iteration N, runs on base branch after merge)
├── Run /adapt:reflect N (task)  ← invokes the full 12-step I&A Cycle process
└── Plan Iteration N+1 (task)  ← REAL WORK, not a boundary
```

The I&A Cycle task invokes `/adapt:reflect N` as a skill. Do NOT break it into separate tasks -- the skill handles the full sequence internally (code review, docs audit, gap verification, diary update, plan reassessment, and more).

### Re-grounding Task (after every Feature)

When you reach a "Re-ground after Feature X" task, do ALL of these before closing it:
1. Update `docs/devmeta/shared-context-log.md` with entry for what you just built
2. Update `docs/devmeta/diary.md` if this moment deserves an entry
3. Update iteration `status.md` with Feature completion
4. Capture any lessons in `docs/devmeta/lessons-learned.md`
5. Run `tk list --parent <iteration-id>` to see where you are in the iteration

### Last I&A Cycle Task = First Task of Next Iteration

The last task in every I&A Cycle iteration is **concrete work for the next iteration** — typically "Plan Iteration N+1: read scope from _overview.md, create Feature tick structure, begin first task." This is NOT a meta/handoff task. It's real work.

When you reach the last I&A Cycle task:
1. Do the work described in the task (read scope, create Features, create tick structure)
2. Close the task and the I&A Cycle iteration
3. Run `tk next` and start executing the first task of the new iteration

## Phase 1: Environment Check (iteration 1 only, or when needed)

Before doing any work, verify the development environment. **Test, don't ask.**

Run the environment checks from `devmeta.md > Environment` if it exists.
If no `devmeta.md`, skip environment checks.

## Phase 2: Execute Based on State

### If `tk next` returns a task: DO IT

Read the task description with `tk show <id>`, do the work, close the task with `tk close <id>`, then run `tk next` again.

### If `tk next` returns an execution iteration (no children): PLAN IT

1. Run `/adapt-plan-iteration N`
2. Planning MUST create the tick structure:
   - Feature ticks for each Feature (parent: iteration)
   - Task ticks for each task within Features (parent: Feature)
   - **A "Re-ground after Feature X" task as the last task in every Feature**
   - **A "Create PR for iteration N" task (parent: iteration)**
   - **A "Merge PR and return to base branch" task (parent: iteration)**
   - **A "Kick off I&A Cycle NR" task as the last task (parent: iteration)**
3. Also create the I&A Cycle iteration tick:
   - `Iteration NR: Inspect & Adapt on Iteration N` (Feature, blocked by iteration N)
   - 2 tasks: "Run /adapt:reflect N" and "Plan Iteration N+1: read scope, create Feature tick structure, begin first task"
   - The first task invokes the full I&A Cycle skill; the second is concrete work, not a handoff
4. Set dependencies between Features (waves: parallel where independent, sequential where dependent)
5. Then immediately start executing (`tk next` → do the first task)

### If `tk next` returns an I&A Cycle iteration (no children): CREATE ITS TASKS

Create 2 tasks: "Run /adapt:reflect N" and "Plan Iteration N+1: read scope, create Feature tick structure, begin first task". Then `tk next` to start.

### If `tk next` returns nothing: CHECK STATE

- If all current Increment iterations are closed → Increment is complete
- If blocked iterations exist → close the blocking iteration first
- If something is stuck → investigate and unblock
- Verify against the current Increment's scope — are all items actually closed?

### If NO TICKS EXIST: BOOTSTRAP

Read `docs/epochs/current.md` to find the active Increment, then read its `_overview.md` and create the iteration ticks. Each iteration is a top-level Feature tick. The `/adapt-plan-iteration N` command creates the Features and tasks within each iteration when it's time to execute.

## Critical Rules

**Never ask permission to proceed.** Plan → execute → inspect & adapt → next iteration. That's the loop. `tk next` drives it.

**Never ask "should I continue?" or "want me to proceed?"** The tick structure tells you what to do. Do it.

**Never stop to present a summary or status update.** Completing an iteration, a PR merge, or an I&A Cycle is NOT a stopping point. It's a waypoint. Do NOT write "here's where we are" messages. Do NOT present a list of what was accomplished. `tk next` tells you what to do next — do it immediately. The agent stays in "doing work" mode at all times. Completing a large body of work triggers the instinct to summarize and defer to the user — resist this. The tick structure eliminates the decision point.

**Test before asking.** If you think something might not work, try it first.

**Tests are autonomous and must pass before moving on.** After every task, run the relevant tests (from `devmeta.md > Testing` or `package.json`). If they fail, fix the code and re-run. This is a loop — implement → test → fail → debug → fix → test → repeat until green. An iteration CANNOT close with failing tests. A task CANNOT close with failing tests. There is no "known failure" state. If a test requires infrastructure, set it up or ask the human for the specific missing resource — do NOT skip the test. Each iteration's "Verify on screen" section is the acceptance test — actually run those commands and verify the output.

**Scope cannot shrink.** You may split, merge, reorder, or inject iterations. You may NOT remove scope items. If something is hard, work harder or ask for help. If something takes longer than expected, it takes longer. Only the human can cut scope. Scope can grow (bugs, discovered gaps) but never shrink.

**Work continues until it succeeds.** A failing test is not a stopping point — it is a problem to solve. A blocked task is not a reason to skip — it is a problem to unblock. The only reasons to stop: missing API keys, missing hardware, or genuinely ambiguous spec. "I couldn't figure it out" is never valid — try a different approach.

**Commit and push regularly.** Commit per task, PR per iteration. After CI passes on the PR, merge it into the base branch (the branch you were on when `/adapt:go` was invoked — detect it at session start with `git branch --show-current` and remember it). The I&A Cycle iteration runs on the base branch. **Do NOT assume the base branch is `main`** — the user may be working on a feature branch.

**Run tests constantly.** After every meaningful code change, run the relevant tests. Tests are the heartbeat. If you haven't run tests in the last 3 tasks, something is wrong.
