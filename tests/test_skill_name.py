"""Exercise pai-new-skill names in disposable checkouts and homes."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ALIASES = Path(__file__).resolve().parents[1] / "scripts/pai-aliases.sh"


class SkillNameTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="forge-skill-name-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.home = self.root / "home"
        self.home.mkdir()
        self.repo = self.home / "PAI"
        (self.repo / "scripts").mkdir(parents=True)
        (self.repo / ".claude/skills").mkdir(parents=True)
        self.aliases = self.repo / "scripts/pai-aliases.sh"
        shutil.copy2(ALIASES, self.aliases)

        self.env = {key: value for key, value in os.environ.items()
                    if not key.startswith("GIT_")}
        self.env.update(
            HOME=str(self.home),
            ZDOTDIR=str(self.home),
            XDG_CONFIG_HOME=str(self.home / ".config"),
            GIT_CONFIG_NOSYSTEM="1",
            GIT_CONFIG_GLOBAL="/dev/null",
            GIT_TERMINAL_PROMPT="0",
        )
        for name in ("BASH_ENV", "ENV", "ZSH_VERSION", "FORGE_REPO_DIR", "PAI_DIR"):
            self.env.pop(name, None)

        subprocess.run(["git", "init", "-q", str(self.repo)], check=True, env=self.env)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.name", "Fixture"],
                       check=True, env=self.env)

    def invoke(self, shell, *arguments):
        executable = shutil.which(shell)
        self.assertIsNotNone(executable, f"Required test shell is missing: {shell}")
        flags = ["--noprofile", "--norc"] if shell == "bash" else ["-f"]
        command = '''
source "$1" || exit 90
if [ "$#" -gt 2 ]; then
    pai-new-skill "$2" "$3"
elif [ "$#" -eq 2 ]; then
    pai-new-skill "$2"
else
    pai-new-skill
fi
'''
        return subprocess.run(
            [executable, *flags, "-c", command, "skill-fixture", str(self.aliases),
             *arguments],
            cwd=self.root,
            env=self.env,
            capture_output=True,
            text=True,
        )

    def tree_entries(self):
        return {path.relative_to(self.root) for path in self.root.rglob("*")}

    def test_safe_single_component_creates_template_in_both_shells(self):
        for shell in ("bash", "zsh"):
            with self.subTest(shell=shell):
                name = f"Review_Skill-1.v2-{shell}"
                result = self.invoke(shell, name)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                skill_dir = self.repo / ".claude/skills" / name
                self.assertTrue((skill_dir / "SKILL.md").is_file())
                for child in ("workflows", "reference", "tools"):
                    self.assertTrue((skill_dir / child).is_dir())
                self.assertIn(f"skill: {name}", (skill_dir / "SKILL.md").read_text())

    def test_invalid_names_are_rejected_before_filesystem_changes(self):
        invalid_names = (
            "",
            ".",
            "..",
            "-option",
            "line\nbreak",
            "Café",
            "../../../escaped-{shell}",
            "/tmp/absolute-name-{shell}",
            "Nested/Skill-{shell}",
            "Nested\\Skill-{shell}",
            "bad name-{shell}",
            "../outside-{shell}",
        )
        for shell in ("bash", "zsh"):
            for name_template in invalid_names:
                name = name_template.format(shell=shell)
                with self.subTest(shell=shell, name=name):
                    before = self.tree_entries()
                    result = self.invoke(shell, name)
                    after = self.tree_entries()
                    self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
                    self.assertIn("Error: skill name", result.stdout + result.stderr)
                    self.assertEqual(after, before, result.stdout + result.stderr)

    def test_requires_exactly_one_argument(self):
        for shell in ("bash", "zsh"):
            for arguments in ((), ("SingleSkill", "ignored")):
                with self.subTest(shell=shell, arguments=arguments):
                    before = self.tree_entries()
                    result = self.invoke(shell, *arguments)
                    self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
                    self.assertEqual(self.tree_entries(), before, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
