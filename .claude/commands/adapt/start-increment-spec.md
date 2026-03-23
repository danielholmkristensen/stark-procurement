<!-- ADAPT-harmonized version: terminology corrected for ADAPT methodology -->

---
description: Start a new Increment — create directory, overview from template, interactive scope definition
argument-hint: [Increment-title]
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
- Increment title argument: $ARGUMENTS

## Your Task

Create a new Increment directory with a properly structured `_overview.md` and begin defining scope interactively.

### Step 1: Determine Increment Number

Read `docs/increments/current.md` to find the current Increment. The new Increment is current + 1.

Check if `docs/increments/Increment-<NN>/` already exists. If it does and has content, confirm with the user before overwriting.

### Step 2: Create Increment Directory

```bash
mkdir -p docs/increments/Increment-<NN>/iterations
```

### Step 3: Create `_overview.md` from Template

Write `docs/increments/Increment-<NN>/_overview.md` using this template:

```markdown
# Increment <NN> — <Title>

**Status:** NOT STARTED
**Depends on:** Increment <NN-1> (<previous Increment title>)
**Goal:** <1-2 sentence goal — what the user can do after this Increment that they couldn't before>

---

## What This Increment Produces

### On screen
- <User-visible feature 1>
- <User-visible feature 2>

### Under the hood
- <Technical deliverable 1>
- <Technical deliverable 2>

### Testing delivered
- <Test coverage expectations>

---

## What This Increment Does NOT Include

| Deferred | Why | Which Increment |
|----------|-----|-------------|
| <Feature> | <Reason> | <Future Increment> |

---

## Iteration Map

| # | Title | What Gets Built |
|:--:|-------|-----------------|
| <NN>.1 | <title> | <deliverables> |
| <NN>.2 | <title> | <deliverables> |

---

## Detailed Iterations

### Iteration <NN>.1 — <Title>

**Deliverables:**
- <deliverable 1>
- <deliverable 2>

**Verify on screen:**
- <acceptance criteria>

### Iteration <NN>.2 — <Title>

**Deliverables:**
- <deliverable 1>

**Verify on screen:**
- <acceptance criteria>

---

## Exit Criteria

- [ ] <Criterion 1>
- [ ] <Criterion 2>
- [ ] All tests pass
- [ ] Living docs updated

---

## Blocked Items

- <Item>: <What's needed and when>

---

## Previous Increments

<List of completed Increments with links to their _overview.md>
```

If `$ARGUMENTS` provides an Increment title, use it. Otherwise, leave `<Title>` as a placeholder for the interactive dialogue to fill in.

### Step 4: Update `docs/increments/current.md`

Update `docs/increments/current.md` to point to the new Increment:
- Set the new Increment as active with status NOT STARTED
- Keep the previous Increment reference with its final status

### Step 5: Interactive Scope Definition

Begin an interactive dialogue to flesh out the overview. Ask about:

1. **Goal:** What should the user be able to do after this Increment?
2. **On-screen deliverables:** What will visually change?
3. **Under-the-hood deliverables:** What technical work is needed?
4. **Exclusions:** What is explicitly out of scope?
5. **Iterations:** How should the work be split? (Aim for 2-5 iterations, each 1-3 days of agent work)
6. **Dependencies:** What must exist before this Increment can start?
7. **Blocked items:** Anything that needs human action (API keys, accounts, etc.)?
8. **Exit criteria:** How do we know the Increment is done?

Update the `_overview.md` with each answer.

### Step 6: Finalize

1. Review the completed `_overview.md` with the user
2. Ensure all template sections are filled in
3. Verify iteration map is reasonable (not too many iterations, not too few)
4. Confirm exit criteria are testable

Report:
```markdown
## Increment <NN> Created

**Directory:** `docs/increments/Increment-<NN>/`
**Overview:** `docs/increments/Increment-<NN>/_overview.md`
**Iterations:** <N> planned
**Status:** Ready for `/adapt-plan-iteration <NN>.1`
```