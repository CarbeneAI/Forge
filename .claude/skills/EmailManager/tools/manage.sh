#!/bin/bash
#
# manage.sh - Start/stop/restart EmailMonitor service
#
# Usage:
#   ./manage.sh start
#   ./manage.sh stop
#   ./manage.sh restart
#   ./manage.sh status
#

SKILL_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
DATA_DIR="$SKILL_DIR/data"
PID_FILE="$DATA_DIR/emailmonitor.pid"
LOG_FILE="$DATA_DIR/emailmonitor.log"
TOOLS_DIR="$SKILL_DIR/tools"

# Ensure data directory exists
mkdir -p "$DATA_DIR"

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

start() {
    if is_running; then
        echo "EmailMonitor is already running (PID: $(get_pid))"
        return 1
    fi

    echo "Starting EmailMonitor..."
    cd "$SKILL_DIR"
    nohup bun "$TOOLS_DIR/EmailMonitor.ts" --daemon >> "$LOG_FILE" 2>&1 &

    # Wait a moment for startup
    sleep 2

    if is_running; then
        echo "EmailMonitor started (PID: $(get_pid))"
        echo "Log file: $LOG_FILE"
        return 0
    else
        echo "Failed to start EmailMonitor"
        echo "Check log: $LOG_FILE"
        return 1
    fi
}

stop() {
    if ! is_running; then
        echo "EmailMonitor is not running"
        [ -f "$PID_FILE" ] && rm "$PID_FILE"
        return 0
    fi

    local pid=$(get_pid)
    echo "Stopping EmailMonitor (PID: $pid)..."

    kill "$pid" 2>/dev/null

    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && is_running; do
        sleep 1
        count=$((count + 1))
    done

    if is_running; then
        echo "Force killing..."
        kill -9 "$pid" 2>/dev/null
    fi

    [ -f "$PID_FILE" ] && rm "$PID_FILE"
    echo "EmailMonitor stopped"
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if is_running; then
        local pid=$(get_pid)
        echo "EmailMonitor is running (PID: $pid)"

        # Show recent log entries
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "Recent log entries:"
            tail -10 "$LOG_FILE"
        fi

        # Show state
        local state_file="$DATA_DIR/email-state.json"
        if [ -f "$state_file" ]; then
            echo ""
            echo "Current state:"
            cat "$state_file"
        fi
    else
        echo "EmailMonitor is not running"
        [ -f "$PID_FILE" ] && rm "$PID_FILE"
    fi
}

logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
