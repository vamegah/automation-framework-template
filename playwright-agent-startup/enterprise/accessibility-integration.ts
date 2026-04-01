import { AccessibilityCoverageArtifact, AccessibilityFinding, AccessibilityRecommendation } from './types';

function recommendFix(finding: AccessibilityFinding): AccessibilityRecommendation {
  if (finding.rule === 'image-alt') {
    return {
      findingId: finding.id,
      fix: 'Add meaningful alt text or mark decorative images with empty alt attributes.',
      assertion: `await expect(page.locator('${finding.selector}')).toHaveAttribute('alt', /.+/);`,
    };
  }

  if (finding.rule === 'label') {
    return {
      findingId: finding.id,
      fix: 'Associate the control with a visible label or aria-label.',
      assertion: `await expect(page.locator('${finding.selector}')).toHaveAccessibleName(/.+/);`,
    };
  }

  return {
    findingId: finding.id,
    fix: 'Improve semantic structure or ARIA support for this control.',
    assertion: `await expect(page.locator('${finding.selector}')).toBeVisible();`,
  };
}

export function analyzeAccessibilityFindings(findings: AccessibilityFinding[]): AccessibilityCoverageArtifact {
  const recommendations = findings.map(recommendFix);
  const criticalCount = findings.filter((finding) => finding.impact === 'critical' || finding.impact === 'serious').length;

  return {
    summary: `${findings.length} accessibility finding(s) analyzed, ${criticalCount} requiring urgent remediation.`,
    recommendations,
    assertions: recommendations.map((item) => item.assertion),
  };
}
