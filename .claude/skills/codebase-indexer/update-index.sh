#!/bin/bash
# Codebase Indexer - Update Index Incrementally
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
        print_warning "No existing index found"
        print_status "Running full build instead..."
        exec "$(dirname "$0")/build-index.sh" "$PROJECT_ROOT"
    fi
}

# Get list of changed files using git
get_changed_files() {
    local changed_files=""

    # Check if we're in a git repository
    if git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
        # Get changed files since last commit
        changed_files=$(git -C "$PROJECT_ROOT" diff --name-only HEAD 2>/dev/null || true)

        # Also get untracked files
        untracked=$(git -C "$PROJECT_ROOT" ls-files --others --exclude-standard 2>/dev/null || true)
        if [ -n "$untracked" ]; then
            changed_files="$changed_files$untracked"
        fi
    else
        print_warning "Not a git repository, checking all files modified in last 10 minutes"
        # Fallback: find files modified recently
        changed_files=$(find "$PROJECT_ROOT" -type f -mmin -10 2>/dev/null || true)
    fi

    echo "$changed_files"
}

# Supported file extensions
CODE_EXTS=("ts" "tsx" "js" "jsx" "py" "go" "rs" "java" "c" "cpp" "h" "cs" "php" "rb" "swift" "kt" "scala")

# Check if file should be indexed
should_index_file() {
    local file="$1"
    local ext="${file##*.}"

    # Check if extension is supported
    for supported_ext in "${CODE_EXTS[@]}"; do
        if [ "$ext" = "$supported_ext" ]; then
            return 0
        fi
    done

    return 1
}

# Update index with changed files
update_index() {
    print_status "Checking for changed files..."

    local changed_files=$(get_changed_files)

    if [ -z "$changed_files" ]; then
        print_success "No changes detected"
        return 0
    fi

    local files_to_update=0
    local files_to_remove=0

    # Process changed files
    while IFS= read -r file; do
        if [ -z "$file" ]; then
            continue
        fi

        # Convert to full path if relative
        if [[ ! "$file" = /* ]]; then
            file="$PROJECT_ROOT/$file"
        fi

        # Check if file exists and should be indexed
        if [ -f "$file" ] && should_index_file "$file"; then
            print_status "  Updating: ${file#$PROJECT_ROOT/}"
            files_to_update=$((files_to_update + 1))
        elif [[ "$file" == $PROJECT_ROOT/* ]]; then
            # File was deleted
            print_status "  Removing: ${file#$PROJECT_ROOT/}"
            files_to_remove=$((files_to_remove + 1))
        fi
    done <<< "$changed_files"

    if [ $files_to_update -eq 0 ] && [ $files_to_remove -eq 0 ]; then
        print_success "No relevant code changes detected"
        return 0
    fi

    print_status "Rebuilding index with changes..."

    # For simplicity, just rebuild the entire index
    # A more sophisticated implementation would do true incremental updates
    if [ -x "$(dirname "$0")/build-index.sh" ]; then
        exec "$(dirname "$0")/build-index.sh" "$PROJECT_ROOT"
    else
        print_error "build-index.sh not found or not executable"
        exit 1
    fi
}

# Main function
main() {
    check_index
    update_index
}

main
