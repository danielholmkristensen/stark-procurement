<!-- Corrected terminology: epic→Feature, epoch→Increment, Reflection→I&A Cycle, /devmeta→/adapt, implementation-notes→shared-context-log -->
---
description: I&A Cycle phase — review Increment learnings, update permanent docs, prepare for next Increment
argument-hint: [increment-number]
---

## Project Context

Read `devmeta.md` from the project root if it exists. It provides
project-specific test commands, environment checks, and additional rules.

If no `devmeta.md` exists:
- Testing: look for `package.json` test scripts
- Environment: skip checks
- Additional rules: none

---

## Context

- Today's date: !`date +%Y-%m-%d`
- Target Increment: $ARGUMENTS
- Completed Features: !`tk list --type epic --status closed 2>/dev/null | head -20 || echo "None"`

## Purpose

The project is a self-learning system. This command runs at Increment boundaries to ensure everything learned during execution gets promoted to the right permanent documentation. Increment N+1 should be easier than Increment N because the project has accumulated knowledge about itself.

## Your Task

### Step 1: Gather All Learnings

Read every source of learnings from this Increment:

1. **Shared Context Logs** from all Features in this Increment:
   Read each `shared-context-log.md` thoroughly.

2. **Feature notes** (tk note entries):
   ```bash
   tk list --type epic --status closed --json
   # For each: tk notes <epic-id>
   ```

3. **Task notes** (especially for tasks that were blocked or difficult):
   ```bash
   # For each epic: tk list --parent <epic-id> --json
   # For tasks with notes: tk notes <task-id>
   ```

4. **Current lessons-learned.md**:
   Read `docs/devmeta/lessons-learned.md`

5. **Current troubleshooting.md** (if exists):
   Read `docs/current/troubleshooting.md`

### Step 2: Categorize Learnings

Sort every learning into one of these categories:

| Category | Goes to | Criteria |
|----------|---------|----------|
| **How agents should write code** | CLAUDE.md (Critical Rules section) | Would prevent a mistake if seen at session start |
| **How the codebase works** | docs/current/ (appropriate file) | Permanent architectural knowledge |
| **Wrong or updated decision** | docs/current/principles-and-choices.md | A principle was proven wrong or needs nuance |
| **Recurring build/test issue** | docs/current/troubleshooting.md | Same problem hit by multiple Features or Increments |
| **One-off solution** | docs/devmeta/lessons-learned.md | Useful but not worth promoting higher |
| **Outdated or wrong doc** | Fix or delete the doc | Doc contradicts what we learned |

### Step 3: Code Quality Review (CRITICAL)

This is the most important step. Read the actual code that was written during this Increment and look for drift:

1. **Review new and modified files** from this Increment:
   ```bash
   git log --name-only --since="<increment-start-date>" --pretty=format: | sort -u
   ```

2. **For each significant file**, ask:
   - Would an experienced developer recognize this as standard, idiomatic code?
   - Does it follow the patterns in `docs/current/principles-and-choices.md`?
   - Is there unnecessary complexity that suggests an agent struggled and patched rather than solving properly?

3. **Signs of drift to look for:**
   - Deeply nested try/catch or error suppression
   - Monkey-patching or runtime modification of behavior
   - Copy-pasted code blocks with slight variations
   - Config flags that exist only to work around bugs
   - `// TODO`, `// HACK`, `// FIXME`, `// workaround` comments
   - Wrapper functions that exist only to work around another layer
   - Unusual patterns that don't match the rest of the codebase
   - Excessive defensive coding (null checks everywhere, redundant validation)
   - Dependencies added to solve a problem that shouldn't require a dependency
   - Test files that skip tests or have overly broad assertions

4. **For each piece of drift found**, determine:
   - **Is it harmful?** Does it create maintenance burden or fragility?
   - **What's the proper solution?**
   - **Is it worth fixing now?** (Almost always yes — agentic development makes rebuilding cheap)

5. **Create cleanup tasks** for the next Increment:
   ```bash
   tk create "Refactor: <describe what needs fixing>" -d "## Problem
   <What was built and why it's not right>

   ## Proper Solution
   <What it should look like instead>

   ## Files
   <Which files to change>"
   ```

### Step 4: Verify Gaps Closed — Outside-In (CRITICAL)

This step checks whether what was built actually closes the gaps it claimed to close.

**Inside-out** (Steps 1-3): "Is the code we wrote good?" Catches quality issues.
**Outside-in** (this step): "Does the code do what the scope says it should?" Catches completeness issues.

1. **Read the Increment's scope.** Check the current Increment's `_overview.md` or the Increment tick description.

2. **For each scope item**, read the actual code files that implement it:
   - Don't trust that a tick was closed — read the code
   - Verify the behavior described in the scope is actually implemented
   - Check both the happy path and edge cases

3. **Run the "Verify on screen" commands from the Increment's scope.** Actually execute them. Check the output matches what was specified. This is not optional — it is the acceptance test.

4. **Classify each gap as:**
   - **Closed**: Code exists, works correctly, tested, verified on screen
   - **Partially closed**: Code exists but doesn't fully address the scope
   - **Not closed**: Tick was closed but gap persists in the code

5. **For any gap NOT fully closed — FIX IT NOW.** Do not create follow-up tasks for the next Increment. Do not defer. Do not reduce scope. The Increment is not complete until all scope items are verified. If fixing requires significant work, do the work. The Increment takes as long as it takes.

6. **Only after ALL scope items are verified closed**, record results in the reflection report (Step 12).

**The rule: don't trust tick status. Trust code. Trust the screen.**

**Scope is immutable.** If outside-in verification finds that a scope item was not delivered, you do NOT have the option of moving it to a future Increment or labeling it "post-MVP." You fix it. The only person who can reduce scope is the human.

