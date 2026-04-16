#!/bin/bash
# Codebase Indexer - Show Concept Map
# Part of Chippery framework for semantic codebase navigation

set -e

# Configuration
PROJECT_ROOT="${1:-$(pwd)}"
CONCEPT="${2:-}"
INDEX_FILE="$PROJECT_ROOT/.codebase-index.json"
LOG_FILE="$HOME/.claude/logs/codebase-indexer.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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
        print_error "jq is required for this functionality"
        print_status "Install with: sudo apt-get install jq / brew install jq"
        exit 1
    fi
}

# Show concept map for a specific concept
show_concept_map() {
    local concept="$1"

    print_status "Concept Map for: ${MAGENTA}$concept${NC}"
    echo ""

    # Get concept data
    local files=$(jq -r ".concepts.\"$concept\".files[]" "$INDEX_FILE" 2>/dev/null)
    local summary=$(jq -r ".concepts.\"$concept\".summary" "$INDEX_FILE" 2>/dev/null)
    local related=$(jq -r ".concepts.\"$concept\".related_concepts[]" "$INDEX_FILE" 2>/dev/null)

    if [ -z "$files" ]; then
        print_warning "Concept '$concept' not found in index"
        echo ""
        print_status "Did you mean one of these?"
        jq -r '.concepts | keys[]' "$INDEX_FILE" 2>/dev/null | grep -i "$concept" | head -10 | while read -r match; do
            echo "  - $match"
        done
        return 1
    fi

    # Print summary
    if [ -n "$summary" ] && [ "$summary" != "null" ]; then
        echo -e "${CYAN}Summary:${NC} $summary"
        echo ""
    fi

    # Print files
    echo -e "${CYAN}Files implementing this concept:${NC}"
    local count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            count=$((count + 1))
            echo -e "  ${GREEN}$count.${NC} $file"

            # Show file details
            local line_count=$(jq -r ".file_summaries.\"$file\".line_count" "$INDEX_FILE" 2>/dev/null)
            local tokens=$(jq -r ".file_summaries.\"$file\".token_estimate" "$INDEX_FILE" 2>/dev/null)
            local file_summary=$(jq -r ".file_summaries.\"$file\".summary" "$INDEX_FILE" 2>/dev/null)
            local file_concepts=$(jq -r ".file_summaries.\"$file\".concepts[]" "$INDEX_FILE" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

            if [ -n "$line_count" ] && [ "$line_count" != "null" ]; then
                echo -e "     ${YELLOW}Lines:${NC} $line_count | ${YELLOW}Tokens:${NC} $tokens"
            fi

            if [ -n "$file_concepts" ] && [ "$file_concepts" != "null" ]; then
                echo -e "     ${YELLOW}Other concepts:${NC} $file_concepts"
            fi

            if [ -n "$file_summary" ] && [ "$file_summary" != "null" ]; then
                echo -e "     ${CYAN}$file_summary${NC}"
            fi
        fi
    done <<< "$files"

    echo ""

    # Print related concepts
    if [ -n "$related" ] && [ "$related" != "null" ]; then
        echo -e "${CYAN}Related concepts:${NC}"
        echo "$related" | while read -r rel; do
            echo -e "  • $rel"
        done
        echo ""
    fi

    # Find related concepts based on file overlap
    print_status "Finding related concepts by file overlap..."
    echo ""

    declare -A related_scores
    declare -A related_files

    while IFS= read -r file; do
        if [ -n "$file" ]; then
            # Get other concepts in this file
            local other_concepts=$(jq -r ".file_summaries.\"$file\".concepts[]" "$INDEX_FILE" 2>/dev/null)
            while IFS= read -r other; do
                if [ -n "$other" ] && [ "$other" != "$concept" ]; then
                    # Increment score
                    if [ -n "${related_scores[$other]+x}" ]; then
                        related_scores[$other]=$((${related_scores[$other]} + 1))
                    else
                        related_scores[$other]=1
                    fi
                    # Add file to list
                    if [ -z "${related_files[$other]+x}" ]; then
                        related_files[$other]="$file"
                    fi
                fi
            done <<< "$other_concepts"
        fi
    done <<< "$files"

    # Sort by score and display
    if [ ${#related_scores[@]} -gt 0 ]; then
        echo -e "${CYAN}Concepts often found together:${NC}"
        for other in "${!related_scores[@]}"; do
            local score=${related_scores[$other]}
            echo -e "  ${YELLOW}▸${NC} $other ${GREEN}(found together in $score file(s))${NC}"
        done
    fi
}

# Show all concepts
list_all_concepts() {
    print_status "All concepts in codebase:"
    echo ""

    if ! command -v jq &> /dev/null; then
        print_error "jq is required for this functionality"
        exit 1
    fi

    local count=0
    jq -r '.concepts | keys[]' "$INDEX_FILE" 2>/dev/null | sort | while read -r concept; do
        count=$((count + 1))
        local file_count=$(jq ".concepts.\"$concept\".files | length" "$INDEX_FILE" 2>/dev/null)
        printf "  ${GREEN}%3d.${NC} %-40s ${CYAN}(%d file(s))${NC}\n" "$count" "$concept" "$file_count"
    done

    echo ""
    local total=$(jq '.concepts | length' "$INDEX_FILE" 2>/dev/null)
    print_success "Total concepts: $total"
}

# Main function
main() {
    check_index

    if [ -z "$CONCEPT" ]; then
        list_all_concepts
    else
        show_concept_map "$CONCEPT"
    fi
}

main
