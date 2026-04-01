import { FlakyTestDecision, PipelineOptimizationPlan, PipelineSuiteMetric } from './types';

function recommendWorkers(metrics: PipelineSuiteMetric[]): number {
  const serialSuites = metrics.filter((metric) => metric.requiresSerial).length;
  const totalDuration = metrics.reduce((sum, metric) => sum + metric.averageDurationSeconds, 0);
  if (serialSuites > 0) {
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

export function optimizePipeline(metrics: PipelineSuiteMetric[], flakyDecisions: FlakyTestDecision[]): PipelineOptimizationPlan {
  const recommendedWorkers = recommendWorkers(metrics);
  const shardCount = recommendedWorkers > 1 ? recommendedWorkers : 1;
  const quarantinedTests = flakyDecisions.filter((decision) => decision.shouldQuarantine).map((decision) => decision.testName);

  return {
    recommendedWorkers,
    shardCount,
    quarantinedTests,
    rationale: [
      `${metrics.filter((metric) => metric.requiresSerial).length} suite(s) require serial execution.`,
      `${quarantinedTests.length} flaky test(s) should be excluded from the blocking lane until reviewed.`,
      `Recommended worker count is ${recommendedWorkers} based on current suite duration and statefulness.`,
    ],
    workflowYaml: [
      'name: selenium-ts-optimized',
      'on: [push, pull_request]',
      'jobs:',
      '  test:',
      '    runs-on: ubuntu-latest',
      '    strategy:',
      '      matrix:',
      `        shard: [${Array.from({ length: shardCount }, (_, index) => index + 1).join(', ')}]`,
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      "          node-version: '20'",
      '      - run: npm ci',
      `      - run: npm test${quarantinedTests.length ? ` -- --grep invert:${quarantinedTests.join(',')}` : ''}`,
      '',
    ].join('\n'),
  };
}
