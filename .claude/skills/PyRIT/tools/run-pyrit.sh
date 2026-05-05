#!/usr/bin/env bash
# PyRIT skill wrapper — activates the skill's venv and dispatches to PyRIT entry points.
# Usage:
#   run-pyrit.sh scan [args...]      → pyrit_scan
#   run-pyrit.sh shell [args...]     → pyrit_shell
#   run-pyrit.sh python [args...]    → python REPL with pyrit available
#   run-pyrit.sh version             → installed PyRIT version
#   run-pyrit.sh exec <cmd> [args]   → arbitrary command inside the venv

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="$SKILL_DIR/venv"

if [[ ! -d "$VENV" ]]; then
  echo "ERROR: PyRIT venv not found at $VENV" >&2
  echo "Run: cd $SKILL_DIR && uv venv --python 3.13 venv && source venv/bin/activate && uv pip install pyrit" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

# Load API keys from ~/.env if present (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
if [[ -f "$HOME/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$HOME/.env"
  set +a
fi

cmd="${1:-help}"
shift || true

case "$cmd" in
  scan)
    exec pyrit_scan "$@"
    ;;
  shell)
    exec pyrit_shell "$@"
    ;;
  python|repl)
    exec python "$@"
    ;;
  version)
    python -c "import pyrit; print('pyrit', pyrit.__version__)"
    ;;
  exec)
    exec "$@"
    ;;
  help|*)
    cat <<EOF
PyRIT skill wrapper — Microsoft AI red-teaming framework.

Commands:
  scan [args...]      Run pyrit_scan (automated scenario engine)
  shell [args...]     Run pyrit_shell (interactive REPL)
  python [args...]    Python interpreter with pyrit available
  version             Print installed PyRIT version
  exec <cmd> [args]   Run arbitrary command inside the venv

Environment:
  ~/.env is auto-sourced for API keys.
  Set PYRIT_DB_PATH per-engagement to isolate memory.

Docs: https://microsoft.github.io/PyRIT/
EOF
    ;;
esac
