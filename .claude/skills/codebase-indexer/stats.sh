#!/bin/bash
# Codebase Indexer - Show Statistics
# Part of Chippery framework for semantic codebase navigation

set -e

# Configuration
PROJECT_ROOT="${1:-$(pwd)}"
INDEX_FILE="$PROJECT_ROOT/.codebase-index.json"
LOG_FILE="$HOME/.claude/logs/codebase-indexer.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Print colored output
print_status() {
    echo -e "${BLUE}[Chippery]${NC} $1"
    log "$1"
}

print_success() {
    echo -e "${GREEN}[Chippery]${NC} $1"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}[Chippery]${NC} $1"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}[Chippery]${NC} $1"
    log "ERROR: $1"
}

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Check if index exists
check_index() {
    if [ ! -f "$INDEX_FILE" ]; then
        print_error "No index found at $INDEX_FILE"
        print_status "Run 'build-index.sh' first to create the index"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_error "jq is required for statistics"
        print_status "Install with: sudo apt-get install jq / brew install jq"
        exit 1
    fi
}

# Format large numbers
format_number() {
    local num=$1
    if [ $num -ge 1000000 ]; then
        awk "BEGIN {printf \"%.1fM\", $num / 1000000}"
    elif [ $num -ge 1000 ]; then
        awk "BEGIN {printf \"%.1fK\", $num / 1000}"
    else
        echo $num
    fi
}

# Show main statistics
show_stats() {
    echo ""
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║          Chippery Codebase Index Statistics                 ║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Basic info
    local version=$(jq -r '.version' "$INDEX_FILE" 2>/dev/null)
    local updated=$(jq -r '.last_updated' "$INDEX_FILE" 2>/dev/null)
    local project_root=$(jq -r '.project_root' "$INDEX_FILE" 2>/dev/null)

    echo -e "${BOLD}${CYAN}📁 Index Information${NC}"
    echo -e "   ${YELLOW}Version:${NC}         $version"
    echo -e "   ${YELLOW}Project Root:${NC}    $project_root"
    echo -e "   ${YELLOW}Last Updated:${NC}    $updated"
    echo ""

    # File statistics
    local total_files=$(jq '.total_files' "$INDEX_FILE" 2>/dev/null)
    local total_concepts=$(jq '.concepts | length' "$INDEX_FILE" 2>/dev/null)

    echo -e "${BOLD}${CYAN}📊 Overall Statistics${NC}"
    echo -e "   ${YELLOW}Total Files:${NC}     $(format_number $total_files)"
    echo -e "   ${YELLOW}Total Concepts:${NC}  $(format_number $total_concepts)"
    echo ""

    # Calculate token statistics
    local total_tokens=$(jq '[.file_summaries[] | .token_estimate] | add' "$INDEX_FILE" 2>/dev/null)
    local total_lines=$(jq '[.file_summaries[] | .line_count] | add' "$INDEX_FILE" 2>/dev/null)
    local avg_tokens_per_file=$(awk "BEGIN {printf \"%.0f\", $total_tokens / $total_files}")

    echo -e "${BOLD}${CYAN}📏 Token Statistics${NC}"
    echo -e "   ${YELLOW}Total Tokens:${NC}    $(format_number $total_tokens)"
    echo -e "   ${YELLOW}Total Lines:${NC}     $(format_number $total_lines)"
    echo -e "   ${YELLOW}Avg Tokens/File:${NC} $avg_tokens_per_file"
    echo ""

    # Calculate potential token savings
    local full_read_tokens=$total_tokens
    local index_read_tokens=2000  # Rough estimate for reading index
    local savings_percent=$(awk "BEGIN {printf \"%.0f\", ($full_read_tokens - $index_read_tokens) * 100 / $full_read_tokens}")

    echo -e "${BOLD}${CYAN}💰 Token Efficiency${NC}"
    echo -e "   ${GREEN}Full codebase read:${NC}   $(format_number $full_read_tokens) tokens"
    echo -e "   ${GREEN}Index-based query:${NC}    ~$(format_number $index_read_tokens) tokens"
    echo -e "   ${BOLD}${MAGENTA}Potential savings:${NC}     ~${savings_percent}%${NC}"
    echo ""

    # Top concepts by file count
    echo -e "${BOLD}${CYAN}🏆 Top Concepts (by file count)${NC}"
    echo ""

    jq -r '.concepts | to_entries[] | select(.value.files | length > 0) | "\(.key)|\(.value.files | length)"' "$INDEX_FILE" 2>/dev/null | \
        sort -t'|' -k2 -rn | head -10 | while IFS='|' read -r concept count; do
        printf "   ${GREEN}%2d.${NC} %-35s ${CYAN}(%d file(s))${NC}\n" "$((++i))" "$concept" "$count"
    done
    echo ""

    # Largest files
    echo -e "${BOLD}${CYAN}📦 Largest Files (by tokens)${NC}"
    echo ""

    jq -r '.file_summaries | to_entries[] | "\(.key)|\(.value.token_estimate)|\(.value.line_count)"' "$INDEX_FILE" 2>/dev/null | \
        sort -t'|' -k2 -rn | head -10 | while IFS='|' read -r file tokens lines; do
        printf "   ${GREEN}%2d.${NC} %-50s ${CYAN}(%s tokens, %s lines)${NC}\n" "$((++i))" "$file" "$(format_number $tokens)" "$(format_number $lines)"
    done
    echo ""

    # File type distribution
    echo -e "${BOLD}${CYAN}📄 File Type Distribution${NC}"
    echo ""

    declare -A ext_counts
    jq -r '.file_summaries | keys[]' "$INDEX_FILE" 2>/dev/null | while read -r file; do
        local ext="${file##*.}"
        ext_counts[$ext]=$((${ext_counts[$ext]:-0} + 1))
    done

    for ext in $(echo "${!ext_counts[@]}" | sort); do
        printf "   ${YELLOW}%s${NC} %-15s ${CYAN}%d file(s)${NC}\n" "$ext" "" "${ext_counts[$ext]}"
    done
    echo ""

    # Completion message
    print_success "Statistics generated successfully"
    echo ""
    echo -e "${CYAN}Tip:${NC} Use 'search.sh <query>' to find files by concept"
    echo -e "${CYAN}Tip:${NC} Use 'concept-map.sh <concept>' to explore related code"
}

# Main function
main() {
    check_index
    show_stats
}

main
