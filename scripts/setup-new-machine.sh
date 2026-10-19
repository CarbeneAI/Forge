#!/bin/bash
# ===========================================
# PAI New Machine Setup Script
# ===========================================
# Run this script on a new machine after cloning Forge
#
# Usage:
#   git clone https://github.com/CarbeneAI/Forge.git ~/Forge
#   bash ~/Forge/scripts/setup-new-machine.sh
# ===========================================

set -e  # Exit on error

echo "=============================================="
echo "  PAI New Machine Setup"
echo "=============================================="
echo ""

FORGE_REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
CLAUDE_DIR="$HOME/.claude"

# -------------------------------------------
# Step 1: Verify checkout configuration exists
# -------------------------------------------
echo "[1/9] Checking checkout configuration..."
if [ ! -d "$FORGE_REPO_DIR/.claude" ]; then
    echo "ERROR: Checkout configuration not found at $FORGE_REPO_DIR/.claude"
    echo "Run this script from a complete Forge checkout."
    exit 1
fi
echo "  OK: Checkout configuration found at $FORGE_REPO_DIR/.claude"

# -------------------------------------------
# Step 2: Handle existing .claude directory
# -------------------------------------------
echo ""
echo "[2/9] Configuring ~/.claude symlink..."

if [ -L "$CLAUDE_DIR" ]; then
    # It's already a symlink
    current_target=$(readlink "$CLAUDE_DIR")
    if [ "$current_target" = "$FORGE_REPO_DIR/.claude" ]; then
        echo "  OK: Symlink already correctly configured"
    else
        echo "  Updating symlink from $current_target to $FORGE_REPO_DIR/.claude"
        rm "$CLAUDE_DIR"
        ln -s "$FORGE_REPO_DIR/.claude" "$CLAUDE_DIR"
        echo "  OK: Symlink updated"
    fi
elif [ -d "$CLAUDE_DIR" ]; then
    # It's a directory - back it up
    backup_dir="$HOME/.claude.backup.$(date +%Y%m%d_%H%M%S)"
    echo "  Found existing ~/.claude directory"
    echo "  Backing up to: $backup_dir"
    mv "$CLAUDE_DIR" "$backup_dir"
    ln -s "$FORGE_REPO_DIR/.claude" "$CLAUDE_DIR"
    echo "  OK: Backed up old directory and created symlink"
    echo ""
    echo "  NOTE: Check $backup_dir for any files you want to migrate"
elif [ -e "$CLAUDE_DIR" ]; then
    # It's something else (file?)
    echo "  ERROR: ~/.claude exists but is not a directory or symlink"
    echo "  Please remove it manually and re-run this script"
    exit 1
else
    # Doesn't exist - create symlink
    ln -s "$FORGE_REPO_DIR/.claude" "$CLAUDE_DIR"
    echo "  OK: Created symlink ~/.claude -> $FORGE_REPO_DIR/.claude"
fi

# -------------------------------------------
# Step 3: Create .env file from template
# -------------------------------------------
echo ""
echo "[3/9] Setting up environment file..."

ENV_FILE="$FORGE_REPO_DIR/.claude/.env"
ENV_EXAMPLE="$FORGE_REPO_DIR/.claude/.env.example"

if [ -L "$ENV_FILE" ]; then
    echo "ERROR: .env destination must be a regular file, not a symlink" >&2
    exit 1
elif [ -e "$ENV_FILE" ]; then
    if [ ! -f "$ENV_FILE" ]; then
        echo "ERROR: .env destination exists but is not a regular file" >&2
        exit 1
    fi
    echo "  OK: .env file already exists"
else
    # Build privately beside the destination, then link it into place. mktemp
    # creates mode 600 under umask 077, and link fails atomically if another path
    # appears at ENV_FILE, including a symlink or directory. This never follows it.
    if ! ENV_TEMP=$(umask 077 && mktemp "$ENV_FILE.tmp.XXXXXX"); then
        echo "ERROR: Could not create a private temporary .env file" >&2
        exit 1
    fi

    if [ -f "$ENV_EXAMPLE" ]; then
        ENV_SOURCE="template"
        if ! cat "$ENV_EXAMPLE" > "$ENV_TEMP"; then
            rm -f "$ENV_TEMP" || true
            echo "ERROR: Could not copy the .env template" >&2
            exit 1
        fi
    else
        ENV_SOURCE="minimal"
        if ! cat > "$ENV_TEMP" << 'EOF'
