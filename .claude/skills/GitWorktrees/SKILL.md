---
name: git-worktrees
description: |
  Creates isolated git worktrees for feature development with safety verification.
  USE WHEN starting feature work, creating feature branch, isolating development, OR before implementing from plan.
  Safety: MUST verify project-local dirs (node_modules/, .venv/, etc.) are gitignored before creating worktree. Runs project setup and baseline tests.
---

# Git Worktrees

Creates isolated git worktree directories for feature development with automatic safety verification and project setup.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

- "create worktree for feature X" → Isolated feature development
- "set up feature branch" → Before implementation
- "isolate this work" → Separate from main codebase
- Before executing implementation plans → Clean environment
- Before starting complex feature → Risk isolation

## Core Philosophy

**Isolation Prevents Accidents**

Git worktrees create completely separate working directories that:
- Share git history (efficient)
- Have independent branches
- Can't accidentally commit to main
- Enable parallel development
- Simplify cleanup (delete directory = gone)

**Safety First: Verify Gitignore**

Project-local directories (node_modules/, .venv/, dist/, target/) **MUST** be gitignored before creating worktrees.

If not ignored, these directories would be tracked by git and shared across worktrees, causing:
- Dependency conflicts
- Build artifacts corruption
- Lock file collisions
- Massive git repository size

**CRITICAL: Always verify and fix .gitignore before creating worktree.**

**Clean Baseline: Setup and Test**

New worktree should start with:
1. Project dependencies installed
2. Project built/compiled if needed
3. Tests passing (clean baseline)

If tests fail in new worktree, something's wrong with setup. Fix before implementation.

## The Process

### Step 1: Directory Selection

**Priority order for worktree location:**

1. **Project has `.worktrees/` directory** → Use it
2. **Project has `worktrees/` directory** → Use it
3. **CLAUDE.md specifies preference** → Follow it
4. **Ask user** where to create

**Example:**

```markdown
## Worktree Location

Checking for standard worktree directories...

- `.worktrees/`: Not found
- `worktrees/`: Not found
- CLAUDE.md preference: Not specified

Where should I create the worktree?

Options:
1. `.worktrees/feature-name` (recommended - gitignored by default)
2. `../feature-name` (sibling directory)
3. Specify custom path

What's your preference?
```

### Step 2: Safety Verification

**CRITICAL: Check .gitignore for project-local directories**

Before creating worktree, verify these directories are gitignored:

**Node.js/JavaScript:**
- `node_modules/`
- `dist/`, `build/`
- `.next/`, `.nuxt/`, `.output/`

**Python:**
- `.venv/`, `venv/`, `env/`
- `__pycache__/`, `*.pyc`
- `.pytest_cache/`, `.mypy_cache/`

**Rust:**
- `target/`
- `Cargo.lock` (if library)

**Go:**
- `vendor/` (if using)

**General:**
- `.env` (secrets)
- `*.log` (logs)

**Verification Process:**

```bash
# Check .gitignore
cat .gitignore

# If missing critical entries, CHECK THREE TIMES:
# 1. Are these directories actually local to project?
# 2. Should they be ignored?
# 3. Am I 100% certain?
```

**If project-local directories NOT ignored:**

```markdown
⚠️ SAFETY CHECK FAILED

.gitignore is missing critical entries:

Missing:
- node_modules/ (Node.js dependencies)
- dist/ (Build output)

These MUST be gitignored before creating worktree.

Shall I:
1. Add these to .gitignore and commit
2. You'll update .gitignore manually
3. Skip (DANGEROUS - not recommended)

Waiting for confirmation.
```

**If adding to .gitignore:**

```bash
# Add missing entries
cat >> .gitignore << 'EOF'

# Project-local directories (must be ignored for worktrees)
node_modules/
dist/
build/
EOF

# Commit the change
git add .gitignore
git commit -m "Add project-local directories to .gitignore

Required for git worktree safety:
- node_modules/ (dependencies)
- dist/ (build output)

These directories must be local to each worktree."

# THEN proceed with worktree creation
```

### Step 3: Create Worktree

**After safety verification passes:**

1. **Detect project name** (from directory or package.json)
2. **Create branch name** (feature/<description>)
3. **Create worktree** with new branch
4. **Report location**

**Commands:**

