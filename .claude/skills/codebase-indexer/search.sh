#!/bin/bash
# Codebase Indexer - Semantic Search
# Part of Chippery framework for semantic codebase navigation

set -e

# Configuration
PROJECT_ROOT="${1:-$(pwd)}"
QUERY="${2:-}"
INDEX_FILE="$PROJECT_ROOT/.codebase-index.json"
LOG_FILE="$HOME/.claude/logs/codebase-indexer.log"
MAX_RESULTS="${MAX_RESULTS:-10}"

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

print_result() {
    echo -e "${CYAN}[Result]${NC} $1"
}

print_match() {
    echo -e "${MAGENTA}[Match]${NC} $1"
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
}

# Normalize query for matching
normalize_query() {
    local query="$1"
    # Convert to lowercase
    query=$(echo "$query" | tr '[:upper:]' '[:lower:]')
    # Remove special characters
    query=$(echo "$query" | sed 's/[^a-z0-9]/ /g')
    echo "$query"
}

# Calculate simple relevance score (can be enhanced with actual embeddings)
calculate_relevance() {
    local query="$1"
    local concept="$2"

    local query_norm=$(normalize_query "$query")
    local concept_norm=$(normalize_query "$concept")

    # Exact match
    if [[ "$query_norm" == "$concept_norm" ]]; then
        echo 1.0
        return
    fi

    # Contains match
    if [[ "$concept_norm" == *"$query_norm"* ]]; then
        echo 0.95
        return
    fi

    # Word overlap
    local query_words=($query_norm)
    local concept_words=($concept_norm)
    local matches=0

    for qw in "${query_words[@]}"; do
        for cw in "${concept_words[@]}"; do
            if [[ "$qw" == "$cw" ]]; then
                matches=$((matches + 1))
                break
            fi
        done
    done

    local total=${#query_words[@]}
    if [ $total -gt 0 ]; then
        awk "BEGIN {printf \"%.2f\", $matches / $total}"
    else
        echo "0.0"
    fi
}

# Search concepts
search_concepts() {
    local query="$1"

    if ! command -v jq &> /dev/null; then
        print_error "jq is required for search functionality"
        print_status "Install with: sudo apt-get install jq / brew install jq"
        exit 1
    fi

    # Get all concepts from index
    local concepts=$(jq -r '.concepts | keys[]' "$INDEX_FILE" 2>/dev/null)

    # Array to hold results
    declare -a results
    declare -a scores

    # Calculate relevance for each concept
    while IFS= read -r concept; do
        if [ -n "$concept" ]; then
            local score=$(calculate_relevance "$query" "$concept")
            # Filter out low scores
            if awk "BEGIN {exit !($score > 0.3)}"; then
                results+=("$concept")
                scores+=("$score")
            fi
        fi
    done <<< "$concepts"

    # Sort by score (descending)
    local count=${#results[@]}
    if [ $count -eq 0 ]; then
        return 1
    fi

    # Bubble sort by score (simple but works for small arrays)
    for ((i=0; i<count; i++)); do
        for ((j=0; j<count-i-1; j++)); do
            if awk "BEGIN {exit !(${scores[$j]} < ${scores[$j+1]})}"; then
                # Swap
                local temp_r="${results[$j]}"
                results[$j]="${results[$j+1]}"
                results[$j+1]="$temp_r"

                local temp_s="${scores[$j]}"
                scores[$j]="${scores[$j+1]}"
                scores[$j+1]="$temp_s"
            fi
        done
    done

    # Return results
    local num_results=${#results[@]}
    if [ $num_results -gt $MAX_RESULTS ]; then
        num_results=$MAX_RESULTS
    fi

    for ((i=0; i<num_results; i++)); do
        echo "${results[$i]}|${scores[$i]}"
    done

    return 0
}

# Display search results
display_results() {
    local query="$1"

    print_status "Searching for: ${MAGENTA}$query${NC}"
    echo ""

    # Search for matching concepts
    local matches
    matches=$(search_concepts "$query")

    if [ -z "$matches" ]; then
        print_warning "No matching concepts found"
        print_status "Try different keywords or run 'build-index.sh' to update the index"
        return 1
    fi

    local count=0
    while IFS='|' read -r concept score; do
        count=$((count + 1))

        # Get files for this concept
        local files=$(jq -r ".concepts.\"$concept\".files[]" "$INDEX_FILE" 2>/dev/null)
        local summary=$(jq -r ".concepts.\"$concept\".summary" "$INDEX_FILE" 2>/dev/null)

        # Print result header
        local score_pct=$(awk "BEGIN {printf \"%.0f\", $score * 100}")
        print_result "$count. $concept ${GREEN}(${score_pct}% match)${NC}"

        # Print summary if available
        if [ -n "$summary" ] && [ "$summary" != "null" ]; then
            echo -e "   ${CYAN}Summary:${NC} $summary"
        fi

        # Print files
        echo -e "   ${CYAN}Files:${NC}"
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                local file_summary=$(jq -r ".file_summaries.\"$file\".summary" "$INDEX_FILE" 2>/dev/null)
                local line_count=$(jq -r ".file_summaries.\"$file\".line_count" "$INDEX_FILE" 2>/dev/null)
                local tokens=$(jq -r ".file_summaries.\"$file\".token_estimate" "$INDEX_FILE" 2>/dev/null)

                echo -e "     ${YELLOW}▸${NC} $file"
                if [ -n "$line_count" ] && [ "$line_count" != "null" ]; then
                    echo -e "       Lines: $line_count | Tokens: $tokens"
                fi
                if [ -n "$file_summary" ] && [ "$file_summary" != "null" ]; then
                    echo -e "       ${CYAN}$file_summary${NC}"
                fi
            fi
        done <<< "$files"

        echo ""
    done <<< "$matches"

    print_success "Found $count matching concept(s)"
}

# Search files directly
search_files() {
    local query="$1"

    print_status "Searching files for: ${MAGENTA}$query${NC}"
    echo ""

    if ! command -v jq &> /dev/null; then
        print_error "jq is required for search functionality"
        exit 1
    fi

    # Get all files from index
    local files=$(jq -r '.file_summaries | keys[]' "$INDEX_FILE" 2>/dev/null)

    declare -a results
    declare -a scores

    local query_norm=$(normalize_query "$query")

    while IFS= read -r file; do
        if [ -n "$file" ]; then
            # Check filename
            local filename=$(basename "$file")
            local score=$(calculate_relevance "$query" "$filename")

            # Check concepts in file
            local file_concepts=$(jq -r ".file_summaries.\"$file\".concepts[]" "$INDEX_FILE" 2>/dev/null)
            while IFS= read -r concept; do
                local concept_score=$(calculate_relevance "$query" "$concept")
                if awk "BEGIN {exit !($concept_score > $score)}"; then
                    score=$concept_score
                fi
            done <<< "$file_concepts"

            if awk "BEGIN {exit !($score > 0.3)}"; then
                results+=("$file")
                scores+=("$score")
            fi
        fi
    done <<< "$files"

    # Sort and display
    local count=${#results[@]}
    if [ $count -eq 0 ]; then
        print_warning "No matching files found"
        return 1
    fi

    # Sort by score
    for ((i=0; i<count; i++)); do
        for ((j=0; j<count-i-1; j++)); do
            if awk "BEGIN {exit !(${scores[$j]} < ${scores[$j+1]})}"; then
                local temp_r="${results[$j]}"
                results[$j]="${results[$j+1]}"
                results[$j+1]="$temp_r"

                local temp_s="${scores[$j]}"
                scores[$j]="${scores[$j+1]}"
                scores[$j+1]="$temp_s"
            fi
        done
    done

    # Display results
    local num_results=${#results[@]}
    if [ $num_results -gt $MAX_RESULTS ]; then
        num_results=$MAX_RESULTS
    fi

    for ((i=0; i<num_results; i++)); do
        local file="${results[$i]}"
        local score="${scores[$i]}"
        local score_pct=$(awk "BEGIN {printf \"%.0f\", $score * 100}")

        local summary=$(jq -r ".file_summaries.\"$file\".summary" "$INDEX_FILE" 2>/dev/null)
        local line_count=$(jq -r ".file_summaries.\"$file\".line_count" "$INDEX_FILE" 2>/dev/null)
        local concepts=$(jq -r ".file_summaries.\"$file\".concepts[]" "$INDEX_FILE" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

        print_result "$((i+1)). $file ${GREEN}(${score_pct}% match)${NC}"
        echo -e "   ${CYAN}Concepts:${NC} $concepts"
        if [ -n "$summary" ] && [ "$summary" != "null" ]; then
            echo -e "   ${CYAN}Summary:${NC} $summary"
        fi
        echo ""
    done

    print_success "Found $num_results matching file(s)"
}

# Main function
main() {
    check_index

    if [ -z "$QUERY" ]; then
        print_error "Usage: $0 <project_root> <query>"
        echo ""
        echo "Examples:"
        echo "  $0 . 'authentication'"
        echo "  $0 . 'database connection'"
        echo "  $0 . 'user login flow'"
        exit 1
    fi

    display_results "$QUERY"
}

main
