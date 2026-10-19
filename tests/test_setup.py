"""Exercise the actual installer and sourced aliases in disposable homes only."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="forge-setup-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / "user's home"
        self.home.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.unexpected = self.root / "unexpected-commands"
        self.real_bun = shutil.which("bun")
        self.assertIsNotNone(self.real_bun, "Bun is required for isolated JSON settings checks")
        # Only the Bun version query and local settings helper are permitted. Every installer/network stub
        # records its invocation so swallowed command failures still fail tests.
        for name in ("bun", "curl", "wget", "brew", "uv", "pip", "pip3", "python3.13"):
            stub = self.bin / name
            stub.write_text(
                '#!/bin/sh\n'
                'if [ "${0##*/}" = bun ] && [ "$#" = 1 ] && [ "$1" = --version ]; then\n'
                '  echo test-bun; exit 0\nfi\n'
                'if [ "${0##*/}" = bun ] && [ "$#" = 5 ] && [ "$1" = --no-env-file ] && [ "$2" = run ] && [ "$3" = - ]; then\n'
                '  exec "$FORGE_TEST_BUN_BIN" "$@"\nfi\n'
                'printf "%s\\n" "$0 $*" >> "$FORGE_TEST_UNEXPECTED"\nexit 97\n'
            )
            stub.chmod(0o755)
        self.env = os.environ.copy()
        # Child-only HOME and XDG directories: never source the real user's rc.
        self.env.update(HOME=str(self.home), PATH=f"{self.bin}:/usr/bin:/bin:/usr/sbin:/sbin",
                        XDG_CONFIG_HOME=str(self.home / ".config"),
                        ZDOTDIR=str(self.home), FORGE_TEST_UNEXPECTED=str(self.unexpected),
                        FORGE_TEST_BUN_BIN=self.real_bun)
        for name in ("BASH_ENV", "ENV", "ZSH_VERSION", "FORGE_REPO_DIR", "PAI_DIR"):
            self.env.pop(name, None)
        self.addCleanup(self.assert_no_installers)

    def assert_no_installers(self):
        self.assertFalse(self.unexpected.exists(),
                         self.unexpected.read_text() if self.unexpected.exists() else "")

    def checkout(self, name="Forge", valid=True):
        repo = self.home / name
        (repo / "scripts").mkdir(parents=True)
        for name in ("setup-new-machine.sh", "pai-aliases.sh", "configure-settings.mjs"):
            shutil.copy2(SCRIPTS / name, repo / "scripts" / name)
        if valid:
            claude = repo / ".claude"
            for directory in ("skills", "agents", "hooks"):
                (claude / directory).mkdir(parents=True)
            (claude / "settings.json").write_text('{"env": {"PAI_DIR": "/old/path"}, "keep": true}\n')
            (claude / ".env.example").write_text("EXAMPLE_KEY=template\n")
        return repo

    def run_shell(self, shell, command, *args, check=True):
        executable = shutil.which(shell)
        if not executable:
            self.fail(f"Required test shell is not installed: {shell}")
        flags = ["--noprofile", "--norc"] if shell == "bash" else ["-f"]
        result = subprocess.run([executable, *flags, "-c", command, "forge-test", *map(str, args)],
                                env=self.env, cwd=self.root, capture_output=True, text=True)
        if check:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def install(self, repo, check=True):
        return self.run_shell("bash", 'bash "$1/scripts/setup-new-machine.sh"', repo, check=check)

    def assert_installed(self, repo):
        self.assertTrue((self.home / ".claude").is_symlink())
        self.assertEqual((self.home / ".claude").resolve(), repo / ".claude")
        settings = json.loads((repo / ".claude/settings.json").read_text())
        self.assertEqual(settings["env"]["PAI_DIR"], str(self.home / ".claude"))
        self.assertTrue(settings["keep"])
        self.assertTrue((repo / ".claude/history/raw-outputs").is_dir())

    def test_fresh_checkout_warns_without_creating_machine_local_settings(self):
        repo = self.checkout()
        settings = repo / ".claude/settings.json"
        settings.unlink()
        for _ in range(2):
            result = self.install(repo)
            self.assertIn("WARNING: settings.json not found", result.stdout)
            self.assertFalse(settings.exists())
            self.assertEqual((self.home / ".claude").resolve(), repo / ".claude")
        self.assertEqual((repo / ".claude/.env").read_text(), "EXAMPLE_KEY=template\n")

    def test_default_checkout_and_repeat_preserve_configuration(self):
        repo = self.checkout()
        rc = self.home / ".bashrc"
        rc.write_text("# existing shell configuration\n")
        env_file = repo / ".claude/.env"
        env_file.write_text("PRIVATE_KEY=keep-me\n")
        for _ in range(2):
            result = self.install(repo)
            self.assertIn("[OK] ~/.claude symlink configured correctly", result.stdout)
            self.assert_installed(repo)
        self.assertEqual(env_file.read_text(), "PRIVATE_KEY=keep-me\n")
        self.assertTrue(rc.read_text().startswith("# existing shell configuration\n"))
        self.assertEqual(rc.read_text().count("source "), 1)
        self.assertFalse(list(self.home.glob(".claude.backup.*")))
        self.assert_navigation("bash", rc, repo)

    def test_custom_checkout_backup_and_shell_escaped_rc(self):
        repo = self.checkout(self.root / "custom checkout's $cash `touch BAD` & [repo]")
        rc = self.home / ".zshrc"
        rc.write_text("# keep zsh settings\n")
        old = self.home / ".claude"
        old.mkdir()
        (old / "precious.txt").write_text("keep this")
        for _ in range(2):
            self.install(repo)
            self.assert_installed(repo)
        backups = list(self.home.glob(".claude.backup.*"))
        self.assertEqual(len(backups), 1)
        self.assertEqual((backups[0] / "precious.txt").read_text(), "keep this")
        self.assertEqual((repo / ".claude/.env").read_text(), "EXAMPLE_KEY=template\n")
        self.assertEqual(rc.read_text().count("source "), 1)
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                self.assert_navigation(shell, rc, repo)
        self.assertFalse((self.root / "BAD").exists())

    def assert_navigation(self, shell, source, repo):
        self.run_shell(shell, '''
PAI_DIR=keep-runtime-config
if [ -n "${BASH_VERSION:-}" ]; then shopt -s expand_aliases; fi
source "$1"
[ "$FORGE_REPO_DIR" = "$2" ] || exit 20
[ "$PAI_DIR" = keep-runtime-config ] || exit 21
# Eval allows aliases to expand after the source command has run.
eval pai
[ "$PWD" = "$2" ] || exit 22
eval paic
[ "$PWD" = "$2/.claude" ] || exit 23
eval pais
[ "$PWD" = "$2/.claude/skills" ] || exit 24
eval paia
[ "$PWD" = "$2/.claude/agents" ] || exit 25
eval paih
[ "$PWD" = "$2/.claude/hooks" ] || exit 26
''', source, repo)

    def test_aliases_can_be_sourced_directly_in_bash_and_zsh(self):
        repo = self.checkout("another checkout's $cash")
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                self.assert_navigation(shell, repo / "scripts/pai-aliases.sh", repo)

    def test_settings_path_escapes_json_and_shell_characters(self):
        self.home = self.root / "home & pipe| back\\slash quote\""
        self.home.mkdir()
        self.env.update(HOME=str(self.home), ZDOTDIR=str(self.home),
                        XDG_CONFIG_HOME=str(self.home / ".config"))
        repo = self.checkout()
        for _ in range(2):
            self.install(repo)
            self.assert_installed(repo)
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                self.assert_navigation(shell, self.home / ".bashrc", repo)

    def test_settings_json_whitespace_and_unrelated_keys_are_preserved(self):
        repo = self.checkout()
        settings = repo / ".claude/settings.json"
        for whitespace in ("", " ", "\t", "\n  "):
            with self.subTest(whitespace=repr(whitespace)):
                original = {"env": {"PAI_DIR": "/old/path", "OTHER": "fixture-secret"},
                            "PAI_DIR": "unrelated top-level", "hooks": {"PAI_DIR": "unrelated nested"}}
                settings.write_text(json.dumps(original, separators=(",", ":" + whitespace)))
                result = self.install(repo)
                expected = dict(original, env=dict(original["env"], PAI_DIR=str(self.home / ".claude")))
                self.assertEqual(json.loads(settings.read_text()), expected)
                self.assertNotIn("fixture-secret", result.stdout + result.stderr)

    def test_invalid_settings_stop_before_alias_configuration(self):
        repo = self.checkout()
        settings = repo / ".claude/settings.json"
        original = '{"env":{"PAI_DIR":"fixture-secret"}'
        settings.write_text(original)
        result = self.install(repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(settings.read_text(), original)
        self.assertFalse((self.home / ".bashrc").exists())
        self.assertNotIn("Setup Complete", result.stdout)
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)

    def test_existing_symlink_is_updated_without_changing_its_old_target(self):
        repo = self.checkout()
        old = self.home / "old configuration"
        old.mkdir()
        (old / "precious.txt").write_text("keep this")
        (self.home / ".claude").symlink_to(old)
        self.install(repo)
        self.assert_installed(repo)
        self.assertEqual((old / "precious.txt").read_text(), "keep this")
        self.assertFalse(list(self.home.glob(".claude.backup.*")))

    def test_existing_alias_source_line_is_not_duplicated(self):
        repo = self.checkout("PAI")
        rc = self.home / ".bashrc"
        original = "# existing\n[ -f ~/PAI/scripts/pai-aliases.sh ] && source ~/PAI/scripts/pai-aliases.sh\n"
        rc.write_text(original)
        self.install(repo)
        self.assertEqual(rc.read_text(), original)

    def test_invalid_checkout_fails_before_mutating_home(self):
        repo = self.checkout("PAI", valid=False)
        old = self.home / ".claude"
        old.mkdir()
        (old / "precious.txt").write_text("keep this")
        rc = self.home / ".bashrc"
        rc.write_text("# unchanged\n")
        result = self.install(repo, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(".claude", result.stdout + result.stderr)
        self.assertFalse(old.is_symlink())
        self.assertEqual((old / "precious.txt").read_text(), "keep this")
        self.assertEqual(rc.read_text(), "# unchanged\n")
        self.assertFalse(list(self.home.glob(".claude.backup.*")))
        self.assertFalse((repo / ".claude").exists())


if __name__ == "__main__":
    unittest.main()
