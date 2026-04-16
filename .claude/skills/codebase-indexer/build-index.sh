#!/bin/bash
# Codebase Indexer - Build Initial Index
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

# Supported file extensions
CODE_EXTS=("ts" "tsx" "js" "jsx" "py" "go" "rs" "java" "c" "cpp" "h" "cs" "php" "rb" "swift" "kt" "scala")

# Check if we should skip this directory
should_skip_dir() {
    local dir="$1"
    local basename=$(basename "$dir")

    # Skip common directories to ignore
    case "$basename" in
        node_modules|vendor|target|build|dist|out|.git|.idea|__pycache__|.venv|venv)
            return 0
            ;;
    esac

    # Check for .gitignore patterns
    if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        # Simple check - could be improved with proper gitignore parsing
        while IFS= read -r pattern; do
            if [[ "$basename" == $pattern ]]; then
                return 0
            fi
        done < "$PROJECT_ROOT/.gitignore"
    fi

    return 1
}

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

# Extract concepts from a file
extract_concepts() {
    local file="$1"
    local concepts=()

    # Get relative path from project root
    local rel_path="${file#$PROJECT_ROOT/}"
    local dir_name=$(dirname "$rel_path")
    local file_name=$(basename "$rel_path")

    # Extract from directory names
    IFS='/' read -ra dirs <<< "$dir_name"
    for dir in "${dirs[@]}"; do
        if [ -n "$dir" ] && [ "$dir" != "." ]; then
            concepts+=("$dir")
        fi
    done

    # Extract from filename
    local base_name="${file_name%.*}"
    [[ -n "$base_name" ]] && concepts+=("$base_name")

    # Extract from file content (exports, classes, functions)
    case "${file##*.}" in
        ts|tsx|js|jsx)
            # Extract exports, class, function declarations
            concepts+=($(grep -oE '\b(export\s+)?(class|function|const|let|var)\s+[A-Z][a-zA-Z0-9]*' "$file" 2>/dev/null | sed 's/export\s*//g' | sed 's/class\s*//g' | sed 's/function\s*//g' | sed 's/const\s*//g' | sed 's/let\s*//g' | sed 's/var\s*//g' | grep -oE '[A-Z][a-zA-Z0-9]*' || true))
            ;;
        py)
            # Extract class and function definitions
            concepts+=($(grep -oE '^(class|def)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/class\s*//g' | sed 's/def\s*//g' || true))
            ;;
        go)
            # Extract type, function, interface declarations
            concepts+=($(grep -oE '^(type|func|interface)\s+[A-Z][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/type\s*//g' | sed 's/func\s*//g' | sed 's/interface\s*//g' || true))
            ;;
        rs)
            # Extract struct, fn, impl, trait declarations
            concepts+=($(grep -oE '^(struct|fn|impl|trait|enum|mod)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/struct\s*//g' | sed 's/fn\s*//g' | sed 's/impl\s*//g' | sed 's/trait\s*//g' | sed 's/enum\s*//g' | sed 's/mod\s*//g' || true))
            ;;
    esac

    # Extract from imports/requires
    case "${file##*.}" in
        ts|tsx|js|jsx)
            # Extract import paths
            import_concepts=$(grep -oE 'from\s+["\x27][^"\x27]+["\x27]' "$file" 2>/dev/null | sed 's/from\s*//g' | sed 's/["\x27]//g' | grep -oE '[a-zA-Z][a-zA-Z0-9/_-]*' | tail -1 || true)
            [[ -n "$import_concepts" ]] && concepts+=("$import_concepts")
            ;;
        py)
            # Extract import module names
            import_concepts=$(grep -oE '^(import|from)\s+[a-zA-Z_][a-zA-Z0-9_.]*' "$file" 2>/dev/null | sed 's/import\s*//g' | sed 's/from\s*//g' || true)
            [[ -n "$import_concepts" ]] && concepts+=("$import_concepts")
            ;;
    esac

    # Extract from comments/docstrings (lines starting with #, //, /*, *)
    case "${file##*.}" in
        ts|tsx|js|jsx|go|rs|c|cpp|cs|java)
            comment_concepts=$(grep -oE '(/\*|//|#)\s*[A-Z][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/^\/\*\s*//g' | sed 's/^\/\/\s*//g' | sed 's/^#\s*//g' | grep -oE '[A-Z][a-zA-Z0-9_]{3,}' | head -5 || true)
            ;;
        py)
            comment_concepts=$(grep -oE '^\s*#\s*[A-Z][a-zA-Z0-9_]{3,}' "$file" 2>/dev/null | sed 's/^\s*#\s*//g' | head -5 || true)
            ;;
    esac

    # Combine and deduplicate
    printf '%s\n' "${concepts[@]}" "${comment_concepts[@]}" | grep -vE '^[0-9]+$' | sort -u | grep -vE '^(if|else|for|while|return|import|export|from|class|function|const|let|var|def|type|struct|fn|impl|trait|enum|mod)$'
}

# Generate a simple summary for a file
generate_summary() {
    local file="$1"
    local line_count=$(wc -l < "$file")
    local ext="${file##*.}"

    # Get first few meaningful lines
    case "$ext" in
        ts|tsx|js|jsx|py|go|rs)
            # Get first non-comment, non-import lines
            summary=$(grep -vE '^\s*(//|#|/\*|\*)' "$file" | grep -vE '^\s*(import|from|export|package|use)' | head -3 | tr '\n' ' ' | cut -c1-200)
            ;;
        *)
            summary=$(head -10 "$file" | tr '\n' ' ' | cut -c1-200)
            ;;
    esac

    if [ -z "$summary" ]; then
        summary="$ext source file ($line_count lines)"
    fi

    echo "$summary"
}

