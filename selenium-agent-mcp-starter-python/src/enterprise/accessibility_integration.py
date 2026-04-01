from src.enterprise.models import AccessibilityCoverageArtifact, AccessibilityFinding, AccessibilityRecommendation


class EnterpriseAccessibilityAnalyzer:
    def analyze(self, findings: list[AccessibilityFinding]) -> AccessibilityCoverageArtifact:
        recommendations = [self._recommend(finding) for finding in findings]
        urgent_count = sum(1 for finding in findings if finding.impact in {"critical", "serious"})
        return AccessibilityCoverageArtifact(
            summary=f"{len(findings)} accessibility finding(s) analyzed, {urgent_count} requiring urgent remediation.",
            recommendations=recommendations,
            assertions=[recommendation.assertion for recommendation in recommendations],
        )

    def _recommend(self, finding: AccessibilityFinding) -> AccessibilityRecommendation:
        if finding.rule == "image-alt":
            return AccessibilityRecommendation(
                finding_id=finding.id,
                fix="Add meaningful alt text or mark decorative images with empty alt attributes.",
                assertion=f"assert page.get_attribute('{finding.selector}', 'alt')",
            )
        if finding.rule == "label":
            return AccessibilityRecommendation(
                finding_id=finding.id,
                fix="Associate the control with a visible label or aria-label.",
                assertion=f"assert page.get_attribute('{finding.selector}', 'aria-label')",
            )
        return AccessibilityRecommendation(
            finding_id=finding.id,
            fix="Improve semantic structure or ARIA support for this control.",
            assertion=f"assert page.is_visible('{finding.selector}')",
        )