# PAI Environment Variables
# Add your API keys here

# Research APIs
# PERPLEXITY_API_KEY=your_key_here
# GOOGLE_API_KEY=your_key_here
EOF
        then
            rm -f "$ENV_TEMP" || true
            echo "ERROR: Could not write the minimal .env template" >&2
            exit 1
        fi
    fi

    if ! link "$ENV_TEMP" "$ENV_FILE"; then
        rm -f "$ENV_TEMP" || true
        echo "ERROR: Could not create .env safely; check its parent directory and destination" >&2
        exit 1
    fi
    if ! rm -f "$ENV_TEMP"; then
        echo "ERROR: .env was created, but its temporary name could not be removed" >&2
        exit 1
    fi

    if [ "$ENV_SOURCE" = "template" ]; then
        echo "  Created .env from template"
    else
        echo "  WARNING: No .env.example found, created a minimal .env"
    fi
    echo "  IMPORTANT: Edit $ENV_FILE to add your API keys"
fi

# -------------------------------------------
# Step 4: Install Bun (if not installed)
# -------------------------------------------
echo ""
echo "[4/9] Checking Bun installation..."

if command -v bun &> /dev/null; then
    echo "  OK: Bun is installed ($(bun --version))"
else
    echo "  Bun not found. Installing..."

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - try Homebrew first
        if command -v brew &> /dev/null; then
            brew install oven-sh/bun/bun
        else
            curl -fsSL https://bun.sh/install | bash
        fi
    else
        # Linux
        curl -fsSL https://bun.sh/install | bash
    fi

    # Source the new bun installation
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    if command -v bun &> /dev/null; then
        echo "  OK: Bun installed successfully ($(bun --version))"
    else
        echo "  WARNING: Bun installation may require restarting your terminal"
    fi
fi

# -------------------------------------------
# Step 5: Configure the existing runtime setting with Bun's JSON parser
# -------------------------------------------
echo ""
echo "[5/9] Configuring PAI_DIR in settings.json..."
if ! command -v bun > /dev/null 2>&1; then
    echo "ERROR: Bun is required to update settings.json. Install Bun, then rerun setup." >&2
    exit 1
fi
# Bun normalizes backslashes in an entrypoint filename. Read the trusted helper
# through shell redirection so valid Unix checkout paths remain literal.
bun --no-env-file run - "$FORGE_REPO_DIR/.claude/settings.json" "$HOME/.claude" \
    < "$FORGE_REPO_DIR/scripts/configure-settings.mjs"

# -------------------------------------------
# Step 6: Setup shell aliases
# -------------------------------------------
echo ""
echo "[6/9] Setting up shell aliases..."

ALIAS_FILE="$FORGE_REPO_DIR/scripts/pai-aliases.sh"
# Bash %q produces a source path safe for both Bash and Zsh rc files.
printf -v QUOTED_ALIAS_FILE '%q' "$ALIAS_FILE"
SHELL_RC=""

# Detect shell
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && [ -f "$ALIAS_FILE" ]; then
    # Check if already sourced
    if grep -q "pai-aliases.sh" "$SHELL_RC" 2>/dev/null; then
        echo "  OK: Aliases already configured in $SHELL_RC"
    else
        echo "" >> "$SHELL_RC"
        echo "# PAI aliases" >> "$SHELL_RC"
        printf '[ -f %s ] && source %s\n' "$QUOTED_ALIAS_FILE" "$QUOTED_ALIAS_FILE" >> "$SHELL_RC"
        echo "  OK: Added alias source to $SHELL_RC"
    fi
else
    echo "  WARNING: Could not detect shell config file"
    echo "  Manually add this line to your shell config:"
    echo "    source $QUOTED_ALIAS_FILE"
fi

# -------------------------------------------
# Step 7: Create local directories (not synced)
# -------------------------------------------
echo ""
echo "[7/9] Creating local directories..."

mkdir -p "$FORGE_REPO_DIR/.claude/history/sessions"
mkdir -p "$FORGE_REPO_DIR/.claude/history/learnings"
mkdir -p "$FORGE_REPO_DIR/.claude/history/raw-outputs"
echo "  OK: Created history directories"

# -------------------------------------------
# Step 8: Build PyRIT venv (for AI red-teaming skill)
# -------------------------------------------
echo ""
echo "[8/9] Setting up PyRIT (AI red-teaming)..."

