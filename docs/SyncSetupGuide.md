# PAI Cross-System Sync Setup Guide

This guide walks you through setting up Git-based synchronization for your PAI (Personal AI Infrastructure) configuration across multiple systems, with n8n automation for real-time sync.

## Overview

**Systems:**
- Ubuntu Server (with Ollama/Nvidia GPU)
- Mac Studio (primary workstation)
- MacBook Pro (portable)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub (Private Repo)                     │
│                         pai-config (main)                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │  Ubuntu  │ │   Mac    │ │ MacBook  │
             │  Server  │ │  Studio  │ │   Pro    │
             └──────────┘ └──────────┘ └──────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │   n8n Flow   │
                         │  (on Ubuntu) │
                         └──────────────┘
```

---

## Part 1: GitHub Setup (Do This First)

### Step 1.1: Create a GitHub Account (Skip if you have one)

1. Go to https://github.com
2. Click "Sign up"
3. Follow the registration process

### Step 1.2: Create a Private Repository

1. Log into GitHub
2. Click the **+** icon in the top-right corner
3. Select **"New repository"**
4. Fill in the form:
   - **Repository name:** `pai-config` (or whatever you prefer)
   - **Description:** "Personal AI Infrastructure configuration"
   - **Visibility:** Select **"Private"** ← Important!
   - **DO NOT** check "Add a README file" (we'll push our existing files)
   - **DO NOT** add .gitignore (we'll create our own)
   - **DO NOT** choose a license
5. Click **"Create repository"**
6. **Keep this page open** - you'll need the repository URL

Your repository URL will look like:
```
https://github.com/YOUR_USERNAME/pai-config.git
```

### Step 1.3: Generate a Personal Access Token (for HTTPS) or SSH Key

You have two options for authentication. **SSH is recommended** for automation.

#### Option A: SSH Key (Recommended)

**On your Mac Studio (primary machine):**

```bash
# Check if you already have an SSH key
ls -la ~/.ssh/id_ed25519.pub

# If the file doesn't exist, create a new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Enter a passphrase (optional but recommended)

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your key to the agent
ssh-add ~/.ssh/id_ed25519

# Copy your public key to clipboard (macOS)
pbcopy < ~/.ssh/id_ed25519.pub

# Or display it to copy manually
cat ~/.ssh/id_ed25519.pub
```

**Add the SSH key to GitHub:**

1. Go to GitHub → Click your profile picture → **Settings**
2. In the left sidebar, click **"SSH and GPG keys"**
3. Click **"New SSH key"**
4. Give it a title (e.g., "Mac Studio")
5. Paste your public key
6. Click **"Add SSH key"**

**Test the connection:**
```bash
ssh -T git@github.com
# Should say: "Hi USERNAME! You've successfully authenticated..."
```

#### Option B: Personal Access Token (HTTPS)

1. Go to GitHub → Profile → **Settings**
2. Scroll down to **"Developer settings"** (left sidebar, bottom)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**
5. Give it a name: "PAI Sync"
6. Set expiration (recommend 90 days or "No expiration" for home use)
7. Check these scopes:
   - `repo` (all repo permissions)
8. Click **"Generate token"**
9. **COPY THE TOKEN NOW** - you won't see it again!
10. Save it somewhere secure (password manager)

---

## Part 2: Git Setup on Primary Machine (Mac Studio)

### Step 2.1: Install Git (if needed)

```bash
# Check if git is installed
git --version

# If not installed, install via Homebrew
brew install git
```

### Step 2.2: Configure Git Identity

```bash
# Set your name and email (use the same email as your GitHub account)
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"

# Set default branch name to 'main'
git config --global init.defaultBranch main

# Enable credential caching (if using HTTPS)
git config --global credential.helper osxkeychain
```

### Step 2.3: Create the .gitignore File

Before initializing the repository, create a `.gitignore` file to exclude sensitive and machine-specific files.

**Create the file at `~/PAI/.gitignore`:**

```bash
# Navigate to PAI directory
cd ~/PAI

# Create .gitignore file
cat > .gitignore << 'EOF'
# ===========================================
# PAI .gitignore - Exclude sensitive/local files
# ===========================================

# -------------------------------------------
# Sensitive files (API keys, secrets)
# -------------------------------------------
.claude/.env
.claude/.env.local
.claude/.env.*.local
*.pem
*.key
secrets/
credentials/

# -------------------------------------------
# Machine-specific history and logs
# -------------------------------------------
.claude/history/
.claude/Observability/logs/
.claude/Observability/apps/server/logs/
*.log
*.log.*

# -------------------------------------------
# Runtime and cache files
# -------------------------------------------
node_modules/
.bun/
*.cache
.cache/
.npm/
.pnpm-store/

