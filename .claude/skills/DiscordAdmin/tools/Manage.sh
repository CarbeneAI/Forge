#!/bin/bash
# Manage.sh - PAI Discord Bot service management
#
# Usage:
#   ./Manage.sh {start|stop|restart|status|logs}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
PID_FILE="${PAI_DIR}/run/discord-bot.pid"
LOG_FILE="${PAI_DIR}/logs/discord-bot.log"
SERVER_SCRIPT="${SCRIPT_DIR}/DiscordBot.ts"

# Ensure directories exist
mkdir -p "$(dirname "$PID_FILE")" "$(dirname "$LOG_FILE")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

start_bot() {
    if is_running; then
        log_warn "DiscordBot already running (PID: $(get_pid))"
        return 0
    fi

    log_info "Starting PAI Discord Bot..."

    if ! command -v bun &> /dev/null; then
        log_error "Bun is not installed. Please install Bun first."
        exit 1
    fi

    if [ ! -f "$SERVER_SCRIPT" ]; then
        log_error "Server script not found: $SERVER_SCRIPT"
        exit 1
    fi

    # Start the bot in background
    nohup bun "$SERVER_SCRIPT" >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"

    # Wait a moment and verify it started
    sleep 2

    if is_running; then
        log_info "DiscordBot started successfully (PID: $pid)"
        log_info "Logs: $LOG_FILE"
    else
        log_error "DiscordBot failed to start. Check logs:"
        tail -20 "$LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

stop_bot() {
    if ! is_running; then
        log_warn "DiscordBot is not running"
        rm -f "$PID_FILE"
        return 0
    fi

    local pid
    pid=$(get_pid)
    log_info "Stopping DiscordBot (PID: $pid)..."

    kill "$pid" 2>/dev/null || true

    # Wait for graceful shutdown
    local count=0
    while is_running && [ $count -lt 10 ]; do
        sleep 1
        ((count++))
    done

    # Force kill if still running
    if is_running; then
        log_warn "Force killing..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$PID_FILE"
    log_info "DiscordBot stopped"
}

restart_bot() {
    stop_bot
    sleep 1
    start_bot
}

status_bot() {
    if is_running; then
        local pid
        pid=$(get_pid)
        log_info "DiscordBot is running (PID: $pid)"
        echo ""
        echo "Log file: $LOG_FILE"
        echo "PID file: $PID_FILE"
        echo ""
        echo "Recent logs:"
        echo "------------"
        tail -10 "$LOG_FILE" 2>/dev/null || echo "(no logs yet)"
    else
        log_warn "DiscordBot is not running"
        if [ -f "$PID_FILE" ]; then
            rm -f "$PID_FILE"
            log_info "Cleaned up stale PID file"
        fi
    fi
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        log_warn "No log file found at $LOG_FILE"
    fi
}

show_help() {
    echo "PAI Discord Bot Manager"
    echo ""
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start     Start the bot in background"
    echo "  stop      Stop the running bot"
    echo "  restart   Restart the bot"
    echo "  status    Show bot status and recent logs"
    echo "  logs      Follow log output (tail -f)"
    echo ""
    echo "Files:"
    echo "  Log:  $LOG_FILE"
    echo "  PID:  $PID_FILE"
    echo ""
    echo "systemd Service:"
    echo "  systemctl --user enable pai-discord-bot"
    echo "  systemctl --user start pai-discord-bot"
}

case "${1:-}" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot
        ;;
    status)
        status_bot
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac
