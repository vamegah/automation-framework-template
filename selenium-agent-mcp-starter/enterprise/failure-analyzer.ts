import { FlakyTestDecision, LogEntry, RootCauseReport, TestFailureEvidence, TestRunHistoryEntry } from './types';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function analyzeFailure(evidence: TestFailureEvidence, logs: LogEntry[]): RootCauseReport {
  const correlatedLogs = logs.filter((entry) => {
    if (evidence.requestId && entry.requestId === evidence.requestId) {
      return true;
    }
    if (evidence.endpoint && entry.endpoint === evidence.endpoint) {
      return true;
    }
    return entry.message.toLowerCase().includes(evidence.service.toLowerCase());
  });

  const likelyServerError = correlatedLogs.find((entry) => entry.source === 'aut' && entry.level === 'error');
  const likelyRootCause = likelyServerError
    ? `Server-side ${likelyServerError.provider} error correlated with request ${likelyServerError.requestId ?? 'unknown'}.`
    : 'No server-side error matched the failure. Review client-side evidence and Selenium artifacts.';

  const evidenceLines = [
    `Test error: ${evidence.testError}`,
    ...correlatedLogs.map((entry) => `${entry.provider} ${entry.level.toUpperCase()}: ${entry.message}`),
  ];

  const body = [
    `Test: ${evidence.testName}`,
    `Likely root cause: ${likelyRootCause}`,
    `Video: ${evidence.videoPath ?? 'not-captured'}`,
    `Repro curl: ${evidence.curlCommand}`,
  ].join('\n');

  return {
    summary: `${evidence.testName} failed with correlated application evidence.`,
    likelyRootCause,
    correlatedProviders: unique(correlatedLogs.map((entry) => entry.provider)),
    evidence: evidenceLines,
    alertPayloads: [
      { channel: 'slack', title: `Failure RCA: ${evidence.testName}`, body },
      { channel: 'jira', title: `[Auto] ${evidence.testName} root cause`, body },
    ],
  };
}

export function detectFlakyTests(history: TestRunHistoryEntry[], now = new Date()): FlakyTestDecision[] {
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const grouped = new Map<string, TestRunHistoryEntry[]>();
  history.forEach((entry) => {
    const executedAt = new Date(entry.executedAt);
    if (executedAt < oneWeekAgo || executedAt > now) {
      return;
    }
    grouped.set(entry.testName, [...(grouped.get(entry.testName) ?? []), entry]);
  });

  return [...grouped.entries()].map(([testName, entries]) => {
    const failureCountThisWeek = entries.filter((entry) => entry.failedInitially && entry.passedOnRetry).length;
    return {
      testName,
      failureCountThisWeek,
      shouldQuarantine: failureCountThisWeek >= 3,
      quarantineReason: failureCountThisWeek >= 3
        ? 'Failed at least three times this week before passing on retry.'
        : undefined,
    };
  });
}
