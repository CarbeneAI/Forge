#!/bin/bash
# Weekly PAIAudit runner — full audit + Telegram digest.
# Invoked by cron: Monday 06:00 local time.

set -e

PAI_DIR="${HOME}/.claude"
LOG_DIR="${PAI_DIR}/logs"
mkdir -p "$LOG_DIR"

LOG="${LOG_DIR}/pai-audit-weekly.log"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting weekly PAIAudit" >> "$LOG"

# Run full audit (writes report to ~/.claude/audit-history/)
/opt/homebrew/bin/bun "${PAI_DIR}/skills/PAIAudit/tools/audit.ts" --quiet >> "$LOG" 2>&1 || true

# Get summary line
SUMMARY=$(/opt/homebrew/bin/bun "${PAI_DIR}/skills/PAIAudit/tools/audit-summary.ts" 2>/dev/null || echo "PAI Audit: error reading result")

# Load Telegram creds
if [ -f "${PAI_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${PAI_DIR}/.env"
  set +a
fi

if [ -n "${TELEGRAM_BOT_TOKEN}" ] && [ -n "${TELEGRAM_CHAT_ID}" ]; then
  MSG=$(printf '*Weekly PAI Audit*\n%s\n\nFull report: ~/.claude/audit-history/%s.md' "${SUMMARY}" "$(date +%Y-%m-%d)")
  curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${MSG}" \
    --data-urlencode "parse_mode=Markdown" >> "$LOG" 2>&1 || true
  echo "" >> "$LOG"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Done" >> "$LOG"
