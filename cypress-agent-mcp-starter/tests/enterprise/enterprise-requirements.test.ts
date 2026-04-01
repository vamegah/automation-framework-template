import test from 'node:test';
import assert from 'node:assert/strict';
import { EnterpriseAgent } from '../../cypress/support/agents/enterprise.agent';
import {
  analyzeAccessibilityFindings,
  analyzeFailure,
  buildSeedScript,
  collectLiveAutLogs,
  detectFlakyTests,
  generateContractTestArtifact,
  generateEnterpriseScript,
  generateOwaspSecurityCases,
  generateSyntheticRecords,
  inferJsonSchema,
  JiraClient,
  maskSensitiveFields,
  parseWebhookRequirement,
  generateGovernedTestCases,
  optimizePipeline,
  planDraftPullRequest,
  publishEnterpriseAlerts,
  reviewGeneratedCode,
  SlackClient,
  suggestLocatorHealing,
  validateJsonAgainstSchema,
  VaultClient,
} from '../../enterprise';

const repoRoot = process.cwd();

test('ingests webhook work items, generates traceability, risk scoring, and a draft PR plan', () => {
  const jiraRequirement = parseWebhookRequirement('jira', {
    issue: {
      key: 'JIRA-1234',
      fields: {
        summary: 'Customer can transfer funds',
        description: 'As a customer, I can transfer funds between internal accounts.',
        acceptanceCriteria: [
          'Transfer succeeds for valid accounts',
          'Validation appears for insufficient funds',
        ],
        labels: ['payments', 'critical'],
        linkedRequirements: ['REQ-88'],
      },
    },
    url: 'https://jira.example.com/browse/JIRA-1234',
  });

  const generated = generateGovernedTestCases([jiraRequirement], {
    'JIRA-1234': [
      {
        filePath: 'src/transfer.ts',
        cyclomaticComplexity: 18,
        churn: 6,
        touchedDomains: ['payments', 'ledger', 'notifications'],
      },
    ],
  });

  const draftPlan = planDraftPullRequest(generated.testCases, 'qa-lead');

  assert.equal(jiraRequirement.id, 'JIRA-1234');
  assert.equal(generated.testCases.length, 1);
  assert.equal(generated.testCases[0].reviewState, 'draft');
  assert.equal(generated.matrix.rows[0].requirementId, 'JIRA-1234');
  assert.ok(generated.matrix.rows[0].riskScore >= 65);
  assert.equal(draftPlan.isDraft, true);
  assert.ok(draftPlan.reviewers.includes('qa-lead'));
});

test('generates Cypress and C# scripts that reuse page objects and keep secrets out of source', () => {
  const cypressArtifact = generateEnterpriseScript(repoRoot, {
    framework: 'typescript-cypress',
    testName: 'Transfer Funds Enterprise Flow',
    pageObjectHint: 'login',
    scenario: ['navigate to login page', 'submit credentials through page object'],
    assertions: ['dashboard is visible after login'],
    secretKeys: ['API_KEY'],
    secretProvider: 'vault',
  });

  const csharpArtifact = generateEnterpriseScript(repoRoot, {
    framework: 'csharp-dotnet',
    testName: 'Transfer Funds Enterprise Flow',
    pageObjectHint: 'login',
    scenario: ['navigate to login page', 'submit credentials through page object'],
    assertions: ['dashboard is visible after login'],
    secretKeys: ['API_KEY'],
    secretProvider: 'aws-secrets-manager',
  });

  assert.ok(cypressArtifact.reusedPageObjects.length > 0);
  assert.match(cypressArtifact.content, /LoginPage/);
  assert.match(cypressArtifact.content, /getVaultSecret\('API_KEY'\)/);
  assert.match(csharpArtifact.content, /getAwsSecret\('API_KEY'\)/);
  assert.equal(cypressArtifact.secretPlaceholders[0], "getVaultSecret('API_KEY')");
  assert.equal(csharpArtifact.secretPlaceholders[0], "getAwsSecret('API_KEY')");

  const findings = reviewGeneratedCode(`
    cy.wait(3000);
    const password = "super-secret";
  `);

  assert.deepEqual(
    findings.map((finding) => finding.rule).sort(),
    ['no-hard-waits', 'no-hardcoded-secrets'].sort(),
  );
});

