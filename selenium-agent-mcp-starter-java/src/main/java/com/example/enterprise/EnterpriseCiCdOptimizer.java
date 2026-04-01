package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.FlakyTestDecision;
import com.example.enterprise.EnterpriseModels.PipelineOptimizationPlan;
import com.example.enterprise.EnterpriseModels.PipelineSuiteMetric;

import java.util.List;

public class EnterpriseCiCdOptimizer {
    public PipelineOptimizationPlan optimize(List<PipelineSuiteMetric> metrics, List<FlakyTestDecision> flakyDecisions) {
        PipelineOptimizationPlan plan = new PipelineOptimizationPlan();
        plan.recommendedWorkers = recommendWorkers(metrics);
        plan.shardCount = Math.max(1, plan.recommendedWorkers);
        plan.quarantinedTests = flakyDecisions.stream().filter(item -> item.shouldQuarantine).map(item -> item.testName).toList();
        plan.rationale = List.of(
            metrics.stream().filter(item -> item.requiresSerial).count() + " suite(s) require serial execution.",
            plan.quarantinedTests.size() + " flaky test(s) should be excluded from the blocking lane until reviewed.",
            "Recommended worker count is " + plan.recommendedWorkers + " based on current suite duration and statefulness."
        );
        plan.workflowYaml = String.join("\n",
            "name: selenium-java-optimized",
            "on: [push, pull_request]",
            "jobs:",
            "  test:",
            "    runs-on: ubuntu-latest",
            "    steps:",
            "      - uses: actions/checkout@v4",
            "      - uses: actions/setup-java@v4",
            "        with:",
            "          distribution: temurin",
            "          java-version: '21'",
            "      - run: mvn test"
        );
        return plan;
    }

    private int recommendWorkers(List<PipelineSuiteMetric> metrics) {
        boolean hasSerial = metrics.stream().anyMatch(item -> item.requiresSerial);
        int totalDuration = metrics.stream().mapToInt(item -> item.averageDurationSeconds).sum();
        if (hasSerial) {
            return 1;
        }
        if (totalDuration > 900) {
            return 4;
        }
        if (totalDuration > 300) {
            return 2;
        }
        return 1;
    }
}
