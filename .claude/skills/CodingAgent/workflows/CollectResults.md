# CollectResults Workflow

Gather and review results from completed coding agents.

## Trigger

User requests:
- "Gather results from agents"
- "Collect the work"
- "What did the agents accomplish?"
- "Merge agent work"

## Steps

### 1. Identify Completed Sessions

```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts list
```

Filter for completed/inactive sessions.

### 2. Review Each Worktree

For each completed agent:

```bash
cd .worktrees/issue-123

# Check commits
git log main..HEAD --oneline

# Review changes
git diff main..HEAD --stat

# Run tests (if applicable)
bun test
```

### 3. Summarize Changes

For each worktree, document:
- Branch name
- Number of commits
- Files changed
- Tests passing/failing
- Any issues noted

### 4. Create PRs or Merge

**Option A: Create Pull Requests**
```bash
cd .worktrees/issue-123
git push origin fix/issue-123
gh pr create --title "Fix #123: [summary]" --body "Automated fix by PAI agent"
```

**Option B: Direct Merge** (if appropriate)
```bash
git checkout main
git merge --no-ff fix/issue-123
git push origin main
```

### 5. Cleanup

After successful merge:

```bash
# Remove worktree
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts remove fix/issue-123

# Kill session if still active
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill issue-123
```

## Results Report Template

```markdown
## Agent Results Summary

### Issue #123 - fix/issue-123
- **Status:** Completed
- **Commits:** 3
- **Files Changed:** 5
- **Tests:** Passing
- **PR:** https://github.com/repo/pull/456

### Issue #124 - fix/issue-124
- **Status:** Completed
- **Commits:** 2
- **Files Changed:** 3
- **Tests:** Passing
- **PR:** https://github.com/repo/pull/457

### Issue #125 - fix/issue-125
- **Status:** In Progress
- **Current:** Writing tests
- **Commits:** 1
```

## Merge Strategies

### Simple Features/Fixes
- Create PR
- Review diff
- Squash and merge

### Complex Changes
- Create PR
- Full code review
- Merge with merge commit

### Conflicting Changes
- Identify conflicts between worktrees
- Resolve in order of priority
- May need to rebase later worktrees

## Validation Checklist

Before merging:
- [ ] Tests pass in worktree
- [ ] Code follows project style
- [ ] Commits have good messages
- [ ] No unintended changes
- [ ] PR description is clear

## Cleanup Script

After all work is merged:

```bash
#!/bin/bash
# Clean up all PAI agent resources

# Kill all agent sessions
SOCKET="${TMPDIR:-/tmp}/pai-agents.sock"
tmux -S "$SOCKET" list-sessions -F "#{session_name}" 2>/dev/null | \
  grep "^pai-agent-" | \
  xargs -I {} tmux -S "$SOCKET" kill-session -t {}

# Remove merged worktrees
git worktree prune
for wt in .worktrees/*/; do
  branch=$(git -C "$wt" branch --show-current)
  if git merge-base --is-ancestor "$branch" main 2>/dev/null; then
    echo "Removing merged worktree: $wt"
    git worktree remove "$wt"
    git branch -d "$branch"
  fi
done
```