test('creates synthetic data, masks sensitive fields, and emits SQL for ephemeral seeding', () => {
  const records = generateSyntheticRecords({
    locale: 'en-US',
    firstNamePool: ['Amina', 'Luis', 'Robin'],
    lastNamePool: ['Stone', 'Patel', 'Kim'],
    emailDomain: 'synthetic.example.test',
    cities: ['Austin', 'Dallas', 'Chicago'],
    cardPrefixes: ['411111', '545454', '378282'],
  }, 2);

  const maskingResult = maskSensitiveFields(records[0]);
  const seedScript = buildSeedScript('customers', records.map((record) => maskSensitiveFields(record).maskedRecord));

  assert.match(String(records[0].email), /synthetic\.example\.test/);
  assert.ok(maskingResult.maskedFields.includes('credit_card'));
  assert.ok(maskingResult.maskedFields.includes('ssn'));
  assert.match(String(maskingResult.maskedRecord.credit_card), /\*{4,}\d{4}$/);
  assert.match(seedScript.sql, /INSERT INTO customers/);
  assert.match(seedScript.sql, /\*\*\*-\*\*-/);
});

test('correlates AUT logs, builds alert payloads, detects flaky tests, and recommends quarantine', () => {
  const report = analyzeFailure(
    {
      testName: 'bill pay shows backend error',
      testError: 'Expected success toast, saw 500 banner',
      videoPath: 'cypress/videos/bill-pay.mp4',
      curlCommand: `curl -X POST https://bank.example.test/billpay -d '{"amount":125}'`,
      service: 'billpay-service',
      endpoint: '/billpay',
      requestId: 'req-77',
    },
    [
      {
        timestamp: '2026-03-24T10:00:00.000Z',
        source: 'test',
        provider: 'cypress',
        level: 'error',
        message: 'UI observed HTTP 500 from billpay-service',
        requestId: 'req-77',
        endpoint: '/billpay',
        statusCode: 500,
      },
      {
        timestamp: '2026-03-24T10:00:00.500Z',
        source: 'aut',
        provider: 'datadog',
        level: 'error',
        message: 'billpay-service null pointer while persisting payment',
        requestId: 'req-77',
        endpoint: '/billpay',
        statusCode: 500,
      },
    ],
  );

  const flakyDecisions = detectFlakyTests([
    { testName: 'find transactions by date', executedAt: '2026-03-21T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
    { testName: 'find transactions by date', executedAt: '2026-03-22T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
    { testName: 'find transactions by date', executedAt: '2026-03-24T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
  ], new Date('2026-03-26T12:00:00.000Z'));

  assert.match(report.likelyRootCause, /Server-side datadog error/);
  assert.equal(report.alertPayloads.length, 2);
  assert.match(report.alertPayloads[0].body, /curl -X POST/);
  assert.equal(flakyDecisions[0].shouldQuarantine, true);
  assert.match(String(flakyDecisions[0].quarantineReason), /three times/);
});

test('enterprise agent writes governed artifacts for review instead of auto-committing', () => {
  const agent = new EnterpriseAgent();
  const result = agent.generate({
    requirements: [
      {
        id: 'JIRA-1234',
        title: 'Customer can transfer funds',
        description: 'As a customer, I can transfer funds between internal accounts.',
        acceptanceCriteria: ['Transfer succeeds for valid accounts'],
        linkedRequirements: ['REQ-88'],
        source: 'jira',
        labels: ['payments', 'critical'],
        businessImpact: 'critical',
      },
    ],
    codeSignalsByRequirement: {
      'JIRA-1234': [
        {
          filePath: 'src/transfer.ts',
          cyclomaticComplexity: 18,
          churn: 6,
          touchedDomains: ['payments', 'ledger', 'notifications'],
        },
      ],
    },
    reviewer: 'qa-lead',
    scriptRequest: {
      framework: 'typescript-cypress',
      testName: 'Transfer Funds Enterprise Flow',
      pageObjectHint: 'login',
      scenario: ['navigate to login page', 'submit credentials through page object'],
      assertions: ['dashboard is visible after login'],
      secretKeys: ['API_KEY'],
      secretProvider: 'vault',
    },
  }, repoRoot);

  assert.equal(result.draftPlan.isDraft, true);
  assert.match(result.scriptArtifact.content, /describe\('Transfer Funds Enterprise Flow'/);
});

test('supports live-capable Jira, Slack, Datadog, Splunk, CloudWatch, and Vault integrations through injected clients', async () => {
  process.env.JIRA_LIVE_INTEGRATION_ENABLED = 'true';
  process.env.SLACK_LIVE_INTEGRATION_ENABLED = 'true';
  process.env.DATADOG_LIVE_INTEGRATION_ENABLED = 'true';
  process.env.SPLUNK_LIVE_INTEGRATION_ENABLED = 'true';
  process.env.CLOUDWATCH_LIVE_INTEGRATION_ENABLED = 'true';

  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchStub = async (url: string | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init });
    if (String(url).includes('/rest/api/3/issue/')) {
      return { ok: true, status: 200, json: async () => ({ key: 'JIRA-900' }), text: async () => '' };
    }
    if (String(url).includes('/v1/secret/app')) {
      return { ok: true, status: 200, json: async () => ({ data: { data: { password: 'vault-secret' } } }), text: async () => '' };
    }
    return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => 'ok' };
  };

  const jira = new JiraClient('https://jira.example.com', 'qa@example.com', 'token', fetchStub as typeof fetch);
  const slack = new SlackClient('https://hooks.slack.example', fetchStub as typeof fetch);
  const vault = new VaultClient('https://vault.example.com', 'token', fetchStub as typeof fetch);

  const issue = await jira.fetchIssue('JIRA-900');
  const vaultSecret = await vault.resolveReference('vault://secret/app#password');
  const logs = await collectLiveAutLogs(
    {
      datadogQuery: 'service:payments',
      splunkQuery: 'search error',
      cloudWatchLogGroup: '/aws/app/demo',
      cloudWatchFilter: 'ERROR',
    },
    {
      datadog: { queryLogs: async () => [{ timestamp: '2026-04-01T00:00:00.000Z', source: 'aut', provider: 'datadog', level: 'error', message: 'dd error' }] } as never,
      splunk: { search: async () => [{ timestamp: '2026-04-01T00:00:01.000Z', source: 'aut', provider: 'splunk', level: 'error', message: 'splunk error' }] } as never,
      cloudWatch: { filterLogEvents: async () => [{ timestamp: '2026-04-01T00:00:02.000Z', source: 'aut', provider: 'cloudwatch', level: 'error', message: 'cloudwatch error' }] } as never,
    },
  );

  await publishEnterpriseAlerts(
    {
      summary: 'Failure summary',
      likelyRootCause: 'Datadog correlated failure',
      correlatedProviders: ['datadog'],
      evidence: ['evidence'],
      alertPayloads: [
        { channel: 'slack', title: 'Slack RCA', body: 'slack body' },
        { channel: 'jira', title: 'Jira RCA', body: 'jira body' },
      ],
    },
    { jiraProjectKey: 'QA' },
    { jira, slack },
  );

  assert.deepEqual(issue, { key: 'JIRA-900' });
  assert.equal(vaultSecret, 'vault-secret');
  assert.equal(logs.length, 3);
  assert.ok(fetchCalls.some((call) => call.url.includes('/rest/api/3/issue/JIRA-900')));
  assert.ok(fetchCalls.some((call) => call.url.includes('hooks.slack.example')));
});

test('suggests stable self-healing locator patches when a page object locator breaks', () => {
  const result = suggestLocatorHealing({
    failingLocator: "cy.get('.submit-btn')",
    failureMessage: 'strict mode violation: locator resolved to 2 elements',
    pageObjectPath: 'cypress/support/pages/login.page.ts',
    pageObjectSource: "return cy.get('.submit-btn');",
    candidates: [
      {
        locator: "cy.contains('button', 'Log In')",
        strategy: 'role',
        attributes: { name: 'Log In' },
        visible: true,
        stable: true,
      },
      {
        locator: "[data-testid='login-submit']",
        strategy: 'css',
        visible: true,
        stable: false,
      },
    ],
  });

  assert.equal(result.shouldHeal, true);
  assert.match(String(result.healedLocator), /contains\('button', 'Log In'\)/);
  assert.ok(result.confidence >= 70);
  assert.match(result.patch[0], /login\.page\.ts/);
});

test('infers response schemas, validates payloads, and emits contract test artifacts', () => {
  const sample = {
    success: true,
    products: [
      {
        id: 1,
        name: 'Sample Product',
        price: 19.99,
      },
    ],
  };

  const schema = inferJsonSchema(sample);
  const validResult = validateJsonAgainstSchema(sample, schema);
  const invalidResult = validateJsonAgainstSchema({ success: true, products: [{ id: 'bad-id' }] }, schema);
  const artifact = generateContractTestArtifact('Products API', schema);

  assert.equal(schema.type, 'object');
  assert.ok(schema.required.includes('success'));
  assert.ok(schema.required.includes('products'));
  assert.equal(validResult.valid, true);
  assert.equal(invalidResult.valid, false);
  assert.match(invalidResult.errors.join('\n'), /payload\.products\[0\]\.id expected number/);
  assert.equal(artifact.fileName, 'products-api.contract.cy.ts');
  assert.match(artifact.content, /validateJsonAgainstSchema/);
});

test('generates OWASP-oriented security cases from a requirement', () => {
  const requirement = parseWebhookRequirement('jira', {
    issue: {
      key: 'JIRA-4321',
      fields: {
        summary: 'User can log in',
        description: 'As a user, I can log in with email and password.',
        acceptanceCriteria: ['Valid credentials are accepted', 'Invalid credentials are rejected'],
        labels: ['auth', 'critical'],
        linkedRequirements: [],
      },
    },
  });

  const cases = generateOwaspSecurityCases(requirement, 'api');

  assert.equal(cases.length, 4);
  assert.ok(cases.some((testCase) => testCase.category === 'sql-injection'));
  assert.ok(cases.some((testCase) => testCase.category === 'xss'));
  assert.ok(cases.some((testCase) => testCase.category === 'auth-bypass'));
  assert.ok(cases.some((testCase) => testCase.category === 'input-validation'));
  assert.match(cases[0].steps.join(' '), /login API/);
  assert.ok(cases.some((testCase) => testCase.severity === 'critical'));
});

test('turns accessibility findings into remediation guidance and Cypress assertions', () => {
  const artifact = analyzeAccessibilityFindings([
    {
      id: 'a11y-1',
      impact: 'critical',
      rule: 'label',
      selector: '#email',
      message: 'Form element must have labels',
    },
    {
      id: 'a11y-2',
      impact: 'serious',
      rule: 'image-alt',
      selector: '.hero img',
      message: 'Images must have alternate text',
    },
  ]);

  assert.match(artifact.summary, /2 accessibility finding\(s\)/);
  assert.equal(artifact.recommendations.length, 2);
  assert.match(artifact.assertions.join('\n'), /aria-label/);
  assert.match(artifact.assertions.join('\n'), /have\.attr', 'alt'/);
});

test('optimizes CI sharding and quarantine recommendations from suite telemetry', () => {
  const plan = optimizePipeline(
    [
      {
        name: 'ui-chrome',
        averageDurationSeconds: 420,
        failureRate: 0.08,
        requiresSerial: false,
      },
      {
        name: 'stateful-orangehrm',
        averageDurationSeconds: 260,
        failureRate: 0.12,
        requiresSerial: true,
      },
    ],
    [
      {
        testName: 'find transactions by date',
        failureCountThisWeek: 3,
        shouldQuarantine: true,
        quarantineReason: 'Failed three times before passing on retry.',
      },
    ],
  );

  assert.equal(plan.recommendedWorkers, 1);
  assert.equal(plan.shardCount, 1);
  assert.ok(plan.quarantinedTests.includes('find transactions by date'));
  assert.match(plan.workflowYaml, /npx cypress run/);
  assert.match(plan.rationale[1], /flaky test/);
});
