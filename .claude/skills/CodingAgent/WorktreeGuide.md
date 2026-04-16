# Git Worktree Guide

Best practices for using git worktrees with CodingAgent.

## What are Worktrees?

Git worktrees allow multiple working directories from a single repository. Each worktree:
- Has its own checked-out branch
- Shares the same git history
- Can be modified independently
- Doesn't require separate clones

## Directory Structure

Recommended layout for CodingAgent:

```
project/
├── .git/                    # Shared git directory
├── src/                     # Main working copy (usually main branch)
├── package.json
└── .worktrees/              # All agent worktrees live here
    ├── issue-123/           # fix/issue-123 branch
    ├── issue-124/           # fix/issue-124 branch
    └── feature-auth/        # feature/auth branch
```

**Why `.worktrees/`?**
- Keeps agent work separate from main codebase
- Easy to clean up after merging
- Gitignore-friendly (add `/.worktrees/` to `.gitignore`)

## Core Commands

### Create Worktree

```bash
# Create worktree with new branch
git worktree add -b fix/issue-123 .worktrees/issue-123 main

# Create worktree from existing branch
git worktree add .worktrees/issue-123 fix/issue-123

# Create worktree at specific commit
git worktree add .worktrees/hotfix abc123
```

Breakdown:
- `-b fix/issue-123` - Create new branch named `fix/issue-123`
- `.worktrees/issue-123` - Path for the worktree
- `main` - Base branch to start from

### List Worktrees

```bash
# Show all worktrees
git worktree list

# Output example:
# /home/user/project         abc1234 [main]
# /home/user/project/.worktrees/issue-123  def5678 [fix/issue-123]
# /home/user/project/.worktrees/issue-124  ghi9012 [fix/issue-124]
```

### Remove Worktree

```bash
# Remove worktree (keeps branch)
git worktree remove .worktrees/issue-123

# Force remove (if uncommitted changes)
git worktree remove --force .worktrees/issue-123

# Clean up stale worktrees
git worktree prune
```

### Branch Operations

```bash
# In worktree directory, all git commands work normally
cd .worktrees/issue-123
git add .
git commit -m "Fix issue #123"
git push origin fix/issue-123
```

## CodingAgent Workflow

### 1. Setup Phase

```bash
# Ensure worktrees directory exists
mkdir -p .worktrees

# Add to gitignore
echo "/.worktrees/" >> .gitignore
```

### 2. Spawn Agents

For each issue:

```bash
# Create worktree
git worktree add -b fix/issue-$ISSUE .worktrees/issue-$ISSUE main

# Launch agent in worktree
tmux -S "$SOCKET" new-session -d -s "pai-agent-issue-$ISSUE" -c ".worktrees/issue-$ISSUE"
tmux -S "$SOCKET" send-keys -t "pai-agent-issue-$ISSUE":0.0 -- "claude '$PROMPT'" Enter
```

### 3. After Agent Completion

```bash
# Review changes
cd .worktrees/issue-123
git diff main..HEAD
git log main..HEAD --oneline

# Create PR
git push origin fix/issue-123
gh pr create --title "Fix #123: Description" --body "Fixes #123"

# After merge, clean up
cd ..
git worktree remove issue-123
git branch -d fix/issue-123
```

## Best Practices

### Branch Naming

Use consistent branch naming:
- `fix/issue-{number}` - Bug fixes
- `feature/{name}` - New features
- `refactor/{name}` - Refactoring
- `hotfix/{name}` - Urgent fixes

### Worktree Naming

Match worktree directory to issue/feature:
- `.worktrees/issue-123` for `fix/issue-123`
- `.worktrees/feature-auth` for `feature/auth`

### Dependencies

If using node_modules or similar:

```bash
# Option 1: Separate node_modules per worktree (cleaner, uses more disk)
cd .worktrees/issue-123
bun install

# Option 2: Symlink node_modules (faster, may cause issues)
ln -s ../../node_modules .worktrees/issue-123/node_modules
```

### Preventing Conflicts

- Each worktree must have a unique branch
- Cannot check out the same branch in multiple worktrees
- Lock worktrees if needed: `git worktree lock .worktrees/issue-123`

## Cleanup Script

```bash
#!/bin/bash
# cleanup-worktrees.sh - Remove merged worktrees

cd "$(git rev-parse --show-toplevel)" || exit 1

# Get merged branches
MERGED=$(git branch --merged main | grep -E "^\s*(fix|feature)/" | sed 's/^[ *]*//')

for branch in $MERGED; do
  worktree=$(git worktree list | grep "\[$branch\]" | awk '{print $1}')
  if [[ -n "$worktree" ]]; then
    echo "Removing worktree: $worktree ($branch)"
    git worktree remove "$worktree"
  fi
  echo "Deleting branch: $branch"
  git branch -d "$branch"
done

# Prune stale worktree references
git worktree prune
```

## Troubleshooting

### "fatal: 'branch' is already checked out"

A branch can only exist in one worktree:
```bash
# Find where it's checked out
git worktree list | grep branch-name

# Remove that worktree first
git worktree remove path/to/worktree
```

### Worktree points to missing directory

```bash
# Clean up broken references
git worktree prune
```

### Permission issues

```bash
# Ensure proper permissions
chmod -R u+w .worktrees/
```

### Submodules in worktrees

```bash
# Initialize submodules in worktree
cd .worktrees/issue-123
git submodule update --init --recursive
```

## Performance Notes

- Worktrees share `.git` directory - minimal disk overhead
- Large repos benefit more (only one full clone)
- Node_modules can be symlinked for faster setup
- Use sparse checkout for very large repos
