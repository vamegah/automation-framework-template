from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
REPORTS_DIR = ROOT_DIR / "test-results"
OUTPUT_JSON = REPORTS_DIR / "accessibility-index.json"
OUTPUT_MARKDOWN = REPORTS_DIR / "accessibility-index.md"


def _walk_json_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return [path for path in directory.rglob("*.json") if path.is_file()]


def _is_accessibility_artifact(value: Any) -> bool:
    return (
        isinstance(value, dict)
        and isinstance(value.get("suite_name"), str)
        and isinstance(value.get("test_name"), str)
        and isinstance(value.get("page_name"), str)
        and isinstance(value.get("url"), str)
        and isinstance(value.get("created_at"), str)
        and isinstance(value.get("violations"), list)
    )


def _read_artifacts() -> list[dict[str, Any]]:
    artifacts: list[dict[str, Any]] = []
    for file_path in _walk_json_files(REPORTS_DIR):
        try:
            parsed = json.loads(file_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        if _is_accessibility_artifact(parsed):
            parsed["source_path"] = file_path.relative_to(ROOT_DIR).as_posix()
            artifacts.append(parsed)

    return artifacts


def _preference_score(artifact: dict[str, Any]) -> int:
    source_path = artifact["source_path"]
    if "/accessibility/" in source_path:
        return 2
    if "/attachments/" in source_path:
        return 1
    return 0


def _latest_by_key(artifacts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}

    for artifact in artifacts:
        key = f"{artifact['suite_name']}::{artifact['test_name']}::{artifact['page_name']}"
        current = latest.get(key)
        artifact_time = datetime.fromisoformat(artifact["created_at"].replace("Z", "+00:00")).timestamp()
        current_time = (
            datetime.fromisoformat(current["created_at"].replace("Z", "+00:00")).timestamp()
            if current
            else -1
        )

        if (
            current is None
            or artifact_time > current_time
            or (
                artifact_time == current_time
                and _preference_score(artifact) > _preference_score(current)
            )
        ):
            latest[key] = artifact

    return sorted(
        latest.values(),
        key=lambda artifact: f"{artifact['suite_name']}{artifact['test_name']}{artifact['page_name']}",
    )


def _summarize_violations(violations: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "count": len(violations),
        "ids": sorted({violation["id"] for violation in violations}),
        "impacts": sorted({violation.get("impact", "unknown") for violation in violations}) or ["none"],
        "nodes": sum(len(violation.get("nodes", [])) for violation in violations),
    }


def _to_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Accessibility Index",
        "",
        f"- Generated: {summary['generated_at']}",
        f"- Project: {summary['project_name']}",
        f"- Reports: {len(summary['reports'])}",
        "",
    ]

    if not summary["reports"]:
        lines.append("No accessibility artifacts found.")
        return "\n".join(lines)

    for index, report in enumerate(summary["reports"], start=1):
        lines.append(f"## {index}. {report['suite_name']} / {report['page_name']}")
        lines.append(f"- Test: {report['test_name']}")
        lines.append(f"- URL: {report['url']}")
        lines.append(f"- Created: {report['created_at']}")
        lines.append(f"- Violation Count: {report['summary']['count']}")
        lines.append(f"- Impacts: {', '.join(report['summary']['impacts'])}")
        ids = report["summary"]["ids"]
        lines.append(f"- IDs: {', '.join(ids) if ids else 'none'}")
        lines.append(f"- Source JSON: {report['source_path']}")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    artifacts = _latest_by_key(_read_artifacts())
    summary = {
        "project_name": ROOT_DIR.name,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "reports": [
            {
                "suite_name": artifact["suite_name"],
                "test_name": artifact["test_name"],
                "page_name": artifact["page_name"],
                "url": artifact["url"],
                "created_at": artifact["created_at"],
                "source_path": artifact["source_path"],
                "summary": _summarize_violations(artifact["violations"]),
            }
            for artifact in artifacts
        ],
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    OUTPUT_MARKDOWN.write_text(_to_markdown(summary), encoding="utf-8")

    print(f"Accessibility index written to {OUTPUT_JSON.relative_to(ROOT_DIR)}")
    print(f"Accessibility index written to {OUTPUT_MARKDOWN.relative_to(ROOT_DIR)}")


if __name__ == "__main__":
    main()