# -------------------------------------------
# Build artifacts
# -------------------------------------------
dist/
build/
out/
*.min.js
*.bundle.js

# -------------------------------------------
# OS-specific files
# -------------------------------------------
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
Thumbs.db
ehthumbs.db
Desktop.ini

# -------------------------------------------
# IDE and editor files
# -------------------------------------------
.idea/
.vscode/settings.json
.vscode/launch.json
*.swp
*.swo
*~
\#*\#

# -------------------------------------------
# Temporary files
# -------------------------------------------
tmp/
temp/
*.tmp
*.temp
*.bak
*.backup

# -------------------------------------------
# Local overrides (create these for machine-specific config)
# -------------------------------------------
.local/
*.local.json
*.local.md
settings.local.json
EOF
```

### Step 2.4: Create Environment Template

Since `.env` is ignored, create a template for other machines:

```bash
# Ensure the template exists (it should from PAI setup)
cat > ~/PAI/.claude/.env.example << 'EOF'
# ===========================================
# PAI Environment Variables Template
# ===========================================
# Copy this file to .env and fill in your values
# cp .env.example .env

# Research APIs
PERPLEXITY_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Optional Services
REPLICATE_API_TOKEN=your_token_here
OPENAI_API_KEY=your_key_here
BRIGHTDATA_API_KEY=your_key_here

# Machine-specific (uncomment and set if needed)
# PAI_MACHINE_NAME=mac-studio
EOF
```

### Step 2.5: Initialize Git Repository

```bash
# Navigate to PAI directory
cd ~/PAI

# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# Make your first commit
git commit -m "Initial PAI configuration"
```

### Step 2.6: Connect to GitHub and Push

**If using SSH (recommended):**
```bash
# Add GitHub as remote origin
git remote add origin git@github.com:YOUR_USERNAME/pai-config.git

# Push to GitHub
git push -u origin main
```

**If using HTTPS:**
```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/pai-config.git

# Push to GitHub (will prompt for username and token)
git push -u origin main
```

### Step 2.7: Verify on GitHub

1. Go to https://github.com/YOUR_USERNAME/pai-config
2. Confirm your files are there
3. Verify `.env` is NOT in the repository (security check!)

---

## Part 3: Setup on Secondary Machines

Repeat these steps on your **Ubuntu Server** and **MacBook Pro**.

### Step 3.1: Install Git

**On Ubuntu:**
```bash
sudo apt update
sudo apt install git
```

**On macOS (MacBook Pro):**
```bash
brew install git
```

### Step 3.2: Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
git config --global init.defaultBranch main
```

### Step 3.3: Setup SSH Key (Repeat for each machine)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Add this key to GitHub** (same process as Step 1.3, Option A)

Give it a descriptive title like "Ubuntu Server" or "MacBook Pro"

### Step 3.4: Clone the Repository

```bash
# Clone to home directory
cd ~
git clone git@github.com:YOUR_USERNAME/pai-config.git PAI

# Verify the clone
ls -la ~/PAI
```

### Step 3.5: Create Symlink for .claude

Claude Code expects configuration at `~/.claude`. Create a symlink:

```bash
# Remove existing .claude if it exists (backup first if needed!)
# Check what's there first:
ls -la ~/.claude

# If it's a directory with content you want to keep, back it up:
# mv ~/.claude ~/.claude.backup

# If it's empty or doesn't exist, proceed:
rm -rf ~/.claude  # Only if empty or doesn't exist!

# Create symlink
ln -s ~/PAI/.claude ~/.claude

# Verify
ls -la ~/.claude
# Should show: .claude -> /home/username/PAI/.claude
```

### Step 3.6: Create Local .env File

```bash
# Copy template to actual .env
cp ~/PAI/.claude/.env.example ~/PAI/.claude/.env

# Edit with your API keys
nano ~/PAI/.claude/.env
# Or use: vim, code, or any editor
```

### Step 3.7: Install Bun (Required for PAI hooks)

**On Ubuntu:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

**On macOS:**
```bash
brew install oven-sh/bun/bun
```

### Step 3.8: Test PAI Setup

```bash
# Run self-test
bun ~/.claude/hooks/self-test.ts
```

---

## Part 4: n8n Automation Setup

This creates automatic sync when you push changes to GitHub.

### Step 4.1: Create Sync Script on Each Machine

Create a script that n8n will trigger:

