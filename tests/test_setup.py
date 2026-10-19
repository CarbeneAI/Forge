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

    def run_shell(self, shell, command, *args, check=True, env=None):
        executable = shutil.which(shell)
        if not executable:
            self.fail(f"Required test shell is not installed: {shell}")
        flags = ["--noprofile", "--norc"] if shell == "bash" else ["-f"]
        result = subprocess.run([executable, *flags, "-c", command, "forge-test", *map(str, args)],
                                env=self.env if env is None else env, cwd=self.root,
                                capture_output=True, text=True)
        if check:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def install(self, repo, check=True):
        return self.run_shell("bash", 'bash "$1/scripts/setup-new-machine.sh"', repo, check=check)

    def configure_fake_pyrit_uv(self):
        """Emulate venv creation and package metadata without running PyRIT."""
        self.pyrit_uv_log = self.root / "pyrit-uv.log"
        self.env["FORGE_TEST_UV_LOG"] = str(self.pyrit_uv_log)
        self.env["FORGE_TEST_UV_INSTALL_FAIL"] = "0"
        self.env["FORGE_TEST_UV_MARK_INSTALLED"] = "1"
        uv = self.bin / "uv"
        uv.write_text(
            "#!/bin/sh\n"
            "printf '%s\\n' \"$*\" >> \"$FORGE_TEST_UV_LOG\"\n"
            "if [ \"$1\" = venv ]; then\n"
            "  mkdir -p venv/bin\n"
            "  cat > venv/bin/activate <<'ACTIVATE'\n"
            "VIRTUAL_ENV=\"$PWD/venv\"\n"
            "export VIRTUAL_ENV\n"
            "PATH=\"$VIRTUAL_ENV/bin:$PATH\"\n"
            "export PATH\n"
            "ACTIVATE\n"
            "  cat > venv/bin/python <<'PYTHON'\n"
            "#!/bin/sh\n"
            "if [ \"$1\" = -I ] && [ \"$2\" = -c ]; then\n"
            "  case \"$3\" in *importlib.metadata*pyrit*) ;; *) exit 3 ;; esac\n"
            "  venv_bin=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd -P)\n"
            "  [ -f \"${venv_bin%/bin}/.pyrit-installed\" ]\n"
            "elif [ \"$1\" = -c ] && [ -n \"${PYTHONPATH:-}\" ]; then\n"
            "  [ -d \"$PYTHONPATH/pyrit-0.0.0.dist-info\" ]\n"
            "else\n"
            "  exit 2\n"
            "fi\n"
            "PYTHON\n"
            "  chmod +x venv/bin/python\n"
            "  exit 0\n"
            "fi\n"
            "if [ \"$1\" = pip ] && [ \"$2\" = install ] && [ \"$3\" = --python ] && [ \"$5\" = pyrit ]; then\n"
            "  [ \"${FORGE_TEST_UV_INSTALL_FAIL:-0}\" = 0 ] || exit 47\n"
            "  pyrit_venv=\"${4%/bin/python}\"\n"
            "  [ \"${FORGE_TEST_UV_MARK_INSTALLED:-1}\" = 1 ] && touch \"$pyrit_venv/.pyrit-installed\"\n"
            "  exit 0\n"
            "fi\n"
            "exit 96\n"
        )
        uv.chmod(0o755)

    def test_partial_pyrit_install_is_retried_and_verified_before_noop(self):
        repo = self.checkout()
        pyrit = repo / ".claude/skills/PyRIT"
        pyrit.mkdir()
        self.configure_fake_pyrit_uv()
        ambient_pythonpath = self.root / "ambient-pythonpath"
        (ambient_pythonpath / "pyrit-0.0.0.dist-info").mkdir(parents=True)
        self.env["PYTHONPATH"] = str(ambient_pythonpath)

        # venv creation succeeds, but package installation fails without network.
        self.env["FORGE_TEST_UV_INSTALL_FAIL"] = "1"
        first = self.install(repo, check=False)
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        self.assertIn("venv --python 3.13 venv", self.pyrit_uv_log.read_text())
        self.assertIn(f"pip install --python {pyrit}/venv/bin/python pyrit",
                      self.pyrit_uv_log.read_text())
        self.assertNotIn("PyRIT installed", first.stdout + first.stderr)
        self.assertNotIn("PyRIT venv already exists", first.stdout + first.stderr)
        self.assertIn("WARNING: PyRIT setup did not complete", first.stdout + first.stderr)
        self.assertIn("Setup Complete", first.stdout)

        # A successful installer command is not enough if package metadata is
        # still absent. A later retry repairs it, and a final rerun is a no-op.
        self.env["FORGE_TEST_UV_INSTALL_FAIL"] = "0"
        self.env["FORGE_TEST_UV_MARK_INSTALLED"] = "0"
        second = self.install(repo, check=False)
        self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
        self.assertNotIn("PyRIT installed", second.stdout + second.stderr)
        self.assertIn("WARNING: PyRIT setup did not complete", second.stdout + second.stderr)
        log_after_repair = self.pyrit_uv_log.read_text().splitlines()
        self.assertEqual(sum(line.startswith("pip install --python ") for line in log_after_repair), 2)

        self.env["FORGE_TEST_UV_MARK_INSTALLED"] = "1"
        third = self.install(repo, check=False)
        self.assertEqual(third.returncode, 0, third.stdout + third.stderr)
        self.assertIn("PyRIT installed", third.stdout)
        log_after_repair = self.pyrit_uv_log.read_text().splitlines()
        self.assertEqual(sum(line.startswith("pip install --python ") for line in log_after_repair), 3)

        fourth = self.install(repo, check=False)
        self.assertEqual(fourth.returncode, 0, fourth.stdout + fourth.stderr)
        log_after_noop = self.pyrit_uv_log.read_text().splitlines()
        self.assertEqual(sum(line.startswith("pip install --python ") for line in log_after_noop), 3)
        self.assertIn("PyRIT package is installed", fourth.stdout)

    def test_python_fallback_uses_venv_interpreter_not_ambient_pip(self):
        repo = self.checkout()
        pyrit = repo / ".claude/skills/PyRIT"
        pyrit.mkdir()
        fallback_bin = self.root / "python-fallback-bin"
        fallback_bin.mkdir()
        (fallback_bin / "bun").symlink_to(self.bin / "bun")
        (fallback_bin / "python3.13").write_text(
            "#!/bin/sh\n"
            "[ \"$1\" = -m ] && [ \"$2\" = venv ] && [ \"$3\" = venv ] || exit 2\n"
            "mkdir -p venv/bin\n"
            "printf '%s\\n' 'VIRTUAL_ENV=\"$PWD/venv\"' 'export VIRTUAL_ENV' "
            "'PATH=\"$VIRTUAL_ENV/bin:$PATH\"' 'export PATH' > venv/bin/activate\n"
            "cat > venv/bin/python <<'PYTHON'\n"
            "#!/bin/sh\n"
            "case \"$1 $2\" in\n"
            "  '-I -c') case \"$3\" in *importlib.metadata*pyrit*) ;; *) exit 3 ;; esac\n"
            "      venv_bin=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd -P)\n"
            "      [ -f \"${venv_bin%/bin}/.pyrit-installed\" ] ;;\n"
            "  '-I -m') [ \"$3\" = pip ] && [ \"$4\" = install ] && [ \"$5\" = pyrit ] || exit 3\n"
            "      printf '%s\\n' 'venv-python -I -m pip install pyrit' >> \"$FORGE_TEST_PYTHON_LOG\"\n"
            "      [ \"${FORGE_TEST_VENV_PIP_AVAILABLE:-0}\" = 1 ] || exit 47\n"
            "      venv_bin=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd -P)\n"
            "      touch \"${venv_bin%/bin}/.pyrit-installed\" ;;\n"
            "  '-m pip') [ \"$3\" = install ] && [ \"$4\" = pyrit ] || exit 3\n"
            "      printf '%s\\n' 'PYTHONPATH pip module invoked' >> \"$FORGE_TEST_HOST_PIP_LOG\"\n"
            "      exit 0 ;;\n"
            "  *) exit 3 ;;\n"
            "esac\n"
            "PYTHON\n"
            "chmod +x venv/bin/python\n"
        )
        (fallback_bin / "python3.13").chmod(0o755)
        host_pip_log = self.root / "host-pip.log"
        (fallback_bin / "pip").write_text(
            "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$FORGE_TEST_HOST_PIP_LOG\"\nexit 0\n"
        )
        (fallback_bin / "pip").chmod(0o755)

        python_log = self.root / "python-fallback.log"
        ambient_pythonpath = self.root / "python-fallback-path"
        ambient_pythonpath.mkdir()
        (ambient_pythonpath / "pip.py").write_text(
            "from pathlib import Path\n"
            "Path(__import__('os').environ['FORGE_TEST_HOST_PIP_LOG']).write_text('ambient pip module')\n"
        )
        self.env["FORGE_TEST_PYTHON_LOG"] = str(python_log)
        self.env["FORGE_TEST_HOST_PIP_LOG"] = str(host_pip_log)
        restricted = self.root / "python-fallback-tools"
        restricted.mkdir()
        for name in ("cat", "chmod", "date", "git", "grep", "ln", "link", "mkdir",
                     "mktemp", "mv", "readlink", "rm"):
            executable = shutil.which(name)
            if executable:
                (restricted / name).symlink_to(executable)
        env = self.env.copy()
        env["PATH"] = f"{fallback_bin}:{restricted}:{os.defpath}"
        env["PYTHONPATH"] = str(ambient_pythonpath)
        self.assertIsNone(shutil.which("uv", path=env["PATH"]))

        failed_repair = self.run_shell("bash", 'bash "$1/scripts/setup-new-machine.sh"',
                                       repo, check=False, env=env)
        self.assertEqual(failed_repair.returncode, 0,
                         failed_repair.stdout + failed_repair.stderr)
        self.assertIn("WARNING: PyRIT setup did not complete",
                      failed_repair.stdout + failed_repair.stderr)
        self.assertIn("venv-python -I -m pip install pyrit", python_log.read_text())
        self.assertFalse(host_pip_log.exists(), "repair must never invoke ambient pip")

        env["FORGE_TEST_VENV_PIP_AVAILABLE"] = "1"
        repaired = self.run_shell("bash", 'bash "$1/scripts/setup-new-machine.sh"',
                                  repo, check=False, env=env)
        self.assertEqual(repaired.returncode, 0, repaired.stdout + repaired.stderr)
        self.assertIn("OK: PyRIT installed", repaired.stdout)
        self.assertTrue((pyrit / "venv/.pyrit-installed").exists())
        self.assertFalse(host_pip_log.exists(), "repair must never invoke ambient pip")

    def test_pyrit_missing_prerequisites_remain_an_explicit_optional_skip(self):
        repo = self.checkout()
        (repo / ".claude/skills/PyRIT").mkdir()
        self.configure_fake_pyrit_uv()

        # Expose only the installer's normal utilities and Bun, deliberately
        # excluding uv and Python 3.13 even if the host has either installed.
        restricted = self.root / "restricted-bin"
        restricted.mkdir()
        (restricted / "bun").symlink_to(self.bin / "bun")
        for name in ("cat", "chmod", "date", "git", "grep", "ln", "link", "mkdir",
                     "mktemp", "mv", "readlink", "rm"):
            executable = shutil.which(name)
            if executable:
                (restricted / name).symlink_to(executable)
        env = self.env.copy()
        env["PATH"] = f"{restricted}:{os.defpath}"
        self.assertIsNone(shutil.which("uv", path=env["PATH"]))
        self.assertIsNone(shutil.which("python3.13", path=env["PATH"]))

        result = self.run_shell("bash", 'bash "$1/scripts/setup-new-machine.sh"',
                                repo, check=False, env=env)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("SKIP: uv or python3.13 not found", result.stdout)
        self.assertNotIn("PyRIT installed", result.stdout + result.stderr)
        self.assertFalse(self.pyrit_uv_log.exists())

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
