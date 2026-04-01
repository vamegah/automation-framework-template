package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.CodeSignal;
import com.example.enterprise.EnterpriseModels.DraftPullRequestPlan;
import com.example.enterprise.EnterpriseModels.GeneratedTestCase;
import com.example.enterprise.EnterpriseModels.RequirementReference;
import com.example.enterprise.EnterpriseModels.RiskScoreBreakdown;
import com.example.enterprise.EnterpriseModels.TraceabilityMatrix;
import com.example.enterprise.EnterpriseModels.TraceabilityRow;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class EnterpriseGovernanceService {
    public RiskScoreBreakdown scoreRequirementRisk(RequirementReference requirement, List<CodeSignal> codeSignals) {
        CodeSignal signal = codeSignals == null || codeSignals.isEmpty() ? defaultSignal() : codeSignals.get(0);

        RiskScoreBreakdown breakdown = new RiskScoreBreakdown();
        breakdown.codeComplexity = Math.min(30, signal.cyclomaticComplexity * 2);
        breakdown.businessImpact = mapBusinessImpactToScore(requirement.businessImpact);
        breakdown.changeBreadth = Math.min(25, (signal.touchedDomains.size() * 4) + Math.min(signal.churn, 9));
        breakdown.total = Math.min(100, breakdown.codeComplexity + breakdown.businessImpact + breakdown.changeBreadth);
        breakdown.criticality = toCriticality(breakdown.total);
        return breakdown;
    }

    public GeneratedArtifacts generateGovernedTestCases(
        List<RequirementReference> requirements,
        Map<String, List<CodeSignal>> codeSignalsByRequirement
    ) {
        List<GeneratedTestCase> testCases = new ArrayList<>();
        TraceabilityMatrix matrix = new TraceabilityMatrix();
        matrix.generatedAt = Instant.now().toString();

        for (int index = 0; index < requirements.size(); index++) {
            RequirementReference requirement = requirements.get(index);
            RiskScoreBreakdown risk = scoreRequirementRisk(requirement, codeSignalsByRequirement.get(requirement.id));

            GeneratedTestCase testCase = new GeneratedTestCase();
            testCase.id = String.format("TC-%s-%d", requirement.id, index + 1);
            testCase.title = requirement.id + " - " + requirement.title;
            testCase.type = "ui";
            testCase.requirementId = requirement.id;
            testCase.preconditions.add("Requirement source is " + requirement.source + ".");
            testCase.preconditions.add("Linked acceptance criteria were fetched from the webhook payload.");
            testCase.steps.add("Review requirement " + requirement.id + " acceptance criteria.");
            testCase.steps.add("Exercise the user journey with reusable Selenium page objects and explicit waits.");
            testCase.steps.add("Capture evidence for the traceability matrix.");
            testCase.expectedResults.addAll(buildExpectedResults(requirement));
            testCase.riskScore = risk.total;
            testCase.criticality = risk.criticality;
            testCase.reviewState = "draft";
            testCase.tags.add("@generated");
            testCase.tags.add("@req:" + requirement.id);
            testCase.tags.add("@criticality:" + risk.criticality);
            testCases.add(testCase);

            TraceabilityRow row = new TraceabilityRow();
            row.requirementId = requirement.id;
            row.requirementTitle = requirement.title;
            row.generatedTestCaseId = testCase.id;
            row.generatedTestCaseTitle = testCase.title;
            row.source = requirement.source;
            row.riskScore = testCase.riskScore;
            row.criticality = testCase.criticality;
            matrix.rows.add(row);
        }

        GeneratedArtifacts artifacts = new GeneratedArtifacts();
        artifacts.testCases = testCases;
        artifacts.matrix = matrix;
        return artifacts;
    }

    public DraftPullRequestPlan planDraftPullRequest(List<GeneratedTestCase> testCases, String reviewer) {
        DraftPullRequestPlan plan = new DraftPullRequestPlan();
        String joinedIds = String.join(", ", testCases.stream().map(testCase -> testCase.requirementId).toArray(String[]::new));
        String branchIds = String.join("-", testCases.stream().map(testCase -> testCase.requirementId.toLowerCase()).toArray(String[]::new));

        plan.title = "Draft: generated tests for " + joinedIds;
        plan.branchName = "draft/generated-tests/" + branchIds;
        plan.baseBranch = "main";
        plan.reviewers.add(reviewer);
        plan.labels.add("ai-generated");
        plan.labels.add("qa-review");
        plan.labels.add("draft-pr");
        plan.isDraft = true;
        plan.summary = "Generated " + testCases.size() + " governed test case(s). Review required before merge.";
        plan.artifacts.add("traceability-matrix.json");
        plan.artifacts.add("generated-test-cases.json");
        return plan;
    }

    private List<String> buildExpectedResults(RequirementReference requirement) {
        List<String> expectedResults = new ArrayList<>();
        if (!requirement.acceptanceCriteria.isEmpty()) {
            for (String criterion : requirement.acceptanceCriteria) {
                expectedResults.add("Verified: " + criterion);
            }
            return expectedResults;
        }

        expectedResults.add("Requirement " + requirement.id + " behaves as described.");
        return expectedResults;
    }

    private CodeSignal defaultSignal() {
        CodeSignal signal = new CodeSignal();
        signal.filePath = "unknown";
        signal.cyclomaticComplexity = 1;
        signal.churn = 1;
        return signal;
    }

    private int mapBusinessImpactToScore(String impact) {
        if ("critical".equalsIgnoreCase(impact)) {
            return 45;
        }
        if ("high".equalsIgnoreCase(impact)) {
            return 32;
        }
        if ("medium".equalsIgnoreCase(impact)) {
            return 20;
        }
        return 10;
    }

    private String toCriticality(int score) {
        if (score >= 85) {
            return "critical";
        }
        if (score >= 65) {
            return "high";
        }
        if (score >= 40) {
            return "medium";
        }
        return "low";
    }

    public static class GeneratedArtifacts {
        public List<GeneratedTestCase> testCases = new ArrayList<>();
        public TraceabilityMatrix matrix;
    }
}