```bash
# Detect project name
PROJECT_NAME=$(basename $(git rev-parse --show-toplevel))

# Create worktree with new branch
git worktree add .worktrees/feature-name -b feature/<project>-<description>

# Example:
# git worktree add .worktrees/user-auth -b feature/myapp-user-auth
```

**Report:**

```markdown
## Worktree Created

**Location:** `.worktrees/user-auth/`
**Branch:** `feature/myapp-user-auth`
**Base:** `main` (current HEAD)

Worktree is ready. Moving to setup...
```

### Step 4: Project Setup

**Auto-detect project type and run setup:**

**Node.js (has package.json):**
```bash
cd .worktrees/user-auth/
npm install  # or yarn install, or pnpm install, or bun install
```

**Python (has requirements.txt or pyproject.toml):**
```bash
cd .worktrees/user-auth/
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # or pip install -e .
```

**Rust (has Cargo.toml):**
```bash
cd .worktrees/user-auth/
cargo build
```

**Go (has go.mod):**
```bash
cd .worktrees/user-auth/
go mod download
```

**Report:**

```markdown
## Project Setup

**Project Type:** Node.js (detected package.json)

**Setup Command:**
```bash
$ cd .worktrees/user-auth/
$ npm install

added 234 packages in 12s
```

Dependencies installed. Running baseline tests...
```

### Step 5: Verify Clean Baseline

**Run tests to verify worktree is in good state:**

```bash
# Node.js
npm test

# Python
pytest

# Rust
cargo test

# Go
go test ./...
```

**If tests pass:**

```markdown
## Baseline Verification

```bash
$ npm test

PASS tests/example.test.ts
  ✓ example test (5ms)

Test Files  1 passed (1)
     Tests  1 passed (1)
Duration  0.84s
```

✅ Clean baseline - all tests passing

Worktree is ready for development!

**Location:** `.worktrees/user-auth/`
**Branch:** `feature/myapp-user-auth`

You can now:
- cd .worktrees/user-auth/
- Start implementing
- Tests run independently of main worktree
```

**If tests fail:**

```markdown
⚠️ BASELINE TESTS FAILING

Tests failed in new worktree:

```bash
$ npm test

FAIL tests/example.test.ts
  ✗ example test
    Expected 2, got 3
```

This indicates a problem with setup or main branch state.

Should I:
1. Debug the test failure
2. Investigate main branch (is it broken?)
3. Skip baseline verification (not recommended)

Waiting for guidance.
```

## Common Worktree Patterns

### Pattern 1: Feature Branch

```markdown
User: "Create worktree for user authentication feature"

**Steps:**
1. Check .gitignore → OK (node_modules/ ignored)
2. Create `.worktrees/user-auth/`
3. Branch: `feature/myapp-user-auth`
4. Run `npm install`
5. Run `npm test` → All pass ✅

Ready for development!
```

### Pattern 2: Parallel Features

```markdown
User: "Create two worktrees for parallel work"

**Worktree 1:**
- Location: `.worktrees/frontend-ui/`
- Branch: `feature/myapp-frontend-ui`
- Purpose: UI components

**Worktree 2:**
- Location: `.worktrees/backend-api/`
- Branch: `feature/myapp-backend-api`
- Purpose: API endpoints

Both ready for parallel development!
```

### Pattern 3: Hotfix

```markdown
User: "Create worktree for urgent bugfix"

**Steps:**
1. Base off production branch (not main)
2. Create `.worktrees/hotfix-login-crash/`
3. Branch: `hotfix/login-crash`
4. Setup and verify
5. Ready for fix!

**Note:** Hotfix branches typically merge to both production and main.
```

## Worktree Management

### List Worktrees

```bash
git worktree list
```

**Example output:**
```
/path/to/project        a1b2c3d [main]
/path/to/.worktrees/user-auth  e4f5g6h [feature/myapp-user-auth]
```

### Remove Worktree

**When feature is done and merged:**

```bash
# 1. Delete worktree directory
rm -rf .worktrees/user-auth/

# 2. Prune worktree from git
git worktree prune

# 3. (Optional) Delete branch if merged
git branch -d feature/myapp-user-auth
```

### Switch Between Worktrees

```bash
# Just cd to different directory
cd .worktrees/user-auth/      # Work on user-auth feature
cd ../../                      # Back to main worktree
cd .worktrees/frontend-ui/    # Work on frontend feature
```

## Integration with Other Skills

