#!/bin/bash
# ===========================================
# PAI Shell Aliases and Functions
# ===========================================
# Source this file in your .bashrc or .zshrc:
#   source ~/Forge/scripts/pai-aliases.sh
#
# Or add this line to your shell config:
#   [ -f ~/Forge/scripts/pai-aliases.sh ] && source ~/Forge/scripts/pai-aliases.sh
# ===========================================

# Resolve this sourced file rather than assuming a checkout name or location.
# PAI_DIR is reserved for the runtime configuration directory (~/.claude).
if [ -n "${BASH_VERSION:-}" ]; then
    FORGE_REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)" || return 1
elif [ -n "${ZSH_VERSION:-}" ]; then
    FORGE_REPO_DIR="$(cd -- "$(dirname -- "${(%):-%N}")/.." && pwd -P)" || return 1
else
    echo "PAI aliases require Bash or Zsh." >&2
    return 1
fi

# -------------------------------------------
# Directory Navigation
# -------------------------------------------
alias pai='cd "$FORGE_REPO_DIR"'
alias paic='cd "$FORGE_REPO_DIR/.claude"'
alias pais='cd "$FORGE_REPO_DIR/.claude/skills"'
alias paia='cd "$FORGE_REPO_DIR/.claude/agents"'
alias paih='cd "$FORGE_REPO_DIR/.claude/hooks"'

# -------------------------------------------
# Git Status and Info
# -------------------------------------------
alias pai-status='cd "$FORGE_REPO_DIR" && git status'
alias pai-diff='cd "$FORGE_REPO_DIR" && git diff'
alias pai-log='cd "$FORGE_REPO_DIR" && git log --oneline -10'
alias pai-log-full='cd "$FORGE_REPO_DIR" && git log --oneline -30'
alias pai-branch='cd "$FORGE_REPO_DIR" && git branch -a'

# -------------------------------------------
# Git Sync Operations
# -------------------------------------------
alias pai-pull='cd "$FORGE_REPO_DIR" && git pull origin main'
alias pai-fetch='cd "$FORGE_REPO_DIR" && git fetch origin main'

# Push with auto-generated commit message
alias pai-push='cd "$FORGE_REPO_DIR" && git add -A && git commit -m '\''sync: $(date +%Y-%m-%d\ %H:%M)'\'' && git push origin main'

# Push with custom message
pai-commit() {
    if [ -z "$1" ]; then
        echo "Usage: pai-commit \"your commit message\""
        return 1
    fi
    cd "$FORGE_REPO_DIR" && git add -A && git commit -m "$1" && git push origin main
}

# Full sync (pull then push)
pai-sync() (
    echo "Pulling latest changes..."
    cd "$FORGE_REPO_DIR" || return $?
    git pull origin main || return $?

    local changes
    changes=$(git status --porcelain) || return $?
    if [ -n "$changes" ]; then
        echo "Pushing local changes..."
        git add -A || return $?
        git commit -m "sync: $(date +%Y-%m-%d\ %H:%M)" || return $?
        git push origin main || return $?
    else
        echo "No local changes to push."
    fi
)

# -------------------------------------------
# Quick Edit Functions
# -------------------------------------------

