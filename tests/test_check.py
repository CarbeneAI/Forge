"""Exercise read-only setup diagnostics under Bash and Zsh without live tools."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ALIASES = Path(__file__).resolve().parents[1] / "scripts/pai-aliases.sh"


class ConfigurationCheckTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="forge-check-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / "isolated home"
        self.home.mkdir()
        self.repo = self.root / "checkout's $cash"
        (self.repo / "scripts").mkdir(parents=True)
        shutil.copy2(ALIASES, self.repo / "scripts/pai-aliases.sh")
        self.config = self.repo / ".claude"
        self.config.mkdir()
        self.env_file = self.config / ".env"
        self.env_file.write_text('SECRET=diagnostic-secret-canary\ntouch "$HOME/must-not-execute"\n')
        self.settings = self.config / "settings.json"
        self.settings.write_text('{"env":{"PRIVATE":"diagnostic-secret-canary"}}\n')
        self.link = self.home / ".claude"
        self.link.symlink_to(self.config)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "calls"
        # Keep PATH isolated so a missing Bun cannot fall through to a real tool.
        (self.bin / "dirname").symlink_to(shutil.which("dirname"))
        for name in ("git", "bun"):
            stub = self.bin / name
            stub.write_text('''#!/bin/sh
name=${0##*/}
printf '%s|%s|%s\\n' "$name" "$PWD" "$*" >> "$FORGE_CHECK_LOG"
[ "$FORGE_CHECK_FAIL" != "$name" ] || exit 31
if [ "$name" = bun ]; then printf 'fixture-version\\n'; fi
if [ "$name" = git ] && [ "$FORGE_CHECK_DIRTY" = yes ]; then printf ' M synthetic.txt\\n'; fi
''')
            stub.chmod(0o755)
        self.env = os.environ.copy()
        self.env.update(HOME=str(self.home), ZDOTDIR=str(self.home),
                        XDG_CONFIG_HOME=str(self.home / ".config"),
                        PATH=str(self.bin), FORGE_CHECK_LOG=str(self.log),
                        FORGE_CHECK_FAIL="", FORGE_CHECK_DIRTY="no")
        for name in ("BASH_ENV", "ENV", "ZSH_VERSION", "FORGE_REPO_DIR", "PAI_DIR"):
            self.env.pop(name, None)
        # Real Git must never inherit repository redirection or configured hooks.
        for name in list(self.env):
            if name.startswith("GIT_"):
                self.env.pop(name)
        self.env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull)

    def check(self, shell, *, failure="", missing_repo=False, dirty=False):
        self.log.unlink(missing_ok=True)
        existing = {p: p.read_bytes() for p in (self.env_file, self.settings) if p.exists()}
        home_before = sorted(p.name for p in self.home.iterdir())
        env = dict(self.env, FORGE_CHECK_FAIL=failure,
                   FORGE_CHECK_DIRTY="yes" if dirty else "no")
        executable = shutil.which(shell)
        self.assertIsNotNone(executable, f"Required test shell is missing: {shell}")
        flags = ["--noprofile", "--norc"] if shell == "bash" else ["-f"]
        command = '''
source "$1" || exit 90
if [ "$2" = missing ]; then FORGE_REPO_DIR="$PWD/absent-checkout"; fi
pai-check
check_result=$?
printf '\\n__CHECK_EXIT__=%s\\n__CALLER_PWD__=%s\\n' "$check_result" "$PWD"
'''
        result = subprocess.run(
            [executable, *flags, "-c", command, "forge-check-fixture",
             str(self.repo / "scripts/pai-aliases.sh"), "missing" if missing_repo else "present"],
            cwd=self.root, env=env, capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("diagnostic-secret-canary", result.stdout + result.stderr)
        self.assertEqual(sorted(p.name for p in self.home.iterdir()), home_before)
        for path, contents in existing.items():
            self.assertEqual(path.read_bytes(), contents)
        lines = result.stdout.splitlines()
        diagnostic_exit = int(next(line.split("=", 1)[1] for line in lines if line.startswith("__CHECK_EXIT__=")))
        caller_pwd = next(line.split("=", 1)[1] for line in lines if line.startswith("__CALLER_PWD__="))
        calls = self.log.read_text().splitlines() if self.log.exists() else []
        return diagnostic_exit, caller_pwd, result.stdout, calls

    def test_valid_and_dirty_checkouts_succeed_without_changing_directory(self):
        for shell in ("bash", "zsh"):
            for dirty in (False, True):
                with self.subTest(shell=shell, dirty=dirty):
                    code, cwd, output, calls = self.check(shell, dirty=dirty)
                    self.assertEqual(code, 0, output)
                    self.assertEqual(cwd, str(self.root))
                    self.assertEqual(
                        [call.split("|", 2)[2] for call in calls if call.startswith("git|")],
                        [f"--no-optional-locks -c core.fsmonitor=false -C {self.repo} status --short"],
                    )
                    if dirty:
                        self.assertIn("synthetic.txt", output)

    def test_missing_checkout_fails_without_git(self):
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, calls = self.check(shell, missing_repo=True)
                self.assertNotEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))
                self.assertFalse(any(call.startswith("git|") for call in calls))

    def test_missing_checkout_configuration_fails(self):
        shutil.rmtree(self.config)
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell)
                self.assertNotEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))

    def test_missing_broken_and_foreign_symlinks_fail(self):
        for target in (None, self.root / "absent", self.root / "unrelated configuration"):
            self.link.unlink(missing_ok=True)
            if target is not None:
                if target.name != "absent":
                    target.mkdir()
                self.link.symlink_to(target)
            for shell in ("bash", "zsh"):
                with self.subTest(shell=shell, target=target):
                    code, cwd, output, _ = self.check(shell)
                    self.assertNotEqual(code, 0, output)
                    self.assertEqual(cwd, str(self.root))

    def test_relative_symlink_to_checkout_succeeds(self):
        self.link.unlink()
        self.link.symlink_to(os.path.relpath(self.config, self.home))
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell)
                self.assertEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))

    def test_existing_directory_and_optional_env_absence_only_warn(self):
        self.link.unlink()
        self.link.mkdir()
        self.env_file.unlink()
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell)
                self.assertEqual(code, 0, output)
                self.assertIn("[WARN]", output)
                self.assertEqual(cwd, str(self.root))

    def test_failed_git_or_bun_command_fails(self):
        for shell in ("bash", "zsh"):
            for failure in ("git", "bun"):
                with self.subTest(shell=shell, failure=failure):
                    code, cwd, output, _ = self.check(shell, failure=failure)
                    self.assertNotEqual(code, 0, output)
                    self.assertEqual(cwd, str(self.root))
                    self.assertIn("[FAIL]", output)

    def test_missing_bun_fails(self):
        (self.bin / "bun").unlink()
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell)
                self.assertNotEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))
                self.assertIn("[FAIL]", output)

    def test_multiple_failures_are_reported_together(self):
        self.link.unlink()
        (self.bin / "bun").unlink()
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell, missing_repo=True)
                self.assertNotEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))
                self.assertIn("Directory missing", output)
                self.assertIn("~/.claude does not exist", output)
                self.assertIn("bun not installed", output)

    def test_actual_git_does_not_refresh_index_or_run_fsmonitor(self):
        git = shutil.which("git")
        self.assertIsNotNone(git, "Git is required for the read-only regression")
        subprocess.run([git, "init", "--quiet", str(self.repo)], env=self.env, check=True)
        tracked = self.repo / "synthetic.txt"
        tracked.write_text("original\n")
        subprocess.run([git, "-C", str(self.repo), "add", "synthetic.txt"], env=self.env, check=True)
        hook = self.root / "fsmonitor-hook"
        marker = self.root / "fsmonitor-executed"
        hook.write_text('#!/bin/sh\nprintf ran > "$HOME/../fsmonitor-executed"\n')
        hook.chmod(0o755)
        subprocess.run([git, "-C", str(self.repo), "config", "core.fsmonitor", str(hook)], env=self.env, check=True)
        # Establish that the canary is active before checking its suppression.
        subprocess.run([git, "-C", str(self.repo), "status", "--short"],
                       env=self.env,
                       capture_output=True, text=True, check=True)
        self.assertTrue(marker.exists(), "control status did not invoke the fixture hook")
        marker.unlink()
        (self.bin / "git").unlink()
        (self.bin / "git").symlink_to(git)
        index = self.repo / ".git" / "index"
        contents, modified = index.read_bytes(), index.stat().st_mtime_ns
        # Alter metadata so a normal status would have a reason to refresh it.
        original_stat = tracked.stat()
        os.utime(tracked, ns=(original_stat.st_atime_ns, original_stat.st_mtime_ns + 2_000_000_000))
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                code, cwd, output, _ = self.check(shell)
                self.assertEqual(code, 0, output)
                self.assertEqual(cwd, str(self.root))
                self.assertFalse(marker.exists(), "diagnostic invoked the configured fsmonitor hook")
                self.assertEqual(index.read_bytes(), contents)
                self.assertEqual(index.stat().st_mtime_ns, modified)


if __name__ == "__main__":
    unittest.main()