**On Ubuntu Server (`~/scripts/pai-sync.sh`):**
```bash
mkdir -p ~/scripts

cat > ~/scripts/pai-sync.sh << 'EOF'
#!/bin/bash
# PAI Sync Script - Pulls latest from GitHub

LOG_FILE="$HOME/scripts/pai-sync.log"
PAI_DIR="$HOME/PAI"

echo "$(date): Starting PAI sync..." >> "$LOG_FILE"

cd "$PAI_DIR" || exit 1

# Stash any local changes (shouldn't be any on server)
git stash

# Pull latest
git pull origin main >> "$LOG_FILE" 2>&1

# Check result
if [ $? -eq 0 ]; then
    echo "$(date): Sync successful" >> "$LOG_FILE"
else
    echo "$(date): Sync failed!" >> "$LOG_FILE"
fi
EOF

chmod +x ~/scripts/pai-sync.sh
```

**On Mac machines, create the same script** at `~/scripts/pai-sync.sh`

### Step 4.2: Setup SSH Access for n8n

n8n needs to be able to SSH into each machine to run the sync script.

**On your Ubuntu Server (where n8n runs):**

```bash
# Generate an SSH key for n8n (if not already done)
ssh-keygen -t ed25519 -f ~/.ssh/n8n_sync -N ""

# Display the public key
cat ~/.ssh/n8n_sync.pub
```

**On each target machine (Mac Studio, MacBook Pro, Ubuntu Server itself):**

