#!/bin/bash
# Wazuh Security Dashboard Manager
# Location: ~/.claude/skills/WazuhDashboard/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PORT=4001
CLIENT_PORT=5173

case "${1:-}" in
    start)
        # Check if already running
        if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "Already running at http://localhost:$CLIENT_PORT"
            exit 0
        fi

        # Start server (silent) - TLS disabled for Wazuh self-signed certs
        cd "$SCRIPT_DIR/apps/server"
        NODE_TLS_REJECT_UNAUTHORIZED=0 bun run dev >/dev/null 2>&1 &
        SERVER_PID=$!

        # Wait for server
        for i in {1..10}; do
            curl -s http://localhost:$SERVER_PORT/health >/dev/null 2>&1 && break
            sleep 1
        done

        # Start client (silent)
        cd "$SCRIPT_DIR/apps/client"
        bun run dev >/dev/null 2>&1 &
        CLIENT_PID=$!

        # Wait for client
        for i in {1..10}; do
            curl -s http://localhost:$CLIENT_PORT >/dev/null 2>&1 && break
            sleep 1
        done

        echo "Wazuh Dashboard running at http://localhost:$CLIENT_PORT"

        # Cleanup on exit
        cleanup() {
            kill $SERVER_PID $CLIENT_PID 2>/dev/null
            exit 0
        }
        trap cleanup INT
        wait $SERVER_PID $CLIENT_PID
        ;;

    stop)
        # Kill processes (silent)
        for port in $SERVER_PORT $CLIENT_PORT; do
            if [[ "$OSTYPE" == "darwin"* ]]; then
                PIDS=$(lsof -ti :$port 2>/dev/null)
            else
                PIDS=$(lsof -ti :$port 2>/dev/null || fuser -n tcp $port 2>/dev/null | awk '{print $2}')
            fi
            [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null
        done

        # Kill remaining bun processes
        ps aux | grep -E "bun.*(WazuhDashboard)" | grep -v grep | awk '{print $2}' | while read PID; do
            [ -n "$PID" ] && kill -9 $PID 2>/dev/null
        done

        echo "Wazuh Dashboard stopped"
        ;;

    restart)
        echo "Restarting..."
        "$0" stop 2>/dev/null
        sleep 1
        exec "$0" start
        ;;

    status)
        if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "Running at http://localhost:$CLIENT_PORT"
        else
            echo "Not running"
        fi
        ;;

    *)
        echo "Usage: manage.sh {start|stop|restart|status}"
        exit 1
        ;;
esac
