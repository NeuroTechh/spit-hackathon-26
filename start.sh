#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

PIDS=()

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    wait
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

install_deps() {
    local dir="$1"
    local name="$2"
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}[$name] Installing dependencies...${NC}"
        (cd "$dir" && npm install)
    fi
}

# Install dependencies for all services
echo -e "${CYAN}=== Checking dependencies ===${NC}"
install_deps "$ROOT_DIR/hudson-frontend" "hudson-frontend"
install_deps "$ROOT_DIR/racepass-backend" "racepass-backend"
install_deps "$ROOT_DIR/attestation-service" "attestation-service"

echo ""
echo -e "${CYAN}=== Starting all services ===${NC}"
echo ""

# 1. Hudson Frontend (Next.js, default port 3000)
echo -e "${GREEN}[hudson-frontend]${NC} Starting Next.js dev server..."
(cd "$ROOT_DIR/hudson-frontend" && npx next dev) &
PIDS+=($!)

# 2. Racepass Backend (ts-node, port from .env or default)
echo -e "${GREEN}[racepass-backend]${NC} Starting with ts-node..."
(cd "$ROOT_DIR/racepass-backend" && npx ts-node src/app.ts) &
PIDS+=($!)

# 3. Attestation Service (ts-node, port from .env or default)
echo -e "${GREEN}[attestation-service]${NC} Starting with ts-node..."
(cd "$ROOT_DIR/attestation-service" && npx ts-node src/app.ts) &
PIDS+=($!)

echo ""
echo -e "${CYAN}=== All services started ===${NC}"
echo -e "  ${GREEN}hudson-frontend${NC}     - next dev (port 3000)"
echo -e "  ${GREEN}racepass-backend${NC}    - ts-node src/app.ts"
echo -e "  ${GREEN}attestation-service${NC} - ts-node src/app.ts"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

wait
