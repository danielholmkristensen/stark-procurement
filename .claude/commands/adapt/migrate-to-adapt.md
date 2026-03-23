---
description: Migrate a project from devmeta to ADAPT — moves all artifacts to .adapt/ directory structure
---

## Purpose

Migrates an existing devmeta project to the ADAPT framework. Moves all
devmeta artifacts into `.adapt/` so they don't clutter the project root,
and updates internal references to use ADAPT terminology.

## Prerequisites

- Project currently uses devmeta (`devmeta.md` at root, `docs/devmeta/` directory)
- ADAPT commands already installed in `.claude/commands/adapt/`

## Migration Steps

### Step 1: Verify Current State

```bash
test -f devmeta.md && echo "devmeta.md found" || echo "No devmeta.md — nothing to migrate"
test -d docs/devmeta && echo "docs/devmeta/ found" || echo "No docs/devmeta/"
test -d .adapt && echo ".adapt/ already exists — check before overwriting" || echo ".adapt/ clear"
```

If no `devmeta.md` exists, stop — nothing to migrate.
If `.adapt/` already exists, confirm with user before proceeding.

### Step 2: Create .adapt Directory Structure

```bash
mkdir -p .adapt
```

### Step 3: Move devmeta.md → .adapt/adapt.md

```bash
cp devmeta.md .adapt/adapt.md
```

Update the content of `.adapt/adapt.md`:
- Replace header "Development Metadata" → "ADAPT Project Configuration"
- Keep all test commands, environment checks, and additional rules intact
- These are project-specific and must be preserved exactly

### Step 4: Move docs/devmeta/ → .adapt/

```bash
cp -r docs/devmeta/* .adapt/
```

This moves:
- `shared-context-log.md`
- `decision-log.md`
- `implementation-log.md`
- `diary.md`
- `lessons-learned.md`
- `ia-records.md`
- `reflections/` (if exists)
- Any other devmeta artifacts

### Step 5: Update References in Commands

The ADAPT commands reference `devmeta.md` and `docs/devmeta/`. Update
all `.claude/commands/adapt/*.md` files:

- `devmeta.md` → `.adapt/adapt.md`
- `docs/devmeta/shared-context-log.md` → `.adapt/shared-context-log.md`
- `docs/devmeta/decision-log.md` → `.adapt/decision-log.md`
- `docs/devmeta/implementation-log.md` → `.adapt/implementation-log.md`
- `docs/devmeta/diary.md` → `.adapt/diary.md`
- `docs/devmeta/lessons-learned.md` → `.adapt/lessons-learned.md`
- `docs/devmeta/ia-records.md` → `.adapt/ia-records.md`
- `docs/devmeta/reflections/` → `.adapt/reflections/`

### Step 6: Update CLAUDE.md (if exists)

If the project has a `CLAUDE.md`, update any references to devmeta paths.

### Step 7: Add .adapt to .gitignore (selective)

Some `.adapt/` files should be tracked (adapt.md, terminology), others are
runtime artifacts. Add to `.gitignore`:

```
# ADAPT runtime artifacts (project-specific, regenerated)
# .adapt/shared-context-log.md  ← track if you want cross-session continuity
# .adapt/reflections/           ← track for audit trail
```

Decision: Track or ignore is project-specific. Default: track everything.

### Step 8: Remove Old devmeta Files

Only after verifying `.adapt/` is correct:

```bash
rm devmeta.md
rm -rf docs/devmeta/
```

### Step 9: Verify

```bash
echo "=== .adapt/ contents ==="
ls -la .adapt/
echo "=== Old devmeta removed ==="
test -f devmeta.md && echo "WARNING: devmeta.md still exists" || echo "OK: devmeta.md removed"
test -d docs/devmeta && echo "WARNING: docs/devmeta/ still exists" || echo "OK: docs/devmeta/ removed"
echo "=== ADAPT commands ==="
ls -la .claude/commands/adapt/
```

### Step 10: Commit

```bash
git add .adapt/ .claude/commands/adapt/
git rm devmeta.md docs/devmeta/ --cached 2>/dev/null
git commit -m "Migrate from devmeta to ADAPT framework

- Moved devmeta.md → .adapt/adapt.md
- Moved docs/devmeta/* → .adapt/
- Added ADAPT commands in .claude/commands/adapt/
- All artifacts now isolated in .adapt/ directory"
```

## Post-Migration

After migration, use ADAPT commands:
- `/adapt:go` — autonomous project driver
- `/adapt:plan-iteration` — plan an iteration
- `/adapt:run` — execute Features
- `/adapt:reflect` — I&A Cycle
- `/adapt:start-increment-spec` — start new Increment
- `/adapt:status` — check progress
