from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "accessibility-report"


@dataclass
class AccessibilityNode:
    target: list[str]
    html: str
    failure_summary: str = ""


@dataclass
class AccessibilityViolation:
    id: str
    impact: str
    help: str
    help_url: str
    description: str
    nodes: list[AccessibilityNode]


def create_heuristic_violation(
    *,
    violation_id: str,
    impact: str,
    help_text: str,
    help_url: str,
    description: str,
    nodes: list[AccessibilityNode],
) -> AccessibilityViolation:
    return AccessibilityViolation(
        id=violation_id,
        impact=impact,
        help=help_text,
        help_url=help_url,
        description=description,
        nodes=nodes,
    )


def _to_markdown(artifact: dict[str, Any]) -> str:
    lines = [
        "# Accessibility Report",
        "",
        f"- Test: {artifact['test_name']}",
        f"- Page: {artifact['page_name']}",
        f"- URL: {artifact['url']}",
        f"- Created: {artifact['created_at']}",
        f"- Violations: {len(artifact['violations'])}",
        "",
    ]

    metrics = artifact.get("metrics") or {}
    if metrics:
        lines.append("## Metrics")
        for key, value in metrics.items():
            lines.append(f"- {key}: {value}")
        lines.append("")

    if not artifact["violations"]:
        lines.append("No violations detected.")
        return "\n".join(lines)

    for index, violation in enumerate(artifact["violations"], start=1):
        lines.append(f"## {index}. {violation['id']}")
        lines.append(f"- Impact: {violation['impact']}")
        lines.append(f"- Help: {violation['help']}")
        lines.append(f"- Help URL: {violation['help_url']}")
        lines.append(f"- Description: {violation['description']}")
        lines.append(f"- Nodes: {len(violation['nodes'])}")
        lines.append("")

        for node_index, node in enumerate(violation["nodes"], start=1):
            lines.append(f"### Node {node_index}")
            lines.append(f"- Target: {' | '.join(node['target'])}")
            if node.get("failure_summary"):
                lines.append(f"- Summary: {' '.join(node['failure_summary'].split())}")
            lines.append(f"- HTML: `{ ' '.join(node['html'].split())[:240] }`")
            lines.append("")

    return "\n".join(lines)


def write_accessibility_artifact(
    *,
    suite_name: str,
    test_name: str,
    page_name: str,
    url: str,
    violations: list[AccessibilityViolation],
    metrics: dict[str, int] | None = None,
) -> dict[str, str]:
    report_dir = PROJECT_ROOT / "test-results" / "accessibility" / _slugify(suite_name)
    report_dir.mkdir(parents=True, exist_ok=True)

    artifact = {
        "suite_name": suite_name,
        "test_name": test_name,
        "page_name": page_name,
        "url": url,
        "violations": [asdict(violation) for violation in violations],
        "metrics": metrics or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    file_stem = _slugify(f"{test_name}-{page_name}")
    json_path = report_dir / f"{file_stem}.json"
    markdown_path = report_dir / f"{file_stem}.md"

    json_path.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    markdown_path.write_text(_to_markdown(artifact), encoding="utf-8")

    return {
      "json_path": str(json_path),
      "markdown_path": str(markdown_path),
    }