```bash
# Add n8n's public key to authorized_keys
echo "PASTE_THE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

**Test SSH access from n8n server:**
```bash
# Test connection to Mac Studio (replace with actual IP/hostname)
ssh -i ~/.ssh/n8n_sync user@mac-studio.local "echo 'SSH works!'"
```

### Step 4.3: Create GitHub Webhook

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/pai-config`
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL:** `http://YOUR_N8N_URL:5678/webhook/pai-sync`
     (You'll get this URL from n8n in the next step)
   - **Content type:** `application/json`
   - **Secret:** Create a random string and save it
   - **Events:** Select "Just the push event"
4. Click **Add webhook**

**Note:** If n8n is only accessible on your local network, you'll need to either:
- Use a service like ngrok to expose n8n temporarily
- Use polling instead of webhooks (covered in Step 4.5)

### Step 4.4: Create n8n Workflow

1. Open n8n in your browser
2. Create a new workflow
3. Add nodes as follows:

**Node 1: Webhook Trigger**
- Type: `Webhook`
- HTTP Method: `POST`
- Path: `pai-sync`
- Authentication: `Header Auth`
  - Name: `X-Hub-Signature-256`
  - Value: (GitHub will send this)

**Node 2: SSH Command (Mac Studio)**
- Type: `SSH`
- Host: `mac-studio.local` (or IP address)
- Port: `22`
- Username: Your username
- Authentication: `Private Key`
- Private Key: Paste contents of `~/.ssh/n8n_sync`
- Command: `/Users/YOUR_USERNAME/scripts/pai-sync.sh`

**Node 3: SSH Command (MacBook Pro)**
- Clone Node 2, change host to MacBook Pro

**Node 4: SSH Command (Ubuntu Server - localhost)**
- Type: `Execute Command`
- Command: `/home/YOUR_USERNAME/scripts/pai-sync.sh`

**Connect the nodes:**
```
Webhook → Mac Studio SSH → MacBook Pro SSH → Ubuntu Execute
```

Or run them in parallel using a Split node.

### Step 4.5: Alternative - Polling Instead of Webhook

If webhook setup is complex, use polling:

**Node 1: Schedule Trigger**
- Type: `Schedule Trigger`
- Mode: `Interval`
- Interval: `5` (minutes)

**Node 2: Execute Command**
- Command: Check for git changes and sync
```bash
cd ~/PAI && git fetch && git diff HEAD origin/main --quiet || ~/scripts/pai-sync.sh
```

This checks every 5 minutes for changes and syncs if found.

### Step 4.6: n8n Workflow JSON (Complete)

Save this as a workflow and import it into n8n:

```json
{
  "name": "PAI Sync",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 5
            }
          ]
        }
      },
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [240, 300],
      "typeVersion": 1.1
    },
    {
      "parameters": {
        "command": "cd ~/PAI && git fetch origin main && if ! git diff --quiet HEAD origin/main; then git pull origin main && echo 'SYNCED'; else echo 'NO_CHANGES'; fi"
      },
      "name": "Check and Sync Ubuntu",
      "type": "n8n-nodes-base.executeCommand",
      "position": [460, 300],
      "typeVersion": 1
    },
    {
      "parameters": {
        "operation": "executeCommand",
        "host": "mac-studio.local",
        "port": 22,
        "username": "YOUR_USERNAME",
        "authentication": "privateKey",
        "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END OPENSSH PRIVATE KEY-----",
        "command": "cd ~/PAI && git fetch origin main && if ! git diff --quiet HEAD origin/main; then git pull origin main && echo 'SYNCED'; else echo 'NO_CHANGES'; fi"
      },
      "name": "Check and Sync Mac Studio",
      "type": "n8n-nodes-base.ssh",
      "position": [460, 500],
      "typeVersion": 1
    }
  ],
  "connections": {
    "Every 5 Minutes": {
      "main": [
        [
          { "node": "Check and Sync Ubuntu", "type": "main", "index": 0 },
          { "node": "Check and Sync Mac Studio", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

---

## Part 5: Daily Usage

### Helper Aliases

Add these to your `~/.bashrc` or `~/.zshrc` on all machines:

```bash
# PAI Sync Aliases
alias pai="cd ~/PAI"
alias pai-status="cd ~/PAI && git status"
alias pai-pull="cd ~/PAI && git pull origin main"
alias pai-push="cd ~/PAI && git add -A && git commit -m 'sync: $(date +%Y-%m-%d\ %H:%M)' && git push origin main"
alias pai-sync="pai-pull"
alias pai-diff="cd ~/PAI && git diff"
alias pai-log="cd ~/PAI && git log --oneline -10"

# Quick edit and push
pai-edit() {
    cd ~/PAI
    ${EDITOR:-nano} "$1"
    git add "$1"
    git commit -m "update: $1"
    git push origin main
}
```

Reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Workflow: Making Changes

**On any machine:**

```bash
# 1. Make sure you have latest
pai-pull

# 2. Make your changes (edit skills, agents, etc.)
nano ~/.claude/skills/MySkill/SKILL.md

# 3. Push changes
pai-push

# 4. Other machines will auto-sync within 5 minutes
#    Or manually sync with: pai-pull
```

### Workflow: Creating a New Skill

```bash
# Pull latest first
pai-pull

# Create skill (following PAI conventions)
mkdir -p ~/.claude/skills/NewSkill/{workflows,reference,tools}
touch ~/.claude/skills/NewSkill/SKILL.md

# Edit your skill
nano ~/.claude/skills/NewSkill/SKILL.md

# Push to all machines
pai-push
```

### Handling Conflicts

If you edited the same file on two machines before syncing:

```bash
# Pull will show conflict
pai-pull

# Git will mark conflicts in the file
# Edit the file to resolve conflicts
nano ~/.claude/skills/ConflictedFile.md

# Look for and resolve these markers:
# <<<<<<< HEAD
# Your local changes
# =======
# Remote changes
# >>>>>>> origin/main

# After resolving, commit
git add .
git commit -m "resolve: merge conflict in ConflictedFile.md"
git push origin main
```

---

## Part 6: Troubleshooting

### "Permission denied (publickey)"

```bash
# Check SSH agent is running
eval "$(ssh-agent -s)"

# Add your key
ssh-add ~/.ssh/id_ed25519

# Verify key is added
ssh-add -l

# Test GitHub connection
ssh -T git@github.com
```

### "Repository not found"

- Verify the repository URL is correct
- Check you have access (if private repo)
- Verify SSH key is added to GitHub

### "Please tell me who you are"

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

### n8n SSH Connection Fails

```bash
# Test SSH manually first
ssh -i ~/.ssh/n8n_sync -v user@target-machine

# Check target machine's sshd config allows key auth
sudo grep "PubkeyAuthentication" /etc/ssh/sshd_config
# Should show: PubkeyAuthentication yes
```

### Changes Not Syncing

```bash
# Check n8n workflow is active
# Check n8n logs for errors

# Manual sync to verify git works
cd ~/PAI
git fetch origin main
git status
git pull origin main
```

---

## Part 7: Security Checklist

- [ ] Repository is set to **Private** on GitHub
- [ ] `.env` file is in `.gitignore` and NOT committed
- [ ] SSH keys have passphrases (optional but recommended)
- [ ] n8n is not exposed to the internet (local network only)
- [ ] Personal Access Token (if used) has minimal scopes
- [ ] SSH keys for n8n sync are separate from personal keys
- [ ] No API keys or secrets in any committed files

### Verify No Secrets Committed

```bash
cd ~/PAI

# Search for potential secrets (should return nothing)
git log -p | grep -i "api_key\|secret\|password\|token" | head -20

# Check .env is ignored
git check-ignore .claude/.env
# Should output: .claude/.env
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Go to PAI directory | `pai` |
| Check status | `pai-status` |
| Pull latest | `pai-pull` |
| Push changes | `pai-push` |
| View recent changes | `pai-log` |
| View uncommitted changes | `pai-diff` |
| Quick edit and push | `pai-edit path/to/file.md` |

---

## Summary

You now have:

1. **Git repository** on GitHub (private) storing your PAI config
2. **Three machines** all synced to the same repository
3. **n8n automation** checking for changes every 5 minutes
4. **Helper aliases** for quick daily operations
5. **Proper .gitignore** keeping secrets and local files out

Your Claude Code experience will now be consistent across all three machines!
