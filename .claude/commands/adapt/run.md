<!-- 
TERMINOLOGY CORRECTIONS APPLIED:
- "epic" (work unit) → "Feature"
- "Epic A/B/C/D" → "Feature A/B/C/D"
- "Cross-epic" → "Cross-Feature"
- "inter-epic" → "inter-Feature"
- "epic branch" → "feature branch"
- "/devmeta-run" → "/adapt-run"
- "/devmeta-reflect" → "/adapt-reflect"
- "implementation-notes.md" → "shared-context-log.md"
- tk internal "epic" type preserved; descriptions updated
- All structural content, formatting, logic unchanged
-->

---
description: Execute Features — one subagent per Feature, sequential tasks within, parallel across independent Features
argument-hint: [Feature-id(s) or --all]
---

## Project Context

Read `devmeta.md` from the project root if it exists. It provides
project-specific test commands, environment checks, and additional rules.

If no `devmeta.md` exists:
- Testing: look for `package.json` test scripts
- Environment: skip checks
- Additional rules: none

---

## Design

**The Feature is the unit of context.** One subagent per Feature. Sequential tasks within. Parallel across independent Features. `shared-context-log.md` for inter-Feature communication. You (the orchestrator) are a thin scheduler.

## Context

- Today's date: !`date +%Y-%m-%d`
- Target: $ARGUMENTS
- Open Features: !`tk list --type epic --status open 2>/dev/null | head -20 || echo "No open Features"`

## Your Task

You are a thin orchestrator. Compute Feature dependency order, spawn one worker per Feature, track progress. You do NOT implement anything yourself.

### Phase 1: Identify Scope

**If `$ARGUMENTS` contains Feature ID(s):** Run those Features only.
**If `$ARGUMENTS` is `--all` or empty:** Run all open Features.

### Phase 2: Compute Feature Dependency Graph

```bash
tk list --type epic --status open --json
```

For each Feature, check tasks for cross-Feature `blocked_by`:
```bash
tk list --parent <Feature-id> --json
```

Build Feature-level dependency graph. Compute waves:
```
Wave 1 = Features with no open Feature-level blockers
Wave 2 = Features whose blocker-Features are all in Wave 1
...
```

### Phase 3: Locate Implementation Notes

Find the `shared-context-log.md` path from the Feature descriptions. Read it — you'll include its contents in worker prompts.

### Phase 4: Present Execution Plan

```markdown
## Execution Plan

| Wave | Features (parallel) | Depends On |
|------|-------------------|-----------|
| 1 | Feature A (foundation) | — |
| 2 | Feature B, Feature C | Wave 1 |
| 3 | Feature D (validation) | Wave 2 |

Proceeding with execution...
```

### Phase 5: Execute Waves

```
FOR each wave:
  1. Gather all Features in this wave
  2. For each Feature:
     a. Gather ordered tasks: tk list --parent <Feature-id> --json
     b. Create feature branch: git checkout -b feature/YYYY-MM-DD-<feature-name> main
     c. Push branch: git push -u origin feature/YYYY-MM-DD-<feature-name>
  3. Spawn one subagent per Feature — ALL in a SINGLE message (parallel)
     Include feature branch name in worker prompt
  4. Wait for all subagents to complete
  5. Collect results, update status
  6. Report wave results
  7. Proceed to next wave
```

**CRITICAL: Launch all Feature workers in a wave in a SINGLE message with multiple Task tool calls.**

### Phase 6: Worker Prompt Template

Spawn with `subagent_type: "tk-worker"` (fallback: `"general-purpose"`).

```
## Your Assignment

**Feature:** [<Feature-id>] <Feature-title>
**Branch:** feature/YYYY-MM-DD-<feature-name> (already created — checkout and work here)

### Feature Description

<full description from tk show>

### Tasks (complete in order)

1. [<task-1-id>] <title>
   Acceptance: <criteria>
2. [<task-2-id>] <title>
   Acceptance: <criteria>
...

### Task Details

<Full description for each task from tk show>

### Implementation Notes

<Contents of shared-context-log.md>

### Feature Notes (from previous runs)

<Output of tk notes <Feature-id>>

## Instructions

1. Read CLAUDE.md for project orientation
2. Read docs/current/principles-and-choices.md for architectural decisions
3. Read docs/devmeta/lessons-learned.md — don't repeat known mistakes
4. Read shared-context-log.md for context from previous Features
5. If devmeta.md exists at project root, read it for test commands and additional rules
6. Work through tasks IN ORDER — they build on each other
7. For each task:
   a. tk update <task-id> --status in_progress
   b. Read the spec section referenced
   c. Implement the changes
   d. Write tests alongside implementation
   e. Run acceptance criteria. Fix and re-run until green
   f. Commit: `git commit -m "[TASK-ID] <what was done>"`
   g. tk close <task-id> --reason "<summary>"
8. After ALL tasks done:
   a. Append learnings to shared-context-log.md
   b. tk note <Feature-id> "FEATURE COMPLETE: <summary>"
   c. Create PR: `gh pr create --title "<Feature title>" --body "<summary>"`
9. If a task cannot be completed:
   a. tk update <task-id> --awaiting escalation
   b. tk note <task-id> "<what's blocking and what was tried>"
   c. Continue to next task if possible

## Rules

- Complete tasks in order
- Be autonomous — don't ask questions
- NEVER close a task with failing tests. If tests fail: debug, fix, re-run. Loop until green. There is no "close with known failures"
- Tests are YOUR responsibility. Write them, run them, fix them. Never defer testing to a later task or iteration
- Use surgical test commands (not full suite)
- After completing all tasks, run the iteration's "Verify on screen" commands from the epoch overview. If output doesn't match, keep working — the iteration is not done
- Leave useful notes in shared-context-log.md
- When you solve a problem, also write it to docs/devmeta/lessons-learned.md
- Use tk commands, never edit .tick/issues/ directly
- Work on the feature branch. Commit after each task with `[TASK-ID] <summary>`. Create PR when all tasks done
- NEVER reduce scope. If something is hard, work harder. If something is blocked, unblock it. Only the human can cut features

```

### Phase 7: Handling Results

**All tasks closed:** `tk close <Feature-id> --reason "All tasks completed"`

**Some tasks open:**
- Check awaiting: `tk list --parent <Feature-id> --awaiting --json`
- Check notes: `tk notes <task-id>`
- Reset stale in_progress: `tk update <task-id> --status open`

### Phase 8: Wave Reporting

```markdown
## Wave <N> Complete

| Feature | Title | Tasks Done | Status |
|------|-------|-----------|--------|
| <id> | <title> | X/Y | Complete / Partial / Blocked |

### Next Wave
| Feature | Title | Tasks |
|------|-------|-------|
| <id> | <title> | N tasks |
```

### Phase 9: Final Summary

```markdown
## Execution Complete

| Feature | Title | Status | Tasks |
|------|-------|--------|-------|
| <id> | <title> | Complete / Partial | X/Y |

### Totals
- Features: X complete, Y partial
- Tasks: X complete, Y blocked
- Waves: N

### Needs Attention (if any)
| Feature | Task | Issue |
|------|------|-------|

### Next Steps
- Address blocked tasks and run `/adapt-run` again
- Or: run `/adapt-reflect` if iteration is complete
```

## Error Handling

- **Worker fails to spawn:** Log error, reset tasks, continue with remaining Features
- **All Features blocked:** Report what needs attention, stop execution
- **Partial completion:** Completed tasks stay closed. Reset incomplete to open. Next run resumes.
