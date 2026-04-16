#!/bin/bash
# ===========================================
# PAI New Machine Setup Script
# ===========================================
# Run this script on a new machine after cloning the PAI repo
#
# Usage:
#   git clone git@github.com:YOUR_USERNAME/pai-config.git ~/PAI
#   bash ~/PAI/scripts/setup-new-machine.sh
# ===========================================

set -e  # Exit on error

echo "=============================================="
echo "  PAI New Machine Setup"
echo "=============================================="
echo ""

PAI_DIR="$HOME/PAI"
CLAUDE_DIR="$HOME/.claude"

# -------------------------------------------
# Step 1: Verify PAI directory exists
# -------------------------------------------
echo "[1/7] Checking PAI directory..."
if [ ! -d "$PAI_DIR" ]; then
    echo "ERROR: PAI directory not found at $PAI_DIR"
    echo "Please clone the repository first:"
    echo "  git clone git@github.com:YOUR_USERNAME/pai-config.git ~/PAI"
    exit 1
fi
echo "  OK: PAI directory found at $PAI_DIR"

# -------------------------------------------
# Step 2: Handle existing .claude directory
# -------------------------------------------
echo ""
echo "[2/7] Configuring ~/.claude symlink..."

if [ -L "$CLAUDE_DIR" ]; then
    # It's already a symlink
    current_target=$(readlink "$CLAUDE_DIR")
    if [ "$current_target" = "$PAI_DIR/.claude" ]; then
        echo "  OK: Symlink already correctly configured"
    else
        echo "  Updating symlink from $current_target to $PAI_DIR/.claude"
        rm "$CLAUDE_DIR"
        ln -s "$PAI_DIR/.claude" "$CLAUDE_DIR"
        echo "  OK: Symlink updated"
    fi
elif [ -d "$CLAUDE_DIR" ]; then
    # It's a directory - back it up
    backup_dir="$HOME/.claude.backup.$(date +%Y%m%d_%H%M%S)"
    echo "  Found existing ~/.claude directory"
    echo "  Backing up to: $backup_dir"
    mv "$CLAUDE_DIR" "$backup_dir"
    ln -s "$PAI_DIR/.claude" "$CLAUDE_DIR"
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
    ln -s "$PAI_DIR/.claude" "$CLAUDE_DIR"
    echo "  OK: Created symlink ~/.claude -> $PAI_DIR/.claude"
fi

# -------------------------------------------
# Step 3: Configure PAI_DIR in settings.json
# -------------------------------------------
echo ""
echo "[3/8] Configuring PAI_DIR in settings.json..."

SETTINGS_FILE="$PAI_DIR/.claude/settings.json"
ACTUAL_CLAUDE_DIR="$HOME/.claude"

if [ -f "$SETTINGS_FILE" ]; then
    # Update PAI_DIR to this machine's path
    if grep -q '"PAI_DIR":' "$SETTINGS_FILE"; then
        # Use sed to replace the PAI_DIR value
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS sed requires different syntax
            sed -i '' "s|\"PAI_DIR\": \"[^\"]*\"|\"PAI_DIR\": \"$ACTUAL_CLAUDE_DIR\"|g" "$SETTINGS_FILE"
        else
            # Linux sed
            sed -i "s|\"PAI_DIR\": \"[^\"]*\"|\"PAI_DIR\": \"$ACTUAL_CLAUDE_DIR\"|g" "$SETTINGS_FILE"
        fi
        echo "  OK: PAI_DIR set to $ACTUAL_CLAUDE_DIR"
    else
        echo "  WARNING: PAI_DIR not found in settings.json"
    fi
else
    echo "  WARNING: settings.json not found"
fi

# -------------------------------------------
# Step 4: Create .env file from template
# -------------------------------------------
echo ""
echo "[4/8] Setting up environment file..."

ENV_FILE="$PAI_DIR/.claude/.env"
ENV_EXAMPLE="$PAI_DIR/.claude/.env.example"

if [ -f "$ENV_FILE" ]; then
    echo "  OK: .env file already exists"
else
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo "  Created .env from template"
        echo "  IMPORTANT: Edit $ENV_FILE to add your API keys"
    else
        echo "  WARNING: No .env.example found, creating minimal .env"
        cat > "$ENV_FILE" << 'EOF'
# PAI Environment Variables
# Add your API keys here

# Research APIs
# PERPLEXITY_API_KEY=your_key_here
# GOOGLE_API_KEY=your_key_here
EOF
        echo "  IMPORTANT: Edit $ENV_FILE to add your API keys"
    fi
fi

# -------------------------------------------
# Step 5: Install Bun (if not installed)
# -------------------------------------------
echo ""
echo "[5/8] Checking Bun installation..."

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
# Step 6: Setup shell aliases
# -------------------------------------------
echo ""
echo "[6/8] Setting up shell aliases..."

ALIAS_FILE="$PAI_DIR/scripts/pai-aliases.sh"
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
        echo "[ -f ~/PAI/scripts/pai-aliases.sh ] && source ~/PAI/scripts/pai-aliases.sh" >> "$SHELL_RC"
        echo "  OK: Added alias source to $SHELL_RC"
    fi
else
    echo "  WARNING: Could not detect shell config file"
    echo "  Manually add this line to your shell config:"
    echo "    source ~/PAI/scripts/pai-aliases.sh"
fi

# -------------------------------------------
# Step 7: Create local directories (not synced)
# -------------------------------------------
echo ""
echo "[7/8] Creating local directories..."

mkdir -p "$PAI_DIR/.claude/history/sessions"
mkdir -p "$PAI_DIR/.claude/history/learnings"
mkdir -p "$PAI_DIR/.claude/history/raw-outputs"
echo "  OK: Created history directories"

# -------------------------------------------
# Step 8: Verify setup
# -------------------------------------------
echo ""
echo "[8/8] Verifying setup..."
echo ""

# Check symlink
if [ -L "$CLAUDE_DIR" ] && [ "$(readlink $CLAUDE_DIR)" = "$PAI_DIR/.claude" ]; then
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
if [ -d "$PAI_DIR/.git" ]; then
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
echo "   nano ~/PAI/.claude/.env"
echo ""
echo "2. Restart your terminal or run:"
echo "   source $SHELL_RC"
echo ""
echo "3. Test the setup:"
echo "   pai-check"
echo ""
echo "4. Pull latest changes:"
echo "   pai-pull"
echo ""