# Calculate token estimate
estimate_tokens() {
    local file="$1"
    local words=$(wc -w < "$file")
    # Rough estimate: ~1.3 tokens per word for code
    echo $((words * 13 / 10))
}

# Main indexing function
build_index() {
    print_status "Building codebase index for: $PROJECT_ROOT"

    # Check if project root exists
    if [ ! -d "$PROJECT_ROOT" ]; then
        print_error "Project root does not exist: $PROJECT_ROOT"
        exit 1
    fi

    # Initialize JSON structure
    cat > "$INDEX_FILE" << 'EOF'
{
  "version": "1.0",
  "last_updated": "PLACEHOLDER",
  "project_root": "PLACEHOLDER",
  "concepts": {},
  "file_summaries": {}
}
EOF

    # Arrays to collect data
    local -A concept_files
    local -A file_concepts
    local -A file_data
    local file_count=0

    print_status "Scanning project files..."

    # Find all code files
    while IFS= read -r -d '' file; do
        # Check if we should skip the parent directory
        local dir=$(dirname "$file")
        if should_skip_dir "$dir"; then
            continue
        fi

        if should_index_file "$file"; then
            # Get relative path
            local rel_path="${file#$PROJECT_ROOT/}"

            print_status "  Indexing: $rel_path"

            # Extract concepts
            local concepts=()
            while IFS= read -r concept; do
                [[ -n "$concept" ]] && concepts+=("$concept")
            done < <(extract_concepts "$file")

            # Generate summary
            local summary=$(generate_summary "$file")
            local tokens=$(estimate_tokens "$file")
            local line_count=$(wc -l < "$file")

            # Extract exports/imports based on file type
            local exports="[]"
            local imports="[]"
            case "${file##*.}" in
                ts|tsx|js|jsx)
                    exports=$(grep -oE 'export\s+(default\s+)?(class|function|const|let|var)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/export\s*//g' | sed 's/default\s*//g' | sed 's/\s\s*/ /g' | jq -R . | jq -s .)
                    imports=$(grep -oE 'import.*from\s+["\x27][^"\x27]+["\x27]' "$file" 2>/dev/null | sed 's/import\s*//g' | sed 's/.*from\s*//g' | sed 's/["\x27]//g' | jq -R . | jq -s .)
                    ;;
                py)
                    exports=$(grep -oE '^def\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" 2>/dev/null | sed 's/def\s*//g' | jq -R . | jq -s .)
                    imports=$(grep -oE '^(import|from)\s+[a-zA-Z_][a-zA-Z0-9_.]*' "$file" 2>/dev/null | sed 's/import\s*//g' | sed 's/from\s*//g' | jq -R . | jq -s .)
                    ;;
            esac

            # Store file data - escape summary with jq
            local escaped_summary=$(echo "$summary" | jq -Rs .)
            file_data["$rel_path"]="{\"concepts\":$(printf '%s\n' "${concepts[@]}" | jq -R . | jq -s .), \"exports\":$exports, \"imports\":$imports, \"line_count\":$line_count, \"token_estimate\":$tokens, \"summary\":$escaped_summary}"

            # Map concepts to files
            for concept in "${concepts[@]}"; do
                if [ -n "${concept_files[$concept]+x}" ]; then
                    concept_files[$concept]="${concept_files[$concept]}, \"$rel_path\""
                else
                    concept_files[$concept]="\"$rel_path\""
                fi
            done

            file_count=$((file_count + 1))
        fi
    done < <(find "$PROJECT_ROOT" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.c" -o -name "*.cpp" -o -name "*.h" -o -name "*.cs" -o -name "*.php" -o -name "*.rb" -o -name "*.swift" -o -name "*.kt" -o -name "*.scala" \) -print0 2>/dev/null)

    # Build JSON output
    print_status "Building index JSON..."

    local concepts_json="{"
    local first=1
    for concept in "${!concept_files[@]}"; do
        if [ $first -eq 0 ]; then
            concepts_json="$concepts_json,"
        fi
        concepts_json="$concepts_json\"$concept\":{\"files\":[${concept_files[$concept]}],\"related_concepts\":[],\"summary\":\"$concept-related code\"}"
        first=0
    done
    concepts_json="$concepts_json}"

    local summaries_json="{"
    first=1
    for rel_path in "${!file_data[@]}"; do
        if [ $first -eq 0 ]; then
            summaries_json="$summaries_json,"
        fi
        summaries_json="$summaries_json\"$rel_path\":${file_data[$rel_path]}"
        first=0
    done
    summaries_json="$summaries_json}"

    # Write final JSON
    cat > "$INDEX_FILE" << EOF
{
  "version": "1.0",
  "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_root": "$PROJECT_ROOT",
  "total_files": $file_count,
  "concepts": $concepts_json,
  "file_summaries": $summaries_json
}
EOF

    print_success "Index built successfully!"
    print_success "  - Files indexed: $file_count"
    print_success "  - Concepts found: ${#concept_files[@]}"
    print_success "  - Index saved to: $INDEX_FILE"
}

# Run main function
build_index

# Show some statistics
echo ""
print_status "Index Statistics:"
if command -v jq &> /dev/null; then
    echo "  Total Files: $(jq '.total_files' "$INDEX_FILE")"
    echo "  Total Concepts: $(jq '.concepts | length' "$INDEX_FILE")"
    echo "  Last Updated: $(jq -r '.last_updated' "$INDEX_FILE")"
else
    echo "  (Install jq for detailed statistics)"
fi
