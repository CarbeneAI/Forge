"""Exercise .env setup in disposable homes without installing tools."""
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
INSTALLER = REPO_ROOT / "scripts" / "setup-new-machine.sh"


class EnvFileSetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="forge-env-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / "user home"
        self.home.mkdir()
        self.repo = self.home / "PAI"
        self.claude = self.repo / ".claude"
        self.scripts = self.repo / "scripts"
        self.scripts.mkdir(parents=True)
        self.claude.mkdir()
        shutil.copy2(INSTALLER, self.scripts / INSTALLER.name)

        self.bin = self.root / "bin"
        self.bin.mkdir()
        bun = self.bin / "bun"
        bun.write_text("#!/bin/sh\necho test-bun\n")
        bun.chmod(0o755)

        self.env_file = self.claude / ".env"
        self.env = os.environ.copy()
        self.env.update(
            HOME=str(self.home),
            PATH=f"{self.bin}:/usr/bin:/bin:/usr/sbin:/sbin",
            ZDOTDIR=str(self.home),
            FORGE_TEST_ENV_FILE=str(self.env_file),
        )
        for name in ("BASH_ENV", "ENV", "ZSH_VERSION", "PAI_DIR", "FORGE_REPO_DIR"):
            self.env.pop(name, None)

    def run_setup(self, *, env=None):
        child_env = dict(self.env, **(env or {}))
        return subprocess.run(
            ["/bin/bash", "-c", 'umask 022; exec /bin/bash "$1"', "forge-test",
             str(self.scripts / INSTALLER.name)],
            cwd=self.root,
            env=child_env,
            capture_output=True,
            text=True,
        )

    def assert_private_mode(self):
        self.assertEqual(stat.S_IMODE(self.env_file.stat().st_mode), 0o600)

    def test_temporary_env_links_are_ignored_but_example_remains_trackable(self):
        ignored = subprocess.run(
            ["git", "check-ignore", "--no-index", "-q", "--", ".claude/.env.tmp.fixture"],
            cwd=REPO_ROOT,
        )
        trackable = subprocess.run(
            ["git", "check-ignore", "--no-index", "-q", "--", ".claude/.env.example"],
            cwd=REPO_ROOT,
        )

        self.assertEqual(ignored.returncode, 0, "temporary env links must be ignored")
        self.assertEqual(trackable.returncode, 1, ".env.example must remain trackable")

    def test_template_copy_is_private_under_permissive_umask(self):
        secret = "EXAMPLE_KEY=fixture-template-secret\n"
        (self.claude / ".env.example").write_text(secret)

        result = self.run_setup()

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.env_file.read_text(), secret)
        self.assert_private_mode()
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)

    def test_fallback_file_is_private_under_permissive_umask(self):
        result = self.run_setup()

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("# PAI Environment Variables", self.env_file.read_text())
        self.assert_private_mode()

    def test_existing_file_content_and_mode_are_preserved_on_rerun(self):
        secret = "PRIVATE_KEY=fixture-existing-secret\n"
        self.env_file.write_text(secret)
        self.env_file.chmod(0o640)

        for _ in range(2):
            result = self.run_setup()
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(self.env_file.read_text(), secret)
            self.assertEqual(stat.S_IMODE(self.env_file.stat().st_mode), 0o640)
            self.assertNotIn(secret.strip(), result.stdout + result.stderr)

    def test_symlink_destination_is_rejected_without_touching_target(self):
        secret = "OUTSIDE_KEY=fixture-outside-secret\n"
        target = self.root / "outside.env"
        target.write_text(secret)
        target.chmod(0o640)
        self.env_file.symlink_to(target)

        result = self.run_setup()

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.env_file.is_symlink())
        self.assertEqual(target.read_text(), secret)
        self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o640)
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)

    def test_nonregular_destination_is_rejected_without_removing_contents(self):
        self.env_file.mkdir()
        marker = self.env_file / "keep.txt"
        marker.write_text("keep")

        result = self.run_setup()

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(marker.read_text(), "keep")

    def test_template_read_failure_returns_nonzero_without_logging_contents(self):
        secret = "EXAMPLE_KEY=fixture-hidden-secret\n"
        (self.claude / ".env.example").write_text(secret)
        cat = self.bin / "cat"
        cat.write_text("#!/bin/sh\necho 'fixture read failure' >&2\nexit 23\n")
        cat.chmod(0o755)

        result = self.run_setup()

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse(self.env_file.exists())
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)
        self.assertNotIn("Created .env", result.stdout + result.stderr)
        self.assertEqual(list(self.claude.glob(".env.tmp.*")), [])

    def test_temp_cleanup_failure_does_not_report_success(self):
        secret = "EXAMPLE_KEY=fixture-cleanup-secret\n"
        (self.claude / ".env.example").write_text(secret)
        rm = self.bin / "rm"
        rm.write_text(
            "#!/bin/sh\n"
            "case \"$*\" in\n"
            "  *\".env.tmp.\"*) echo 'fixture cleanup failure' >&2; exit 23 ;;\n"
            "esac\n"
            "exec /bin/rm \"$@\"\n"
        )
        rm.chmod(0o755)

        result = self.run_setup()

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.env_file.read_text(), secret)
        leftovers = list(self.claude.glob(".env.tmp.*"))
        self.assertEqual(len(leftovers), 1)
        self.assertEqual(os.stat(self.env_file).st_ino, os.stat(leftovers[0]).st_ino)
        self.assertNotIn("Created .env", result.stdout + result.stderr)
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)

    def test_destination_created_during_setup_is_not_followed_or_overwritten(self):
        secret = "EXAMPLE_KEY=fixture-race-secret\n"
        (self.claude / ".env.example").write_text(secret)
        target = self.root / "raced-target.env"
        target.write_text("KEEP=fixture-race-target\n")
        mktemp = self.bin / "mktemp"
        mktemp.write_text(
            "#!/bin/sh\n"
            "/usr/bin/mktemp \"$@\" || exit $?\n"
            "ln -s \"$FORGE_TEST_RACE_TARGET\" \"$FORGE_TEST_ENV_FILE\"\n"
        )
        mktemp.chmod(0o755)

        result = self.run_setup(env={"FORGE_TEST_RACE_TARGET": str(target)})

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.env_file.is_symlink())
        self.assertEqual(target.read_text(), "KEEP=fixture-race-target\n")
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)
        self.assertEqual(list(self.claude.glob(".env.tmp.*")), [])

    def test_destination_directory_created_during_setup_is_not_used_as_container(self):
        secret = "EXAMPLE_KEY=fixture-directory-race-secret\n"
        (self.claude / ".env.example").write_text(secret)
        mktemp = self.bin / "mktemp"
        mktemp.write_text(
            "#!/bin/sh\n"
            "/usr/bin/mktemp \"$@\" || exit $?\n"
            "mkdir \"$FORGE_TEST_ENV_FILE\"\n"
        )
        mktemp.chmod(0o755)

        result = self.run_setup()

        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(self.env_file.is_dir())
        self.assertEqual(list(self.env_file.iterdir()), [])
        self.assertNotIn(secret.strip(), result.stdout + result.stderr)
        self.assertEqual(list(self.claude.glob(".env.tmp.*")), [])


if __name__ == "__main__":
    unittest.main()
