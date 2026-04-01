package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.AccessibilityCoverageArtifact;
import com.example.enterprise.EnterpriseModels.AccessibilityFinding;
import com.example.enterprise.EnterpriseModels.AccessibilityRecommendation;

import java.util.ArrayList;
import java.util.List;

public class EnterpriseAccessibilityAnalyzer {
    public AccessibilityCoverageArtifact analyze(List<AccessibilityFinding> findings) {
        AccessibilityCoverageArtifact artifact = new AccessibilityCoverageArtifact();
        long urgentCount = findings.stream().filter(item -> "critical".equals(item.impact) || "serious".equals(item.impact)).count();
        artifact.summary = findings.size() + " accessibility finding(s) analyzed, " + urgentCount + " requiring urgent remediation.";

        List<AccessibilityRecommendation> recommendations = new ArrayList<>();
        for (AccessibilityFinding finding : findings) {
            recommendations.add(recommend(finding));
        }
        artifact.recommendations = recommendations;
        artifact.assertions = recommendations.stream().map(item -> item.assertion).toList();
        return artifact;
    }

    private AccessibilityRecommendation recommend(AccessibilityFinding finding) {
        AccessibilityRecommendation recommendation = new AccessibilityRecommendation();
        recommendation.findingId = finding.id;
        if ("image-alt".equals(finding.rule)) {
            recommendation.fix = "Add meaningful alt text or mark decorative images with empty alt attributes.";
            recommendation.assertion = "assertTrue(driver.findElement(By.cssSelector(\"" + finding.selector + "\")).getAttribute(\"alt\").matches(\".+\"));";
            return recommendation;
        }
        if ("label".equals(finding.rule)) {
            recommendation.fix = "Associate the control with a visible label or aria-label.";
            recommendation.assertion = "assertTrue(driver.findElement(By.cssSelector(\"" + finding.selector + "\")).getAttribute(\"aria-label\").matches(\".+\"));";
            return recommendation;
        }
        recommendation.fix = "Improve semantic structure or ARIA support for this control.";
        recommendation.assertion = "assertTrue(driver.findElement(By.cssSelector(\"" + finding.selector + "\")).isDisplayed());";
        return recommendation;
    }
}
