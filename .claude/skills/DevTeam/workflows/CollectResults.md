# CollectResults Workflow

## Trigger

"Collect results", "Merge team work", "DevTeam done"

## Prerequisites

- All tasks in TODO.md should be `done` (or user accepts partial results)
- Agent sessions may still be running

## Steps

### Step 1: Verify Completion

```bash
${PAI_DIR}/tools/skill-workflow-notification CollectResults DevTeam
bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts list
```

Check that all tasks are `done`. If not, show remaining tasks and ask user how to proceed:
- Wait for remaining tasks
- Collect partial results (proceed with done tasks only)
- Cancel

### Step 2: Review Per Branch

For each task branch (worktree), show:

```bash
cd {repo_path}

# List all worktrees
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts list

# For each worktree/branch:
git log main..task/{id} --oneline
git diff main..task/{id} --stat
```

For each branch, present:
- Commit history (git log)
- Files changed (diff stat)
- Test results (if available from QA)
- Review status (if available from Solomon)

### Step 3: MANDATORY SECURITY REVIEW (Nehemiah)

**This step is NEVER skipped.** CarbeneAI policy: "Security Built In, Not Bolted On."

Dispatch Nehemiah (security auditor) to review ALL code changes before merge:

```bash
# For each task branch, Nehemiah reviews:
# 1. OWASP Top 10 compliance (injection, XSS, CSRF, auth flaws, etc.)
# 2. Authentication/authorization flows
# 3. Input validation and sanitization
# 4. Secrets/credentials exposure
# 5. Dependency vulnerabilities
# 6. Security headers (CSP, CORS, HSTS)
```

Use the `nehemiah` agent (Task tool, subagent_type: nehemiah) to review the combined diff:

```bash
git diff main..task/{id}
```

Nehemiah produces a **Security Review Report** with:
- **PASS** — No security issues found, safe to merge
- **WARN** — Minor issues noted, recommend fixing before merge
- **FAIL** — Critical security issues, MUST fix before merge

If FAIL: Route findings back to Hiram agents for remediation before proceeding.
If WARN: Present to user for decision (fix now or accept risk).
If PASS: Proceed to merge.

### Step 4: HUMAN CHECKPOINT - Review Changes

Present all branches to user for review along with Nehemiah's security report. Ask for merge strategy:

**Option A: Individual PRs**
```bash
# For each branch
git push origin task/{id}
gh pr create --title "Task {id}: {title}" --body "Part of DevTeam: {project_name}"
```

**Option B: Squash into feature branch**
```bash
# Create feature branch
git checkout -b feature/{project_name_slug} main

# Merge each task branch
git merge task/001 --no-ff
git merge task/002 --no-ff
# ... etc

# Or squash merge
git merge --squash task/001
git merge --squash task/002
```

**Option C: Cherry-pick specific commits**
```bash
# User specifies which commits to include
git cherry-pick {commit_hash}
```

### Step 5: Execute Merge

Execute the user's chosen merge strategy. If conflicts arise, report them and let user resolve manually.

### Step 6: Cleanup

After merge is complete:

```bash
# Kill all agent tmux sessions
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill joshua
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill hiram-1
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill hiram-2
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill ezra
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill nehemiah
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill solomon

# Remove worktrees
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts remove task/001
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts remove task/002
# ... for each task branch

# Prune stale worktree references
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts prune
```

### Step 7: Archive (Optional)

Ask user if they want to archive the `.devteam/` directory:

```bash
# Copy to PAI history
cp -r {repo_path}/.devteam ${PAI_DIR}/history/devteam-{project_name_slug}-$(date +%Y-%m-%d)

# Or remove it
rm -rf {repo_path}/.devteam
```

### Step 8: Final Report

```
DevTeam Complete: {project_name}

Tasks: {done_count}/{total_count} completed
Branches merged: {branch_list}
Files changed: {total_files}
Commits: {total_commits}

Archive: {archive_path or "not archived"}
Cleanup: All sessions killed, worktrees removed

Send Telegram notification:
bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "DevTeam complete: {project_name} - {done_count} tasks, {total_files} files"
```