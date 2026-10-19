# Proposed contributor roadmap

This is a contributor proposal for maintainer discussion, not an adopted release plan. The order below prioritizes reliable installation and verifiable documentation. Scope and scheduling remain the maintainer's decision.

## Baseline in this contribution

- Resolve the installer and shell aliases from the checkout location.
- Preserve existing environment files and shell configuration, and back up an existing `.claude` directory.
- Exercise the real scripts in disposable homes on Ubuntu and macOS, including special characters, reruns, and missing local settings.
- Stop `pai-sync` and `pai-edit` at failed checkout, editor, pull, status, add,
  commit, or push operations while preserving the caller directory.
- Run offline setup/navigation, Git helper, credential-file, JSON settings, and diagnostic tests, including partial optional PyRIT repair and Bash/Zsh subcases. Git/editor fixtures verify ordered failure handling without real pushes or mutations to the user's home.
- Parse existing settings structurally, update only `env.PAI_DIR`, preserve unrelated parsed values and file mode, and reject malformed settings without rewriting them.
- Make `pai-check` report required failures through its exit status, preserve the caller directory, and avoid loading credentials or running configured Git fsmonitor hooks. Settings and live services remain separate checks.
- Align the README, Quick Start, and coding-agent checks with the shipped installer. Machine-local settings and hook registration remain separate setup responsibilities.
- Document reproducible tracked-file counts and distinguish native Fabric prompts from the vendored snapshot. Qualify security, privacy, and platform claims against configured behavior and available validation.

These checks do not validate every skill, install the full runtime, or establish WSL compatibility. See [Quick Start](docs/QUICKSTART.md) and [setup CI](.github/workflows/setup-tests.yml) for the current checks.

## 1. Make local configuration easier to verify

Problem: a fresh clone does not contain `.claude/settings.json`, and users must determine which hooks and permissions to configure.

Proposed approach: agree on a minimal, documented settings template and extend the read-only setup diagnostic to validate settings before automating more setup.

Acceptance criteria:

- The diagnostic distinguishes missing, invalid, and intentionally optional settings without printing secrets.
- Template paths resolve on supported operating systems; hook commands are checked without executing them.
- Disposable-home tests show that diagnostics do not overwrite existing configuration.
- The README explains exactly what is configured automatically and what requires a user's choice.

## 2. Check documentation against the shipped inventory

Problem: skill names, counts, aliases, and hook instructions can drift as the repository changes.

Current contribution: [the repository inventory](docs/REPOSITORY-INVENTORY.md) defines the counts and provides a read-only command to reproduce them. Automated drift enforcement is still proposed.

Proposed approach: use that tracked-file inventory to validate local documentation links and referenced commands.

Acceptance criteria:

- Missing referenced files and duplicate inventory entries fail a documented check.
- Inventory counts have a reproducible definition, including how optional or disabled components are treated.
- Human and coding-agent instructions share the same setup and validation commands.
- Checks run without credentials or invoking skill integrations.

## 3. Validate the complete installation in an opt-in environment

Problem: isolated script fixtures cannot prove native dependencies, hook execution, or runtime integrations work together.

Proposed approach: document a disposable-machine smoke test, then automate only the portions the maintainer chooses to support.

Acceptance criteria:

- A fresh installation, restart, and recovery from a failed prerequisite are recorded on each claimed platform.
- WSL receives a separate result before being described as validated.
- Optional services and credentials are listed explicitly; default pull-request CI remains credential-free.
- Results identify the tested commit, operating system, and runtime versions, with sensitive output removed.

## Contribution standard

Keep each change independently reviewable. Include the user-visible problem, the reason for the chosen fix, a regression check where meaningful, affected documentation, and validation limits. Update this proposal only when new evidence or maintainer feedback changes priorities.

Proposed by Ryan Wentzel, [ryanwentzel.me](https://ryanwentzel.me).
