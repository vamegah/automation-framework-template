import json
from pathlib import Path

from selenium.webdriver.common.by import By

from src.agents.base_agent import BaseAgent
from src.config.driver_factory import DriverFactory
from src.pages.login_page import LoginPage


class TestGeneratorAgent(BaseAgent):
    def execute(self, task_definition_path: str):
        repo_root = Path(__file__).resolve().parents[2]
        map_path = (repo_root / task_definition_path).resolve()

        with open(map_path, "r", encoding="utf-8") as file:
            raw_content = file.read()
            agent_map = json.loads(self._interpolate_env(raw_content))

        self._generate_artifacts(repo_root, agent_map["tasks"])
        self._execute_tasks(agent_map["tasks"])

    def _execute_tasks(self, tasks):
        driver = DriverFactory.create_driver()

        try:
            for task in tasks:
                driver.get(task["url"])

                for action in task["actions"]:
                    action_type = action["type"]

                    if action_type == "navigate":
                        driver.get(action.get("url", task["url"]))
                    elif action_type == "login":
                        login_page = LoginPage(driver)
                        login_page.login(action.get("username", ""), action.get("password", ""))
                    elif action_type == "click":
                        driver.find_element(By.CSS_SELECTOR, action.get("selector", "body")).click()
                    elif action_type == "type":
                        element = driver.find_element(By.CSS_SELECTOR, action.get("selector", "body"))
                        element.clear()
                        element.send_keys(action.get("value", ""))
                    elif action_type == "assertText":
                        body_text = driver.find_element(By.TAG_NAME, "body").text
                        expected = action.get("value") or action.get("text", "")
                        if expected not in body_text:
                            raise AssertionError(f"Expected page to contain '{expected}'")
                    elif action_type == "assertUrl":
                        current_url = driver.current_url
                        expected_url = action.get("url", "")
                        if expected_url not in current_url:
                            raise AssertionError(f"Expected URL '{current_url}' to include '{expected_url}'")
                    elif action_type == "screenshot":
                        screenshot_path = Path(action.get("path", "./screenshots/generated.png"))
                        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
                        driver.save_screenshot(str(screenshot_path))
        finally:
            DriverFactory.quit_driver(driver)

    def _generate_artifacts(self, repo_root: Path, tasks):
        output_dir = repo_root / "tests" / "generated"
        report_path = repo_root / "docs" / "generated-coverage.md"
        output_dir.mkdir(parents=True, exist_ok=True)
        report_path.parent.mkdir(parents=True, exist_ok=True)

        (output_dir / "test_ai_generated.py").write_text(self._render_pytest(tasks), encoding="utf-8")
        report_path.write_text(self._render_coverage(repo_root, tasks), encoding="utf-8")

    def _render_pytest(self, tasks) -> str:
        test_blocks = []
        for index, task in enumerate(tasks):
            name = self._to_snake_case(task.get("name", f"generated_task_{index + 1}"))
            lines = [
                f"def test_{name}(driver):",
                f"    login_page = LoginPage(driver)",
                f"    login_page.navigate_to({task['url']!r})",
            ]
            lines.extend(self._render_step(action) for action in task["actions"])
            test_blocks.append("\n".join(lines))

        return "\n\n".join(
            [
                "from selenium.webdriver.common.by import By",
                "from src.pages.login_page import LoginPage",
                "",
                *test_blocks,
                "",
            ]
        )

    def _render_step(self, action) -> str:
        action_type = action["type"]
        if action_type == "navigate":
            return f"    login_page.navigate_to({action.get('url', '/')!r})"
        if action_type == "login":
            return f"    login_page.login({action.get('username', '')!r}, {action.get('password', '')!r})"
        if action_type == "click":
            return f"    login_page.click((By.CSS_SELECTOR, {action.get('selector', 'body')!r}))"
        if action_type == "type":
            return f"    login_page.type((By.CSS_SELECTOR, {action.get('selector', 'body')!r}), {action.get('value', '')!r})"
        if action_type == "assertText":
            expected = action.get("value") or action.get("text", "")
            return f"    assert {expected!r} in driver.find_element(By.TAG_NAME, 'body').text"
        if action_type == "assertUrl":
            return f"    assert {action.get('url', '')!r} in driver.current_url"
        if action_type == "screenshot":
            return f"    driver.save_screenshot({action.get('path', './screenshots/generated.png')!r})"
        return "    # Unsupported action"

    def _render_coverage(self, repo_root: Path, tasks) -> str:
        existing_tests = sorted(
            str(path.relative_to(repo_root)).replace("\\", "/") for path in (repo_root / "tests").rglob("test_*.py")
        )
        missing = []
        for task in tasks:
            task_name = self._to_snake_case(task.get("name", task["url"]))
            if not any(task_name in existing_test for existing_test in existing_tests):
                missing.append(task.get("name", task["url"]))

        lines = ["## Selenium Python Coverage Report", "", "### Covered"]
        lines.extend(f"- [x] {test_file}" for test_file in existing_tests)
        lines.extend(["", "### Missing"])
        if missing:
            lines.extend(f"- [ ] {item}" for item in missing)
        else:
            lines.append("- [x] No obvious gaps detected")
        lines.append("")
        return "\n".join(lines)

    def _to_snake_case(self, value: str) -> str:
        return "_".join(part for part in "".join(ch.lower() if ch.isalnum() else " " for ch in value).split())

    def _interpolate_env(self, content: str) -> str:
        import os
        import re

        return re.sub(r"\$\{([A-Z0-9_]+)\}", lambda match: os.getenv(match.group(1), ""), content)
