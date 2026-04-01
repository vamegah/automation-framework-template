package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.AlertPayload;
import com.example.enterprise.EnterpriseModels.FlakyTestDecision;
import com.example.enterprise.EnterpriseModels.LogEntry;
import com.example.enterprise.EnterpriseModels.RootCauseReport;
import com.example.enterprise.EnterpriseModels.TestFailureEvidence;
import com.example.enterprise.EnterpriseModels.TestRunHistoryEntry;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class EnterpriseFailureAnalyzer {
    public RootCauseReport analyzeFailure(TestFailureEvidence evidence, List<LogEntry> logs) {
        List<LogEntry> correlatedLogs = logs.stream()
            .filter(entry -> matchesEvidence(entry, evidence))
            .collect(Collectors.toList());

        LogEntry likelyServerError = correlatedLogs.stream()
            .filter(entry -> "aut".equalsIgnoreCase(entry.source) && "error".equalsIgnoreCase(entry.level))
            .findFirst()
            .orElse(null);

        RootCauseReport report = new RootCauseReport();
        report.summary = evidence.testName + " failed with correlated application evidence.";
        report.likelyRootCause = likelyServerError != null
            ? "Server-side " + likelyServerError.provider + " error correlated with request " + (likelyServerError.requestId == null ? "unknown" : likelyServerError.requestId) + "."
            : "No server-side error matched the failure. Review client-side evidence and Selenium artifacts.";
        report.correlatedProviders = new ArrayList<>(new LinkedHashSet<>(
            correlatedLogs.stream().map(entry -> entry.provider).collect(Collectors.toList())
        ));
        report.evidence.add("Test error: " + evidence.testError);
        correlatedLogs.forEach(entry -> report.evidence.add(entry.provider + " " + entry.level.toUpperCase() + ": " + entry.message));

        String body = String.join("\n", List.of(
            "Test: " + evidence.testName,
            "Likely root cause: " + report.likelyRootCause,
            "Video: " + (evidence.videoPath == null ? "not-captured" : evidence.videoPath),
            "Repro curl: " + evidence.curlCommand
        ));

        report.alertPayloads.add(buildAlert("slack", "Failure RCA: " + evidence.testName, body));
        report.alertPayloads.add(buildAlert("jira", "[Auto] " + evidence.testName + " root cause", body));
        return report;
    }

    public List<FlakyTestDecision> detectFlakyTests(List<TestRunHistoryEntry> history, Instant now) {
        Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
        Map<String, List<TestRunHistoryEntry>> grouped = history.stream()
            .filter(entry -> {
                Instant executedAt = Instant.parse(entry.executedAt);
                return !executedAt.isBefore(oneWeekAgo) && !executedAt.isAfter(now);
            })
            .collect(Collectors.groupingBy(entry -> entry.testName));

        List<FlakyTestDecision> decisions = new ArrayList<>();
        for (Map.Entry<String, List<TestRunHistoryEntry>> group : grouped.entrySet()) {
            int failureCount = (int) group.getValue().stream()
                .filter(entry -> entry.failedInitially && entry.passedOnRetry)
                .count();

            FlakyTestDecision decision = new FlakyTestDecision();
            decision.testName = group.getKey();
            decision.failureCountThisWeek = failureCount;
            decision.shouldQuarantine = failureCount >= 3;
            decision.quarantineReason = decision.shouldQuarantine
                ? "Failed at least three times this week before passing on retry."
                : null;
            decisions.add(decision);
        }
        return decisions;
    }

    private boolean matchesEvidence(LogEntry entry, TestFailureEvidence evidence) {
        if (evidence.requestId != null && evidence.requestId.equals(entry.requestId)) {
            return true;
        }
        if (evidence.endpoint != null && evidence.endpoint.equals(entry.endpoint)) {
            return true;
        }
        return entry.message != null && evidence.service != null && entry.message.toLowerCase().contains(evidence.service.toLowerCase());
    }

    private AlertPayload buildAlert(String channel, String title, String body) {
        AlertPayload alert = new AlertPayload();
        alert.channel = channel;
        alert.title = title;
        alert.body = body;
        return alert;
    }
}
