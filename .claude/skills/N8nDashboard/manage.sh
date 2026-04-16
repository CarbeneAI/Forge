#!/bin/bash

# N8n Dashboard Management Script
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SKILL_DIR/apps/server"
CLIENT_DIR="$SKILL_DIR/apps/client"

SERVER_PORT=4002
CLIENT_PORT=5174

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

start() {
    echo -e "${GREEN}Starting N8n Dashboard...${NC}"

    # Check for .env
    if [ ! -f ~/.claude/.env ]; then
        echo -e "${RED}Error: ~/.claude/.env not found${NC}"
        exit 1
    fi

    # Source environment
    set -a
    source ~/.claude/.env
    set +a

    # Check for API key
    if [ -z "$N8N_API_KEY" ]; then
        echo -e "${YELLOW}Warning: N8N_API_KEY not set in ~/.claude/.env${NC}"
        echo "Dashboard will not be able to fetch workflow data."
    fi

    # Start server
    cd "$SERVER_DIR"
    nohup bun run src/index.ts > /tmp/n8n-dashboard-server.log 2>&1 &
    echo $! > /tmp/n8n-dashboard-server.pid

    # Start client
    cd "$CLIENT_DIR"
    nohup bun run dev --port $CLIENT_PORT > /tmp/n8n-dashboard-client.log 2>&1 &
    echo $! > /tmp/n8n-dashboard-client.pid

    sleep 2
    echo -e "${GREEN}N8n Dashboard running at http://localhost:$CLIENT_PORT${NC}"
}

stop() {
    echo -e "${YELLOW}Stopping N8n Dashboard...${NC}"

    # Kill server
    if [ -f /tmp/n8n-dashboard-server.pid ]; then
        kill $(cat /tmp/n8n-dashboard-server.pid) 2>/dev/null
        rm /tmp/n8n-dashboard-server.pid
    fi

    # Kill client
    if [ -f /tmp/n8n-dashboard-client.pid ]; then
        kill $(cat /tmp/n8n-dashboard-client.pid) 2>/dev/null
        rm /tmp/n8n-dashboard-client.pid
    fi

    # Kill any remaining processes on ports
    fuser -k $SERVER_PORT/tcp 2>/dev/null
    fuser -k $CLIENT_PORT/tcp 2>/dev/null

    echo -e "${GREEN}N8n Dashboard stopped${NC}"
}

status() {
    echo "N8n Dashboard Status:"
    echo "===================="

    # Check server
    if curl -s http://localhost:$SERVER_PORT/health > /dev/null 2>&1; then
        echo -e "Server (port $SERVER_PORT): ${GREEN}Running${NC}"
    else
        echo -e "Server (port $SERVER_PORT): ${RED}Stopped${NC}"
    fi

    # Check client
    if curl -s http://localhost:$CLIENT_PORT > /dev/null 2>&1; then
        echo -e "Client (port $CLIENT_PORT): ${GREEN}Running${NC}"
    else
        echo -e "Client (port $CLIENT_PORT): ${RED}Stopped${NC}"
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
        stop
        sleep 1
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
