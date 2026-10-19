# Repository inventory

The README and coding-agent guide describe files shipped in this checkout. These counts do not mean every integration is configured, enabled, tested, or supported on every platform.

| Inventory | Tracked files | Counting rule |
|-----------|--------------:|---------------|
| Skill definitions | 128 | One `.claude/skills/<name>/SKILL.md` directly below each skill directory |
| Agent definitions | 27 | One `.claude/agents/<name>.md` directly below the agents directory |
| Native Fabric patterns | 234 | One `.claude/skills/Fabric/tools/patterns/<name>/system.md` per native pattern |
| Vendored Fabric patterns | 227 | One `.claude/skills/Fabric/fabric-repo/data/patterns/<name>/system.md` per vendored pattern |

The native Fabric prompts and vendored Fabric source snapshot are separate inventories. Do not add their counts together or assume they contain identical prompts. The [Fabric skill](../.claude/skills/Fabric/SKILL.md) reads native prompts from `tools/patterns/`; an independently installed CLI may have another version.

## Reproduce the counts

Run this from the repository root with Git and Python 3. It reads tracked paths from the Git index, including staged changes. It ignores untracked local skills, deeper nested definitions, and files with other names. It does not import skills, install packages, contact services, or read credentials.

```bash
python3 - <<'PY'
from pathlib import PurePosixPath
import subprocess

paths = [
    PurePosixPath(path)
    for path in subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
    if path
]
inventories = [
    ("Skills", ".claude/skills", 4, "SKILL.md"),
    ("Agents", ".claude/agents", 3, None),
    ("Native Fabric patterns", ".claude/skills/Fabric/tools/patterns", 7, "system.md"),
    ("Vendored Fabric patterns", ".claude/skills/Fabric/fabric-repo/data/patterns", 8, "system.md"),
]
for label, prefix, depth, filename in inventories:
    count = sum(
        path.as_posix().startswith(prefix + "/")
        and len(path.parts) == depth
        and (path.name == filename if filename else path.suffix == ".md")
        for path in paths
    )
    print(f"{label}: {count}")
PY
```

When adding or removing definitions, rerun the command and update this table, the [README](../README.md#skills), [CLAUDE.md](../CLAUDE.md), and the Fabric skill's count if applicable. README category tables are selected overviews, not a complete list of definitions.

## Configuration and validation boundaries

- Machine-local `settings.json` and hook registration are separate from the shipped hook scripts. Setup only updates an existing `env.PAI_DIR` entry; see [Quick Start](QUICKSTART.md#configure-machine-local-settings).
- `validate-protected.ts` resolves the checkout root from its location in `.claude/hooks/` and expects `.pai-protected.json` there. That manifest is not tracked in this checkout. The hook cannot validate it until it is configured locally.
- Agent and skill instructions can guide reviews and tool use. Their presence does not enforce a merge gate, guarantee secret detection, or establish benchmark accuracy.
- Setup CI uses isolated fixtures on Ubuntu and macOS. Complete installation, optional service integrations, and WSL require separate validation. See the [proposed roadmap](../ROADMAP.md).
