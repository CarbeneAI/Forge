# Forge Quick Start Guide

Use `scripts/setup-new-machine.sh` from this repository to connect a Forge checkout to Claude Code. The installer runs in Bash on macOS and Linux; on Windows, use a Linux shell inside WSL. Shell helpers support Bash and Zsh.

## Install from a checkout

Git and Bash must be available. Install and authenticate Claude Code separately; this script does not install it.

```bash
git clone https://github.com/CarbeneAI/Forge.git "$HOME/Forge"
bash "$HOME/Forge/scripts/setup-new-machine.sh"
```

The checkout can live elsewhere, including a path with spaces or apostrophes. Quote the path when invoking the installer:

```bash
forge_checkout="$HOME/projects/Forge checkout"
git clone https://github.com/CarbeneAI/Forge.git "$forge_checkout"
bash "$forge_checkout/scripts/setup-new-machine.sh"
```

The script finds the checkout from its own file location, so the current working directory does not matter. Keep the checkout outside `~/.claude`: the installer creates that path as a symlink to the checkout's `.claude` directory.

### What setup changes

| Item | Installer behavior |
|------|--------------------|
| Checkout validation | Requires a `.claude` directory before changing home configuration. |
| `~/.claude` | Creates a symlink to the checkout's `.claude`; backs up an existing directory as `~/.claude.backup.<timestamp>`. Updates an existing symlink if it points elsewhere. |
| `.claude/settings.json` | Uses Bun to update an existing `env.PAI_DIR` string to the absolute path of `~/.claude`. Warns when settings or the optional entry are absent; does not create the file or register hooks. |
| `.claude/.env` | Preserves existing regular-file contents and mode. Creates a missing file privately with mode `0600`; rejects symlink and non-regular destinations. |
| Bun | Reuses an installed executable, or attempts installation through Homebrew on macOS when available, otherwise through the Bun installer. |
| Shell configuration | Adds a safely quoted source line for `scripts/pai-aliases.sh` to an existing `.zshrc`, otherwise `.bashrc`. Keeps any existing line mentioning `pai-aliases.sh`. |
| Local history | Creates `history/sessions`, `history/learnings`, and `history/raw-outputs` inside the checkout's `.claude`. |
| PyRIT | Keeps an existing virtual environment. If the skill is present without one, attempts setup using `uv` or Python 3.13; otherwise reports a skip. |

The script does not install Node.js or build SemanticMemory's native SQLite dependencies. Individual skills may require additional runtimes, packages, credentials, or services. The installer does not run the separate interactive setup wizard.

### Configure machine-local settings

`settings.json` is gitignored and is not supplied in a fresh clone. A completed installer run establishes the directory layout; it does not enable the repository's hooks by itself. Review and migrate previous settings from the backup path printed by setup, or configure Claude Code separately. Include only the hooks and permissions you intend to use.

