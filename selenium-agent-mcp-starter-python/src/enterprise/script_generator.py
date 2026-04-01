import re
from pathlib import Path

from src.enterprise.models import GeneratedTestCase, ReviewComment


class EnterpriseScriptGenerator:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.pages_dir = repo_root / "src" / "pages"

    def discover_page_objects(self) -> list[dict[str, str]]:
        discovered: list[dict[str, str]] = []
        for path in sorted(self.pages_dir.glob("*_page.py")):
            if path.name in {"base_page.py", "__init__.py"}:
                continue
            class_name = self._read_first_class_name(path)
            if class_name:
                discovered.append(
                    {
                        "module": path.stem,
                        "className": class_name,
                        "path": str(path.relative_to(self.repo_root)).replace("\\", "/"),
                    }
                )
        return discovered

    def generate_python_script(self, test_case: GeneratedTestCase) -> str:
        page_objects = self.discover_page_objects()
        preferred_page = next((page for page in page_objects if page["className"] == "LoginPage"), page_objects[0])
        return "\n".join(
            [
                "from src.config.settings import resolve_secret",
                "from src.pages import " + preferred_page["className"],
                "",
                "",
                f"def test_{self._slugify(test_case.requirement_id)}(driver, base_url):",
                f"    page = {preferred_page['className']}(driver)",
                "    page.navigate_to(base_url)",
                "    username = resolve_secret('ENTERPRISE_USERNAME', default='standard_user')",
                "    password = resolve_secret('ENTERPRISE_PASSWORD', default='secret_sauce')",
                "    page.login(username, password)",
                f"    # Requirement traceability: {test_case.requirement_id}",
                f"    assert {test_case.criticality_score} >= 1",
                "",
            ]
        )

    def generate_csharp_script(self, test_case: GeneratedTestCase) -> str:
        return "\n".join(
            [
                "using System;",
                "using OpenQA.Selenium;",
                "",
                f"// Requirement traceability: {test_case.requirement_id}",
                f"public class {self._pascal_case(test_case.requirement_id)}GeneratedTest",
                "{",
                "    public void Execute(IWebDriver driver)",
                "    {",
                '        var username = Environment.GetEnvironmentVariable("VAULT_SECRET_REF") ?? "vault://team/app/username";',
                '        var password = Environment.GetEnvironmentVariable("AWS_SECRET_REF") ?? "aws-sm://team/app/password";',
                "        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))",
                "        {",
                '            throw new InvalidOperationException("Secrets must be injected at runtime.");',
                "        }",
                "    }",
                "}",
                "",
            ]
        )

    def review_script(self, content: str) -> list[ReviewComment]:
        comments: list[ReviewComment] = []
        rules = [
            (r"\btime\.sleep\(", "no-sleeps", "high", "Replace sleep calls with explicit waits."),
            (r"\bThread\.Sleep\(", "no-thread-sleep", "high", "Replace Thread.Sleep with explicit waits."),
            (r"secret_sauce|standard_user|password\s*=", "no-hardcoded-credentials", "critical", "Secrets must come from Vault or AWS Secrets Manager placeholders."),
            (r"find_element\(", "pom-reuse", "medium", "Prefer centralized page objects over inline locators."),
        ]
        for pattern, rule_id, severity, message in rules:
            if re.search(pattern, content):
                comments.append(ReviewComment(rule_id=rule_id, severity=severity, message=message))
        return comments

    def _read_first_class_name(self, path: Path) -> str:
        match = re.search(r"class\s+([A-Za-z0-9_]+)\s*[\(:]", path.read_text(encoding="utf-8"))
        return match.group(1) if match else ""

    def _slugify(self, value: str) -> str:
        return "_".join(part for part in re.sub(r"[^A-Za-z0-9]+", " ", value).lower().split())

    def _pascal_case(self, value: str) -> str:
        return "".join(word.capitalize() for word in re.sub(r"[^A-Za-z0-9]+", " ", value).split())
