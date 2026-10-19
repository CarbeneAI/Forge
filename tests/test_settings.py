"""Exercise the real settings helper with disposable files and explicit I/O failures."""
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "scripts/configure-settings.mjs"


class SettingsTests(unittest.TestCase):
    def setUp(self):
        self.bun = shutil.which("bun")
        self.assertIsNotNone(self.bun, "Bun is required for settings fixtures")
        self.temp = tempfile.TemporaryDirectory(prefix="forge-settings-")
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name).resolve()
        self.settings = self.directory / "settings.json"
        self.target = self.directory / "runtime's quote\" and back\\slash\nnewline"

    def invoke(self, preload=None):
        command = [self.bun, "--no-env-file"]
        if preload:
            script = self.directory / "failure.ts"
            script.write_text(preload)
            command += ["--preload", str(script)]
        command += [str(HELPER), str(self.settings), str(self.target)]
        return subprocess.run(command, cwd=self.directory, capture_output=True, text=True, timeout=10)

    def seed(self):
        original = '{"env":{"PAI_DIR":"/old","SECRET":"fixture-secret"},"keep":[1,2.5,true]}'
        self.settings.write_text(original)
        self.settings.chmod(0o640)
        return original

    def assert_no_temporary(self):
        self.assertEqual(list(self.directory.glob(".settings.tmp.*")), [])

    def test_missing_file_warns_without_creating_it(self):
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WARNING", result.stdout)
        self.assertFalse(self.settings.exists())
        self.assert_no_temporary()

    def test_missing_optional_entry_is_byte_for_byte_unchanged(self):
        for original in ('{ "other": true }', '{"env":{ "OTHER":"fixture-secret" }}'):
            with self.subTest(original=original):
                self.settings.write_text(original)
                result = self.invoke()
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("WARNING", result.stdout)
                self.assertEqual(self.settings.read_text(), original)
                self.assertNotIn("fixture-secret", result.stdout + result.stderr)
                self.assert_no_temporary()

    def test_invalid_documents_and_unsafe_numbers_are_not_rewritten_or_logged(self):
        for original in ('{"secret":"fixture-secret",', '[]', 'null', '{"env":[]}',
                         '{"env":null}', '{"env":{"PAI_DIR":42}}',
                         '{"env":{"PAI_DIR":"/old"},"id":9007199254740993}',
                         '{"env":{"PAI_DIR":"/old"},"count":1e400}'):
            with self.subTest(original=original):
                self.settings.write_text(original)
                result = self.invoke()
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.settings.read_text(), original)
                self.assertNotIn("fixture-secret", result.stdout + result.stderr)
                self.assertNotIn("OK:", result.stdout)
                self.assert_no_temporary()

    def test_symlink_and_directory_targets_are_rejected(self):
        outside = self.directory / "outside.json"
        outside.write_text('{"env":{"PAI_DIR":"fixture-secret"}}')
        self.settings.symlink_to(outside)
        result = self.invoke()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(self.settings.is_symlink())
        self.assertIn("fixture-secret", outside.read_text())
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)
        self.settings.unlink()
        self.settings.mkdir()
        result = self.invoke()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(self.settings.is_dir())
        self.assert_no_temporary()

    def test_parsed_values_mode_and_escaped_path_survive_update(self):
        original = json.loads(self.seed())
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        original["env"]["PAI_DIR"] = str(self.target)
        self.assertEqual(json.loads(self.settings.read_text()), original)
        self.assertEqual(stat.S_IMODE(self.settings.stat().st_mode), 0o640)
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)
        self.assert_no_temporary()

    def test_already_correct_setting_preserves_original_format(self):
        original = json.dumps({"env": {"PAI_DIR": str(self.target)}})
        self.settings.write_text(original)
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(self.settings.read_text(), original)
        self.assert_no_temporary()

    def test_partial_write_failure_preserves_original_and_removes_private_temp(self):
        original = self.seed()
        result = self.invoke('''import { mock } from 'bun:test';
import * as fs from 'node:fs';
import { dirname } from 'node:path';
const originalWrite = fs.writeFileSync;
mock.module('node:fs', () => ({ ...fs, writeFileSync(path, data, options) {
  originalWrite(path, 'partial synthetic settings', options);
  console.log(`fixture-modes:${fs.statSync(path).mode & 0o777}:${fs.statSync(dirname(path)).mode & 0o777}`);
  throw new Error('fixture-secret disk failure');
} }));''')
        self.assertNotEqual(result.returncode, 0)
        # Assert observations outside the helper's expected error path so a
        # failed mode check cannot be mistaken for the injected write failure.
        self.assertIn("fixture-modes:384:448", result.stdout)
        self.assertEqual(self.settings.read_text(), original)
        self.assertEqual(stat.S_IMODE(self.settings.stat().st_mode), 0o640)
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)
        self.assert_no_temporary()

    def test_publish_failure_preserves_original_and_cleans_staged_file(self):
        original = self.seed()
        result = self.invoke('''import { mock } from 'bun:test';
import * as fs from 'node:fs';
mock.module('node:fs', () => ({ ...fs, renameSync() { throw new Error('fixture-secret rename failure'); } }));''')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.settings.read_text(), original)
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)
        self.assert_no_temporary()

    def test_cleanup_failure_is_reported_after_publication(self):
        self.seed()
        result = self.invoke('''import { mock } from 'bun:test';
import * as fs from 'node:fs';
mock.module('node:fs', () => ({ ...fs, rmSync() { throw new Error('fixture-secret cleanup failure'); } }));''')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(json.loads(self.settings.read_text())["env"]["PAI_DIR"], str(self.target))
        self.assertIn("temporary directory", result.stderr)
        self.assertNotIn("OK:", result.stdout)
        self.assertNotIn("fixture-secret", result.stdout + result.stderr)
        temporary = list(self.directory.glob(".settings.tmp.*"))
        self.assertEqual(len(temporary), 1)
        self.assertEqual(stat.S_IMODE(temporary[0].stat().st_mode), 0o700)

    def test_private_temp_directory_is_ignored(self):
        result = subprocess.run(["git", "check-ignore", "--no-index", "-q", "--",
                                 ".claude/.settings.tmp.fixture/settings.json"], cwd=ROOT)
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
