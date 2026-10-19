"""Run sourced Git helpers with fake Git/editor commands in disposable homes."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ALIASES = Path(__file__).resolve().parents[1] / "scripts/pai-aliases.sh"


class GitAliasTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="forge-git-aliases-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / "isolated home"
        self.home.mkdir()
        self.repo = self.root / "checkout's $cash"
        (self.repo / "scripts").mkdir(parents=True)
        shutil.copy2(ALIASES, self.repo / "scripts/pai-aliases.sh")
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "calls"
        for name in ("git", "fixture-editor"):
            stub = self.bin / name
            stub.write_text('''#!/bin/sh
name=${0##*/}
printf '%s|%s|%s\\n' "$name" "$PWD" "$*" >> "$FORGE_FIXTURE_LOG"
if [ "$name" = fixture-editor ]; then
    [ "$FORGE_FIXTURE_FAIL" != editor ] || exit 31
else
    [ "$FORGE_FIXTURE_FAIL" != "$1" ] || exit 31
    if [ "$1" = status ] && [ "$FORGE_FIXTURE_DIRTY" = yes ]; then
        printf ' M synthetic.txt\\n'
    fi
fi
''')
            stub.chmod(0o755)
        self.env = os.environ.copy()
        self.env.update(HOME=str(self.home), ZDOTDIR=str(self.home),
                        XDG_CONFIG_HOME=str(self.home / ".config"),
                        PATH=f"{self.bin}:/usr/bin:/bin:/usr/sbin:/sbin",
                        EDITOR="fixture-editor", FORGE_FIXTURE_LOG=str(self.log),
                        FORGE_FIXTURE_FAIL="", FORGE_FIXTURE_DIRTY="yes")
        for name in ("BASH_ENV", "ENV", "ZSH_VERSION", "FORGE_REPO_DIR", "PAI_DIR"):
            self.env.pop(name, None)
        self.addCleanup(lambda: self.assertEqual(list(self.home.iterdir()), []))

    def run_helper(self, shell, helper, failure="", missing=False, dirty=True):
        self.log.unlink(missing_ok=True)
        env = dict(self.env, FORGE_FIXTURE_FAIL=failure, FORGE_FIXTURE_DIRTY="yes" if dirty else "no")
        executable = shutil.which(shell)
        self.assertIsNotNone(executable, f"Required test shell is missing: {shell}")
        flags = ["--noprofile", "--norc"] if shell == "bash" else ["-f"]
        command = '''
source "$1" || exit 90
if [ "$3" = missing ]; then FORGE_REPO_DIR="$PWD/absent-checkout"; fi
caller_pwd=$PWD
if [ "$2" = pai-edit ]; then
    pai-edit synthetic.txt
else
    pai-sync
fi
helper_result=$?
[ "$PWD" = "$caller_pwd" ] || exit 91
exit "$helper_result"
'''
        result = subprocess.run(
            [executable, *flags, "-c", command, "forge-fixture",
             str(self.repo / "scripts/pai-aliases.sh"), helper, "missing" if missing else "present"],
            cwd=self.root, env=env, capture_output=True, text=True,
        )
        calls = self.log.read_text().splitlines() if self.log.exists() else []
        operations = []
        for call in calls:
            name, cwd, args = call.split("|", 2)
            self.assertEqual(cwd, str(self.repo), call)
            operations.append("editor" if name == "fixture-editor" else args.split()[0])
        return result, operations

    def test_missing_checkout_runs_no_git_or_editor(self):
        for shell in ("bash", "zsh"):
            for helper in ("pai-sync", "pai-edit"):
                with self.subTest(shell=shell, helper=helper):
                    result, operations = self.run_helper(shell, helper, missing=True)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertNotEqual(result.returncode, 91, result.stdout + result.stderr)
                    self.assertEqual(operations, [])

    def test_sync_stops_at_every_git_failure(self):
        expected = ["pull", "status", "add", "commit", "push"]
        for shell in ("bash", "zsh"):
            for index, failure in enumerate(expected):
                with self.subTest(shell=shell, failure=failure):
                    result, operations = self.run_helper(shell, "pai-sync", failure)
                    self.assertEqual(result.returncode, 31, result.stdout + result.stderr)
                    self.assertEqual(operations, expected[:index + 1])

    def test_sync_success_and_clean_checkout(self):
        for shell in ("bash", "zsh"):
            for dirty in (True, False):
                with self.subTest(shell=shell, dirty=dirty):
                    result, operations = self.run_helper(shell, "pai-sync", dirty=dirty)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    self.assertEqual(operations, ["pull", "status", "add", "commit", "push"] if dirty else ["pull", "status"])

    def test_edit_stops_at_editor_and_git_failures(self):
        expected = ["editor", "add", "commit", "push"]
        for shell in ("bash", "zsh"):
            for index, failure in enumerate(expected):
                with self.subTest(shell=shell, failure=failure):
                    result, operations = self.run_helper(shell, "pai-edit", failure)
                    self.assertEqual(result.returncode, 31, result.stdout + result.stderr)
                    self.assertEqual(operations, expected[:index + 1])

    def test_edit_success_preserves_caller_directory(self):
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                result, operations = self.run_helper(shell, "pai-edit")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertEqual(operations, ["editor", "add", "commit", "push"])


if __name__ == "__main__":
    unittest.main()
