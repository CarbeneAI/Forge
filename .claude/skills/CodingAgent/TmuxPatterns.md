# tmux Patterns

Reference for tmux commands used in CodingAgent.

## Socket Configuration

PAI uses a dedicated socket to isolate agent sessions:

```bash
# Socket path
SOCKET="${TMPDIR:-/tmp}/pai-agents.sock"

# All tmux commands use this socket
tmux -S "$SOCKET" <command>
```

## Session Naming

Sessions follow the pattern: `pai-agent-{identifier}`

Examples:
- `pai-agent-issue-123`
- `pai-agent-feature-auth`
- `pai-agent-bugfix-login`

## Core Commands

### Create Session

```bash
# Create new detached session
tmux -S "$SOCKET" new-session -d -s "pai-agent-issue-123" -n shell

# Create with specific working directory
tmux -S "$SOCKET" new-session -d -s "pai-agent-issue-123" -c "/path/to/worktree"
```

### Send Commands

```bash
# Send text to session
tmux -S "$SOCKET" send-keys -t "pai-agent-issue-123":0.0 -- "echo hello" Enter

# Send Claude Code command
tmux -S "$SOCKET" send-keys -t "pai-agent-issue-123":0.0 -- "claude 'Fix the bug in auth.ts'" Enter
```

**Important:** Always include `Enter` at the end to execute the command.

### Capture Output

```bash
# Capture last 200 lines
tmux -S "$SOCKET" capture-pane -p -J -t "pai-agent-issue-123":0.0 -S -200

# Capture entire history
tmux -S "$SOCKET" capture-pane -p -J -t "pai-agent-issue-123":0.0 -S -

# Save to file
tmux -S "$SOCKET" capture-pane -p -J -t "pai-agent-issue-123":0.0 -S -200 > output.txt
```

Flags:
- `-p` - Print to stdout (instead of buffer)
- `-J` - Join wrapped lines
- `-S -200` - Start 200 lines from current position

### List Sessions

```bash
# List all sessions on socket
tmux -S "$SOCKET" list-sessions

# List with format
tmux -S "$SOCKET" list-sessions -F "#{session_name}: #{session_created}"

# Check if specific session exists
tmux -S "$SOCKET" has-session -t "pai-agent-issue-123" 2>/dev/null && echo "exists"
```

### Kill Session

```bash
# Kill specific session
tmux -S "$SOCKET" kill-session -t "pai-agent-issue-123"

# Kill all PAI agent sessions
tmux -S "$SOCKET" list-sessions -F "#{session_name}" | \
  grep "^pai-agent-" | \
  xargs -I {} tmux -S "$SOCKET" kill-session -t {}
```

### Attach to Session

```bash
# Attach interactively (for debugging)
tmux -S "$SOCKET" attach-session -t "pai-agent-issue-123"

# Detach with Ctrl+B then D
```

## Window and Pane Targeting

tmux uses `session:window.pane` notation:

- `session` - Session name (pai-agent-issue-123)
- `window` - Window index (0, 1, 2...)
- `pane` - Pane index (0, 1, 2...)

Examples:
- `pai-agent-issue-123:0.0` - First window, first pane
- `pai-agent-issue-123:1.0` - Second window, first pane

For CodingAgent, we typically use single-window sessions: `:0.0`

## Environment Setup

Set environment for agent sessions:

```bash
# Set environment variable
tmux -S "$SOCKET" set-environment -t "pai-agent-issue-123" PAI_DIR "/home/user/.claude"

# Set working directory
tmux -S "$SOCKET" send-keys -t "pai-agent-issue-123":0.0 -- "cd /path/to/worktree" Enter
```

## Session Status

Check if agent is still active:

```bash
# Get window activity
tmux -S "$SOCKET" display-message -t "pai-agent-issue-123" -p "#{window_activity}"

# Check if process is running (look for claude process)
tmux -S "$SOCKET" list-panes -t "pai-agent-issue-123" -F "#{pane_pid}"
```

## Complete Agent Launch Script

```bash
#!/bin/bash
SOCKET="${TMPDIR:-/tmp}/pai-agents.sock"
SESSION="pai-agent-$1"
WORKDIR="$2"
PROMPT="$3"

# Create session
tmux -S "$SOCKET" new-session -d -s "$SESSION" -c "$WORKDIR"

# Set environment
tmux -S "$SOCKET" set-environment -t "$SESSION" PAI_DIR "$PAI_DIR"

# Launch Claude Code
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "claude '$PROMPT'" Enter

echo "Agent $SESSION started in $WORKDIR"
```

## Debugging

### View session in real-time

```bash
# Attach and watch
tmux -S "$SOCKET" attach-session -t "pai-agent-issue-123"
```

### Check session logs

```bash
# Enable logging (before session start)
tmux -S "$SOCKET" pipe-pane -t "pai-agent-issue-123" "cat >> /tmp/agent-issue-123.log"
```

### Check if tmux server is running

```bash
# Server status
tmux -S "$SOCKET" info 2>&1 | head -5

# Start server if needed (happens automatically with new-session)
tmux -S "$SOCKET" start-server
```

## Error Handling

### Session doesn't exist
```bash
if ! tmux -S "$SOCKET" has-session -t "$SESSION" 2>/dev/null; then
  echo "Session $SESSION not found"
  exit 1
fi
```

### Socket doesn't exist
```bash
if [[ ! -S "$SOCKET" ]]; then
  echo "No active tmux server. Creating..."
  tmux -S "$SOCKET" new-session -d -s init
  tmux -S "$SOCKET" kill-session -t init
fi
```

### Permission issues
```bash
# Ensure socket is accessible
chmod 700 "${TMPDIR:-/tmp}"
```
