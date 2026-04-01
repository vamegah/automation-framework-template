import re

import requests

from tests.utils.accessibility_artifact import (
    AccessibilityNode,
    create_heuristic_violation,
    write_accessibility_artifact,
)


def _collect_signals(html: str) -> dict[str, int]:
    return {
        "h1_count": len(re.findall(r"<h1\b", html, flags=re.IGNORECASE)),
        "label_count": len(re.findall(r"<label\b", html, flags=re.IGNORECASE)),
        "labelled_control_count": len(re.findall(r"<label[^>]+for=", html, flags=re.IGNORECASE)),
        "meaningful_alt_count": len(re.findall(r'<img[^>]+alt="[^"\s][^"]*"', html, flags=re.IGNORECASE)),
        "missing_alt_count": len(re.findall(r'<img(?![^>]*alt=)|<img[^>]*alt=""', html, flags=re.IGNORECASE)),
        "generic_link_text_count": len(re.findall(r">\s*click here\s*<", html, flags=re.IGNORECASE)),
        "non_semantic_interactive_count": len(
            re.findall(r"<(div|span)[^>]*(onclick|tabindex=|cursor:\s*pointer)[^>]*>", html, flags=re.IGNORECASE)
        ),
    }


def test_axibly_accessible_demo_passes_stronger_axe_style_accessibility_heuristics():
    response = requests.get("https://axibly.ai/demo/accessible", timeout=20)
    html = response.text
    signals = _collect_signals(html)
    write_accessibility_artifact(
        suite_name="Axibly Accessibility Demo",
        test_name="accessible demo passes stronger axe-style accessibility heuristics",
        page_name="accessible",
        url="https://axibly.ai/demo/accessible",
        violations=[],
        metrics=signals,
    )

    assert response.status_code == 200
    assert "Accessible Demo Page" in html
    assert signals["h1_count"] == 1
    assert signals["label_count"] > 1
    assert signals["labelled_control_count"] > 1
    assert signals["meaningful_alt_count"] > 0
    assert signals["generic_link_text_count"] == 0
    assert signals["non_semantic_interactive_count"] == 0
    assert signals["missing_alt_count"] == 0


def test_axibly_inaccessible_demo_exposes_multiple_axe_style_accessibility_antipatterns():
    response = requests.get("https://axibly.ai/demo/inaccessible", timeout=20)
    html = response.text
    signals = _collect_signals(html)
    violations = [
        create_heuristic_violation(
            violation_id="generic-link-text",
            impact="serious",
            help_text="Links should use descriptive text",
            help_url="https://dequeuniversity.com/rules/axe/4.11/link-name",
            description='Generic link text such as "click here" makes navigation less accessible.',
            nodes=[
                AccessibilityNode(
                    target=["a"],
                    html="<a>click here</a>",
                    failure_summary="The page contains non-descriptive link text.",
                )
            ],
        ),
        create_heuristic_violation(
            violation_id="image-alt",
            impact="critical",
            help_text="Images must have alternative text",
            help_url="https://dequeuniversity.com/rules/axe/4.11/image-alt",
            description="Informative images should have a meaningful alt attribute.",
            nodes=[
                AccessibilityNode(
                    target=["img"],
                    html="<img>",
                    failure_summary="Detected an image with a missing or empty alt attribute.",
                )
            ],
        ),
    ]
    write_accessibility_artifact(
        suite_name="Axibly Accessibility Demo",
        test_name="inaccessible demo exposes multiple axe-style accessibility antipatterns",
        page_name="inaccessible",
        url="https://axibly.ai/demo/inaccessible",
        violations=violations,
        metrics=signals,
    )

    assert response.status_code == 200
    assert "Inaccessible Demo Page" in html
    assert "Div used as button" in html
    assert signals["label_count"] < 2
    assert signals["generic_link_text_count"] > 0
    assert signals["missing_alt_count"] > 0