# Edit a file and push changes
pai-edit() (
    if [ -z "$1" ]; then
        echo "Usage: pai-edit <file-path>"
        echo "Example: pai-edit .claude/skills/MySkill/SKILL.md"
        return 1
    fi

    local file="$1"
    # If path doesn't start with /, assume it's relative to PAI
    if [[ "$file" != /* ]]; then
        file="$FORGE_REPO_DIR/$file"
    fi

    cd "$FORGE_REPO_DIR" || return $?
    ${EDITOR:-nano} "$file" || return $?
    git add -- "$file" || return $?
    git commit -m "update: $(basename "$file")" || return $?
    git push origin main || return $?
)

# Edit a skill's SKILL.md
pai-edit-skill() {
    if [ -z "$1" ]; then
        echo "Usage: pai-edit-skill <SkillName>"
        echo "Available skills:"
        ls "$FORGE_REPO_DIR/.claude/skills/"
        return 1
    fi
    pai-edit ".claude/skills/$1/SKILL.md"
}

# Edit an agent
pai-edit-agent() {
    if [ -z "$1" ]; then
        echo "Usage: pai-edit-agent <AgentName>"
        echo "Available agents:"
        ls "$FORGE_REPO_DIR/.claude/agents/"
        return 1
    fi
    pai-edit ".claude/agents/$1"
}

# -------------------------------------------
# Skill Management
# -------------------------------------------

# List all skills
pai-skills() {
    echo "PAI Skills:"
    echo "==========="
    ls -1 "$FORGE_REPO_DIR/.claude/skills/"
}

# List all agents
pai-agents() {
    echo "PAI Agents:"
    echo "==========="
    ls -1 "$FORGE_REPO_DIR/.claude/agents/"
}

# Create a new skill from template
pai-new-skill() {
    if [ -z "$1" ]; then
        echo "Usage: pai-new-skill <SkillName>"
        return 1
    fi

    local skill_name="$1"
    local skill_dir="$FORGE_REPO_DIR/.claude/skills/$skill_name"

    if [ -d "$skill_dir" ]; then
        echo "Error: Skill '$skill_name' already exists!"
        return 1
    fi

    # Create directory structure
    mkdir -p "$skill_dir"/{workflows,reference,tools}

    # Create SKILL.md template
    cat > "$skill_dir/SKILL.md" << EOF
---
skill: $skill_name
version: 1.0.0
description: Description of $skill_name skill
author: $(git config user.name)
created: $(date +%Y-%m-%d)
triggers:
  - "USE WHEN user asks about..."
---

# $skill_name

## Purpose

Describe what this skill does.

## Capabilities

- Capability 1
- Capability 2

## Usage

How to use this skill.

## Workflows

- \`workflows/Example.md\` - Example workflow

## References

- \`reference/Guide.md\` - Reference documentation
EOF

    echo "Created skill: $skill_name"
    echo "Directory: $skill_dir"
    echo ""
    echo "Next steps:"
    echo "  1. Edit the SKILL.md: pai-edit-skill $skill_name"
    echo "  2. Add workflows in: $skill_dir/workflows/"
    echo "  3. Push changes: pai-push"
}

# -------------------------------------------
# PAI Health and Testing
# -------------------------------------------

# Run PAI self-test
pai-test() {
    echo "Running PAI self-test..."
    bun "$FORGE_REPO_DIR/.claude/hooks/self-test.ts"
}

# Check PAI configuration
pai-check() {
    echo "PAI Configuration Check"
    echo "======================="
    echo ""
    echo "PAI Directory: $FORGE_REPO_DIR"
    [ -d "$FORGE_REPO_DIR" ] && echo "  [OK] Directory exists" || echo "  [FAIL] Directory missing!"

    echo ""
    echo ".claude symlink:"
    if [ -L "$HOME/.claude" ]; then
        echo "  [OK] ~/.claude -> $(readlink "$HOME/.claude")"
    elif [ -d "$HOME/.claude" ]; then
        echo "  [WARN] ~/.claude is a directory, not a symlink"
    else
        echo "  [FAIL] ~/.claude does not exist!"
    fi

    echo ""
    echo "Git Status:"
    cd "$FORGE_REPO_DIR" && git status --short

    echo ""
    echo "Environment:"
    [ -f "$FORGE_REPO_DIR/.claude/.env" ] && echo "  [OK] .env file exists" || echo "  [WARN] .env file missing!"

    echo ""
    echo "Bun:"
    command -v bun &> /dev/null && echo "  [OK] bun installed: $(bun --version)" || echo "  [FAIL] bun not installed!"
}

# -------------------------------------------
# Conflict Resolution
# -------------------------------------------

# Show files with conflicts
pai-conflicts() {
    cd "$FORGE_REPO_DIR" && git diff --name-only --diff-filter=U
}

# Abort a merge in progress
pai-abort() {
    cd "$FORGE_REPO_DIR" && git merge --abort
    echo "Merge aborted. Repository is back to pre-merge state."
}

# -------------------------------------------
# Undo Operations (Use with caution!)
# -------------------------------------------

# Undo last commit (keeps changes staged)
pai-undo() {
    echo "This will undo the last commit but keep your changes."
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$FORGE_REPO_DIR" && git reset --soft HEAD~1
        echo "Last commit undone. Changes are staged."
    fi
}

# Discard all local changes (dangerous!)
pai-reset() {
    echo "WARNING: This will discard ALL local changes!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$FORGE_REPO_DIR" && git checkout -- . && git clean -fd
        echo "All local changes discarded."
    fi
}

# -------------------------------------------
# Search & Discovery
# -------------------------------------------

# Semantic search across PAI history
pai-search() {
    if [ -z "$1" ]; then
        echo "Usage: pai-search \"query\" [--source type] [--limit N] [--json]"
        echo "Example: pai-search \"trading strategies\" --limit 10"
        return 1
    fi
    bun "$FORGE_REPO_DIR/.claude/skills/CORE/tools/MemorySearch.ts" "$@"
}

# -------------------------------------------
# Information Display
# -------------------------------------------

# Show PAI help (delegates to unified pai CLI)
pai-help() {
    pai help
}

# -------------------------------------------
# Completion Message
# -------------------------------------------
echo "PAI aliases loaded. Type 'pai-help' for available commands."