**GitWorktrees → ExecutingPlans:**
Create worktree before executing implementation plan.

**GitWorktrees → SubagentDrivenDev:**
Execute subagent-driven development within isolated worktree.

**GitWorktrees → Brainstorming:**
Create worktree before implementing brainstormed design.

**Typical flow:**
```
Brainstorming → WritingPlans → GitWorktrees → ExecutingPlans
```

## Safety Verification Checklist

Before creating worktree, verify:

- [ ] Project-local directories in .gitignore
  - [ ] Dependencies (node_modules/, .venv/, vendor/)
  - [ ] Build output (dist/, build/, target/)
  - [ ] Caches (.next/, .pytest_cache/)
- [ ] .env files gitignored (if exist)
- [ ] Lock files handling decided (package-lock.json: track or ignore?)

If anything NOT ignored that should be:

- [ ] Add to .gitignore
- [ ] Commit .gitignore changes
- [ ] THEN create worktree

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Create worktree without checking .gitignore | node_modules/ shared across worktrees | Verify .gitignore first |
| Forget to run project setup | Missing dependencies, tests fail | Always run install/build |
| Skip baseline test verification | Start with broken tests | Run tests before implementation |
| Create worktree on main branch | Accidental commits to main | Always create new branch |
| Don't remove old worktrees | Disk space waste, confusion | Delete worktree when done |

## Quick Reference

### Situations and Actions

| Situation | Action |
|-----------|--------|
| **Starting new feature** | Create worktree with feature branch |
| **Need to pause feature** | Just leave worktree, switch to main |
| **Want to delete feature** | Delete worktree directory, prune |
| **Feature merged to main** | Delete worktree, delete branch |
| **Test failing in worktree** | Debug in worktree, doesn't affect main |
| **Want to switch features** | Just cd to different worktree |
| **Hotfix needed urgently** | Create hotfix worktree from production |
| **.gitignore missing entries** | Add entries, commit, THEN create worktree |

### Project Type Detection

| Project Type | Indicator | Setup Command |
|--------------|-----------|---------------|
| Node.js | package.json | npm install |
| Python | requirements.txt | pip install -r requirements.txt |
| Python | pyproject.toml | pip install -e . |
| Rust | Cargo.toml | cargo build |
| Go | go.mod | go mod download |
| Ruby | Gemfile | bundle install |

### Baseline Test Commands

| Project Type | Test Command |
|--------------|-------------|
| Node.js | npm test |
| Python | pytest |
| Rust | cargo test |
| Go | go test ./... |
| Ruby | bundle exec rspec |

## Example: Full Worktree Creation

```markdown
User: "Create worktree for user authentication feature"

## Step 1: Directory Selection

Standard directory `.worktrees/` exists. Using it.

---

## Step 2: Safety Verification

Checking .gitignore for project-local directories...

```bash
$ cat .gitignore
node_modules/
dist/
.env
*.log
```

✅ Safety check passed:
- node_modules/ ignored
- dist/ ignored
- .env ignored

---

## Step 3: Create Worktree

```bash
$ git worktree add .worktrees/user-auth -b feature/myapp-user-auth
Preparing worktree (new branch 'feature/myapp-user-auth')
HEAD is now at a1b2c3d Initial commit
```

**Worktree Created:**
- Location: `.worktrees/user-auth/`
- Branch: `feature/myapp-user-auth`

---

## Step 4: Project Setup

Detected: Node.js project (package.json)

```bash
$ cd .worktrees/user-auth/
$ npm install

added 234 packages, and audited 235 packages in 12s
```

Dependencies installed.

---

## Step 5: Verify Clean Baseline

Running tests to verify clean baseline...

```bash
$ npm test

 RUN  v0.34.6

 ✓ tests/example.test.ts (1)
   ✓ example test (5ms)

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  0.84s
```

✅ Clean baseline - all tests passing

---

## Worktree Ready! ✅

**Location:** `.worktrees/user-auth/`
**Branch:** `feature/myapp-user-auth`
**Status:** Dependencies installed, tests passing

You can now:
```bash
cd .worktrees/user-auth/
# Start implementing user authentication
```

When done:
1. Merge feature branch to main
2. Delete worktree: `rm -rf .worktrees/user-auth/`
3. Prune: `git worktree prune`
```

---

**This skill creates safe, isolated development environments for feature work with automatic setup and verification.**