When using Forge's runtime helpers, set `env.PAI_DIR` to your absolute `~/.claude` path. The installer can update that entry on subsequent runs once it exists. The README's [configuration example](../README.md#configuration) shows environment values; it is not a complete hook configuration.

The installer parses JSON with Bun after ensuring Bun is available. Compact, tabbed, and multiline JSON are accepted. It updates only the existing `env.PAI_DIR` string, preserves unrelated parsed settings, and formats changed files as two-space JSON. Missing files, missing entries, and already-correct values are left untouched. Invalid JSON, non-object root/env fields, non-string `env.PAI_DIR`, nonfinite numbers, and integers outside JavaScript's safe range fail without rewriting settings. Settings must be regular files; symlinks are rejected.

A replacement is prepared inside a private `.settings.tmp.*` directory beside the settings file, then published by atomic rename with the original ordinary POSIX permission bits. Interrupted temporary directories are ignored by Git and may require local cleanup. Ownership, ACLs, extended attributes, concurrent editing, and crash durability are not guaranteed by this procedure. Close other settings editors before running setup. A reported cleanup failure may occur after the new settings file was published; inspect the file before retrying.

The installer is not transactional: a later settings error does not undo an earlier symlink change, environment-file creation, or dependency installation. Error messages never print settings contents. No hooks or configured commands are executed by the JSON helper.

### Rerun or move a checkout

Run the same installer command to refresh setup. A correctly configured symlink and an existing `.env` are reused, and shell source lines are not duplicated. If setup backs up a previous `~/.claude` directory, inspect the reported backup path for files to migrate.

If you move the checkout, rerun the installer from its new location and edit the existing `pai-aliases.sh` source line in your shell configuration to use the new path. Setup preserves existing source lines rather than rewriting them.

`PAI_DIR` in Claude settings identifies the runtime configuration directory, normally `~/.claude`. `FORGE_REPO_DIR` is resolved when the shell aliases are sourced and identifies the checkout. Keep these separate when writing skills or shell integrations.

## Reload and verify

Restart your terminal, or source the shell configuration path printed by setup. For example, in Bash:

```bash
source "$HOME/.bashrc"
pai-check
```

For Zsh, use `source "$HOME/.zshrc"`. The existing public shell commands use the `pai` prefix:

| Command | Purpose |
|---------|---------|
| `pai` | Navigate to the checkout. |
| `paic` | Navigate to its `.claude` directory. |
| `pai-check` | Read-only setup checks with a nonzero exit status for required failures. |
| `pai-skills` | List installed skill directories. |
| `pai-agents` | List agent configuration files. |
| `pai-test` | Optional broader runtime diagnostic, including an optional local voice service probe. |

`pai-check` preserves the caller's directory and reports all detected failures.
Missing checkout/configuration directories, broken or foreign `~/.claude`
symlinks, failed Git status, and missing or failing Bun commands return nonzero.
Relative links to this checkout are accepted. A regular `~/.claude` directory
warns that its configuration may differ; a missing optional `.env` also warns.
These warnings alone do not fail the check. Git status disables optional index
refresh and configured fsmonitor hooks. Environment files are never sourced or
printed. This diagnostic does not validate settings contents, hook registration,
Claude authentication, or live service health.

`pai-test` requires configured settings and additional runtime features. It is separate from the isolated installer fixtures used by CI.

The alias definitions live in [`scripts/pai-aliases.sh`](../scripts/pai-aliases.sh). Review them before using Git helpers such as `pai-push`, which stages, commits, and pushes local changes.

`pai-sync` and `pai-edit` preserve your working directory and stop at the first
failed checkout, editor, or Git operation. They return nonzero on failure; a
failed status query is not treated as a clean checkout. Review `git status`
before retrying because earlier successful operations are not rolled back.

## Configure optional services

Edit the environment file already created by setup:

```bash
nano "$HOME/.claude/.env"
```

Add only credentials required by the skills you plan to use. The template describes research keys such as `GOOGLE_API_KEY` and `PERPLEXITY_API_KEY`. Preserve existing values and keep credentials out of commits.

Start Claude Code after completing its own installation and authentication:

```bash
claude
```

Explore the checked-in [CORE skill](../.claude/skills/CORE/SKILL.md), [skill structure guide](../.claude/skills/CORE/SkillSystem.md), and [agent configurations](../.claude/agents/) for the capabilities in this checkout.

## Troubleshooting

**Checkout configuration missing:** Run the script from a complete Forge clone containing `.claude`. It stops before changing home configuration if that directory is absent.

**Aliases unavailable or pointing to an old checkout:** Check the `pai-aliases.sh` source line in `.bashrc` or `.zshrc`, then reload that file. Quoted paths are required for checkout names containing spaces or shell characters.

**Settings missing or hooks report an old runtime path:** A fresh clone has no `settings.json`. Review and migrate previous settings from the reported backup, or configure Claude Code separately. If the file already contains `env.PAI_DIR`, rerun the installer to update its value to the absolute path of your `~/.claude` symlink. Rerunning does not generate settings or hook registrations.

**Bun unavailable:** Check `command -v bun` in a new terminal. The settings helper requires Bun after the dependency-install step; setup stops if it cannot run. Install Bun and rerun setup. The hook self-test also requires Bun on `PATH`.

For repository issues, use [CarbeneAI/Forge issues](https://github.com/CarbeneAI/Forge/issues).

## For contributors and coding agents

Keep installation instructions aligned with `scripts/setup-new-machine.sh` and preserve the public `pai-*` shell names. Validate changes with the isolated fixtures before recommending an install:

```bash
bash -n scripts/setup-new-machine.sh
bash -n scripts/pai-aliases.sh
zsh -n scripts/pai-aliases.sh
python3 -m unittest discover -s tests -v
```

The 45 tests require Bash, Zsh, Python 3, Git, and Bun (CI pins Bun 1.3.14).
Ten exercise private credential creation, preservation, races, failures, and
ignore rules. Ten exercise setup/navigation, five exercise Git helper behavior,
ten exercise the JSON helper's parsing, preservation, permissions, and I/O
failures, and ten exercise setup diagnostics. The diagnostic fixtures cover both
shells, required failures, warning-only states, and preserved caller directories.
A disposable Git repository verifies unchanged index content and modification
time and that a configured fsmonitor hook is not executed. Settings fixtures
invoke the real local Bun helper; network, package installation, mutation-oriented
Git helpers, and editor operations are stubbed as appropriate. No real Git push
is invoked. Fixtures copy scripts into disposable checkouts and set
`HOME` only in child processes. They do not install skill dependencies or call
live services. CI runs these checks on Ubuntu and macOS; this does not validate
every skill's dependencies or a full WSL installation.