PYRIT_DIR="$FORGE_REPO_DIR/.claude/skills/PyRIT"
if [ -d "$PYRIT_DIR" ]; then
    # A directory alone can be left behind by an interrupted package install.
    # Read package metadata without importing or running PyRIT itself.
    pyrit_is_installed() {
        local pyrit_python="$PYRIT_DIR/venv/bin/python"
        [ -x "$pyrit_python" ] || return 1
        "$pyrit_python" -I -c \
            'from importlib.metadata import version; version("pyrit")' \
            > /dev/null 2>&1
    }

    pyrit_install_with_uv() {
        if [ ! -d "$PYRIT_DIR/venv" ]; then
            (cd "$PYRIT_DIR" && uv venv --python 3.13 venv) || return 1
        fi
        local pyrit_python="$PYRIT_DIR/venv/bin/python"
        [ -x "$pyrit_python" ] || return 1
        (cd "$PYRIT_DIR" && uv pip install --python "$pyrit_python" pyrit) || return 1
        pyrit_is_installed
    }

    pyrit_install_with_python() {
        if [ ! -d "$PYRIT_DIR/venv" ]; then
            (cd "$PYRIT_DIR" && python3.13 -m venv venv) || return 1
        fi
        local pyrit_python="$PYRIT_DIR/venv/bin/python"
        [ -x "$pyrit_python" ] || return 1
        "$pyrit_python" -I -m pip install pyrit || return 1
        pyrit_is_installed
    }

    if pyrit_is_installed; then
        echo "  OK: PyRIT package is installed in its virtual environment"
    elif command -v uv > /dev/null 2>&1; then
        if [ -d "$PYRIT_DIR/venv" ]; then
            echo "  Existing PyRIT environment is incomplete; retrying package install..."
        else
            echo "  Building PyRIT venv with uv (Python 3.13)..."
        fi
        if pyrit_install_with_uv; then
            echo "  OK: PyRIT installed (run: ~/.claude/skills/PyRIT/tools/run-pyrit.sh version)"
        else
            echo "  WARNING: PyRIT setup did not complete. Setup will continue; inspect the error and rerun this installer." >&2
        fi
    elif command -v python3.13 > /dev/null 2>&1; then
        if [ -d "$PYRIT_DIR/venv" ]; then
            echo "  Existing PyRIT environment is incomplete; retrying package install..."
        else
            echo "  Building PyRIT venv with python3.13..."
        fi
        if pyrit_install_with_python; then
            echo "  OK: PyRIT installed"
        else
            echo "  WARNING: PyRIT setup did not complete. Setup will continue; inspect the error and rerun this installer." >&2
        fi
    elif [ -d "$PYRIT_DIR/venv" ]; then
        echo "  WARNING: Existing PyRIT environment is incomplete, and neither uv nor python3.13 is available. Install one and rerun setup." >&2
    else
        echo "  SKIP: uv or python3.13 not found. Install one to set up the PyRIT skill."
    fi
else
    echo "  SKIP: PyRIT skill not present"
fi

# -------------------------------------------
# Step 9: Verify setup
# -------------------------------------------
echo ""
echo "[9/9] Verifying setup..."
echo ""

# Check symlink
if [ -L "$CLAUDE_DIR" ] && [ "$(readlink "$CLAUDE_DIR")" = "$FORGE_REPO_DIR/.claude" ]; then
    echo "  [OK] ~/.claude symlink configured correctly"
else
    echo "  [!!] ~/.claude symlink issue"
fi

# Check .env
if [ -f "$ENV_FILE" ]; then
    echo "  [OK] .env file exists"
else
    echo "  [!!] .env file missing"
fi

# Check bun
if command -v bun &> /dev/null; then
    echo "  [OK] Bun installed"
else
    echo "  [!!] Bun not in PATH (may need terminal restart)"
fi

# Check git
if [ -d "$FORGE_REPO_DIR/.git" ]; then
    echo "  [OK] Git repository configured"
else
    echo "  [!!] Not a git repository"
fi

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit your API keys:"
printf '   nano %q\n' "$ENV_FILE"
echo ""
echo "2. Restart your terminal or run:"
printf '   source %q\n' "$SHELL_RC"
echo ""
echo "3. Test the setup:"
echo "   pai-check"
echo ""
echo "4. Pull latest changes:"
echo "   pai-pull"
echo ""