### Step 5: Check for Pattern Problems

Look for patterns across the Increment:

- **Same mistake in multiple Features?** → Systemic issue. Needs a code-level fix or a CLAUDE.md warning.
- **Same test failure pattern?** → Testing infrastructure issue. Update troubleshooting.md.
- **Workers consistently confused about X?** → Documentation gap. Fill it in docs/current/.
- **A principle was violated repeatedly?** → Either the principle is wrong or it's not visible enough.
- **Workarounds accumulated?** → Code quality drift. Create cleanup tasks.

### Step 6: Living Documentation Audit (docs/current/)

Before applying individual updates, step back and assess `docs/current/` as a whole.

1. **Read `docs/current/_overview.md`** — does it accurately list what's here?
2. **For each file in `docs/current/`**, ask:
   - **Is it still accurate?** Does it reflect what was actually built?
   - **Is it complete enough?** Are there topics that should be covered but aren't?
   - **Is it too verbose?** Cut anything that doesn't help the next agent.
3. **Organization check:**
   - Should any file be split or merged?
   - Are there files that should exist but don't?
   - Is `_overview.md` still the right routing guide?
4. **Gap analysis:** Would a fresh agent starting a new session understand the codebase from docs alone?
5. **Fix what you find.** Don't just list gaps — fill them.

### Step 7: Apply Updates

For each learning that needs promotion:

1. Read the target file
2. Add the learning in the appropriate section
3. Keep it concise — agents need signal, not prose

**For CLAUDE.md:** Only add critical rules that prevent real mistakes. Keep it under 200 lines total.

**For principles-and-choices.md:** Update with "Updated YYYY-MM-DD: <what changed and why>".

**For `docs/devmeta/lessons-learned.md`:** Add under the appropriate category header.

**For troubleshooting.md:** Format as Problem → Cause → Fix.

### Step 8: Update Increment Status

Update the current Increment's `iterations/iteration-<N>/status.md`:

```markdown
**Completed:** YYYY-MM-DD
**Status:** Complete

## Summary
<2-3 sentences on what was delivered>

## Key Learnings
- <Learning 1>
- <Learning 2>

## Changes to Project Docs
- Updated CLAUDE.md: <what>
- Updated principles-and-choices.md: <what>
- Added to lessons-learned.md: <what>
```

### Step 9: Tag and Prune

**Tag the Increment in Git:**
```bash
git tag iteration-<N> -m "Iteration <N> complete: <summary>"
```

**Prune completed ticks:**
```bash
tk list --type epic --status closed --json
tk delete <epic-id>
```

Verify cleanup:
```bash
tk list  # Should show only open/in-progress items
```

### Step 10: Update Development Diary

Append an entry to `docs/devmeta/diary.md` covering this Increment:

- What was built and how long it took
- Where the agent struggled or needed human help
- Where the agent exceeded expectations
- What the meta-framework got right and wrong
- Surprising discoveries or failures
- How the self-learning system performed

Write in narrative form, not bullet points.

### Step 11: Reassess and Restructure the Increment Plan

1. Read the current Increment's `_overview.md`.
2. For each remaining Increment, ask:
   - **Is the scope still right?**
   - **Is the order still right?**
   - **Is a new Increment needed?**
   - **Should Increments be split or merged?**
3. **If changes are needed, make them directly** in `_overview.md`. Note the rationale inline.
4. **Update the tick structure to match.**
5. Record significant plan changes in `docs/devmeta/diary.md`.

### Step 12: Report

```markdown
## I&A Cycle Complete — Increment <N>

### Learnings Captured
- X learnings from Shared Context Logs
- Y learnings from Feature/task notes

### Code Quality Review
- Files reviewed: <N>
- Drift instances found: <N>
- Cleanup tasks created: <list>
- Overall assessment: <clean / minor drift / significant drift>

### Gaps Verified (Outside-In)
| Gap | Claimed | Verified | Notes |
|-----|---------|----------|-------|
| <N.N> | Closed | Closed / Partially / Not closed | <what was found> |

Follow-up tasks created: <list or "none">

### Docs Updated
| File | Changes |
|------|---------|
| CLAUDE.md | Added: <what> |
| principles-and-choices.md | Updated: <what> |
| lessons-learned.md | Added: <N> entries |
| troubleshooting.md | Added: <N> entries |

### Pattern Problems Found
- <Pattern 1>: <Resolution>

### Git & Housekeeping
- Tagged: `iteration-<N>`
- Ticks pruned: <N> Features, <N> tasks deleted
- Remaining open items: <N>

### Increment Plan Reassessment
- Remaining Increments reviewed: <N>
- Changes made: <none / split / merged / reordered / injected>
- Rationale: <why>

### Next Increment Readiness
- Increment <N+1>: <title>
- Scope adjustments: <none / what changed>
- Cleanup tasks carried forward: <N>
- Ready to continue with `/adapt-go`
```

**Write the report to `docs/devmeta/reflections/iteration-<N>.md`** so it persists as a permanent record.

### Step 13: Emit I&A Cycle Completion to Command Center

```bash
GATEWAY_URL="${KAFKA_GATEWAY_URL:-http://localhost:8083}"
SESSION_ID="${ADAPT_SESSION_ID:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo adapt-reflect-$$)}"

curl -s -X POST "$GATEWAY_URL/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "agents.status",
    "source": "adapt-agent",
    "schemaVersion": 1,
    "payload": {
      "sessionId": "'"$SESSION_ID"'",
      "status": "completed",
      "currentTool": "adapt:reflect"
    }
  }'
```

This event signals to the Command Center that the I&A Cycle is done. The Delivery portal and Ops console will reflect the iteration completion.