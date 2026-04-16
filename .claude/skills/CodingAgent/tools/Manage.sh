#!/bin/bash
#
# Manage.sh - Quick management commands for coding agents
#

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
SOCKET="${TMPDIR:-/tmp}/pai-agents.sock"
PREFIX="pai-agent-"

usage() {
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  list              List all agent sessions"
    echo "  kill-all          Kill all agent sessions"
    echo "  capture <name>    Capture output from session"
    echo "  cleanup           Remove merged worktrees and prune"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 kill-all"
    echo "  $0 capture issue-123"
    echo "  $0 cleanup"
}

list_sessions() {
    if ! tmux -S "$SOCKET" list-sessions 2>/dev/null | grep "^$PREFIX"; then
        echo "No active PAI agent sessions"
    fi
}

kill_all() {
    local sessions
    sessions=$(tmux -S "$SOCKET" list-sessions -F "#{session_name}" 2>/dev/null | grep "^$PREFIX")

    if [[ -z "$sessions" ]]; then
        echo "No active PAI agent sessions to kill"
        return
    fi

    echo "Killing agent sessions:"
    for sess in $sessions; do
        echo "  - $sess"
        tmux -S "$SOCKET" kill-session -t "$sess"
    done
    echo "Done"
}

capture_output() {
    local name="$1"
    if [[ -z "$name" ]]; then
        echo "Error: Session name required"
        return 1
    fi

    tmux -S "$SOCKET" capture-pane -p -J -t "${PREFIX}${name}:0.0" -S -200
}

cleanup() {
    # Prune stale worktrees
    echo "Pruning stale worktree references..."
    git worktree prune -v 2>/dev/null || true

    # Find and report merged worktrees
    if [[ -d ".worktrees" ]]; then
        echo ""
        echo "Checking worktrees for merged branches..."
        for wt in .worktrees/*/; do
            if [[ -d "$wt" ]]; then
                branch=$(git -C "$wt" branch --show-current 2>/dev/null)
                if [[ -n "$branch" ]]; then
                    if git merge-base --is-ancestor "$branch" main 2>/dev/null; then
                        echo "  [merged] $wt ($branch)"
                    else
                        echo "  [active] $wt ($branch)"
                    fi
                fi
            fi
        done
    else
        echo "No .worktrees directory found"
    fi

    echo ""
    echo "To remove merged worktrees, run:"
    echo "  git worktree remove .worktrees/<name>"
}

case "$1" in
    list)
        list_sessions
        ;;
    kill-all)
        kill_all
        ;;
    capture)
        capture_output "$2"
        ;;
    cleanup)
        cleanup
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac
