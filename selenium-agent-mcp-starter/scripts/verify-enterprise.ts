import assert from 'node:assert/strict';
import { EnterpriseAgent } from '../ai/agents/enterprise-agent';
import {
  analyzeAccessibilityFindings,
  analyzeFailure,
  buildSeedScript,
  collectLiveAutLogs,
  detectFlakyTests,
  generateContractTestArtifact,
  generateEnterpriseScript,
  generateGovernedTestCases,
  generateOwaspSecurityCases,
  generateSyntheticRecords,
  inferJsonSchema,
  JiraClient,
  maskSensitiveFields,
  optimizePipeline,
  parseWebhookRequirement,
  planDraftPullRequest,
  publishEnterpriseAlerts,
  reviewGeneratedCode,
  SlackClient,
  suggestLocatorHealing,
  validateJsonAgainstSchema,
  VaultClient,
} from '../enterprise';

const repoRoot = process.cwd();

function verifyGovernedCases(): void {
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
}

function verifyScriptGeneration(): void {
  const seleniumArtifact = generateEnterpriseScript(repoRoot, {
    framework: 'typescript-selenium',
    testName: 'Transfer Funds Enterprise Flow',
    pageObjectHint: 'login',
    scenario: ['navigate to login page', 'submit credentials through page object'],
    assertions: ['inventory is visible after login'],
    secretKeys: ['API_KEY'],
    secretProvider: 'vault',
  });

  const csharpArtifact = generateEnterpriseScript(repoRoot, {
    framework: 'csharp-dotnet',
    testName: 'Transfer Funds Enterprise Flow',
    pageObjectHint: 'login',
    scenario: ['navigate to login page', 'submit credentials through page object'],
    assertions: ['inventory is visible after login'],
    secretKeys: ['API_KEY'],
    secretProvider: 'aws-secrets-manager',
  });

  assert.ok(seleniumArtifact.reusedPageObjects.length > 0);
  assert.match(seleniumArtifact.content, /LoginPage/);
  assert.match(seleniumArtifact.content, /getVaultSecret\('API_KEY'\)/);
  assert.match(csharpArtifact.content, /getAwsSecret\('API_KEY'\)/);
  assert.equal(seleniumArtifact.secretPlaceholders[0], "getVaultSecret('API_KEY')");
  assert.equal(csharpArtifact.secretPlaceholders[0], "getAwsSecret('API_KEY')");

  const findings = reviewGeneratedCode(`
    sleep(3000);
    const password = "super-secret";
  `);

  assert.deepEqual(
    findings.map((finding) => finding.rule).sort(),
    ['no-hard-waits', 'no-hardcoded-secrets'].sort(),
  );
}

function verifyDataGeneration(): void {
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
}

function verifyFailureAnalysis(): void {
  const report = analyzeFailure(
    {
      testName: 'checkout shows backend error',
      testError: 'Expected order confirmation, saw 500 banner',
      videoPath: 'artifacts/checkout.mp4',
      curlCommand: `curl -X POST https://shop.example.test/checkout -d '{"amount":125}'`,
      service: 'checkout-service',
      endpoint: '/checkout',
      requestId: 'req-77',
    },
    [
      {
        timestamp: '2026-03-24T10:00:00.000Z',
        source: 'test',
        provider: 'selenium',
        level: 'error',
        message: 'UI observed HTTP 500 from checkout-service',
        requestId: 'req-77',
        endpoint: '/checkout',
        statusCode: 500,
      },
      {
        timestamp: '2026-03-24T10:00:00.500Z',
        source: 'aut',
        provider: 'datadog',
        level: 'error',
        message: 'checkout-service null pointer while persisting order',
        requestId: 'req-77',
        endpoint: '/checkout',
        statusCode: 500,
      },
    ],
  );

  const flakyDecisions = detectFlakyTests([
    { testName: 'sort inventory', executedAt: '2026-03-21T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
    { testName: 'sort inventory', executedAt: '2026-03-22T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
    { testName: 'sort inventory', executedAt: '2026-03-24T10:00:00.000Z', failedInitially: true, passedOnRetry: true },
  ], new Date('2026-03-26T12:00:00.000Z'));

  assert.match(report.likelyRootCause, /Server-side datadog error/);
  assert.equal(report.alertPayloads.length, 2);
  assert.match(report.alertPayloads[0].body, /curl -X POST/);
  assert.equal(flakyDecisions[0].shouldQuarantine, true);
  assert.match(String(flakyDecisions[0].quarantineReason), /three times/);
}

function verifyEnterpriseAgent(): void {
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
      framework: 'typescript-selenium',
      testName: 'Transfer Funds Enterprise Flow',
      pageObjectHint: 'login',
      scenario: ['navigate to login page', 'submit credentials through page object'],
      assertions: ['inventory is visible after login'],
      secretKeys: ['API_KEY'],
      secretProvider: 'vault',
    },
  }, repoRoot);

  assert.equal(result.draftPlan.isDraft, true);
  assert.match(result.scriptArtifact.content, /describe\('Transfer Funds Enterprise Flow'/);
}

function verifySelfHealing(): void {
  const result = suggestLocatorHealing({
    failingLocator: "By.css('.submit-btn')",
    failureMessage: 'strict mode violation: locator resolved to 2 elements',
    pageObjectPath: 'pages/login.page.ts',
    pageObjectSource: "return By.css('.submit-btn');",
    candidates: [
      {
        locator: "By.css(\"button[data-test='login-button']\")",
        strategy: 'testid',
        attributes: { name: 'Log In' },
        visible: true,
        stable: true,
      },
      {
        locator: '.submit-btn',
        strategy: 'css',
        visible: true,
        stable: false,
      },
    ],
  });

  assert.equal(result.shouldHeal, true);
  assert.match(String(result.healedLocator), /button\[data-test='login-button'\]/);
  assert.ok(result.confidence >= 70);
}

function verifyContractTesting(): void {
  const sample = {
    success: true,
    products: [{ id: 1, name: 'Sample Product', price: 19.99 }],
  };

  const schema = inferJsonSchema(sample);
  const validResult = validateJsonAgainstSchema(sample, schema);
  const invalidResult = validateJsonAgainstSchema({ success: true, products: [{ id: 'bad-id' }] }, schema);
  const artifact = generateContractTestArtifact('Products API', schema);

  assert.equal(schema.type, 'object');
  assert.equal(validResult.valid, true);
  assert.equal(invalidResult.valid, false);
  assert.match(invalidResult.errors.join('\n'), /payload\.products\[0\]\.id expected number/);
  assert.equal(artifact.fileName, 'products-api.contract.spec.ts');
}

function verifySecurityGeneration(): void {
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
}

function verifyAccessibilityCoverage(): void {
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
  assert.match(artifact.assertions.join('\n'), /'alt'/);
}

function verifyCiOptimization(): void {
  const plan = optimizePipeline(
    [
      {
        name: 'ui-chrome',
        averageDurationSeconds: 420,
        failureRate: 0.08,
        requiresSerial: false,
      },
      {
        name: 'stateful-saucedemo',
        averageDurationSeconds: 260,
        failureRate: 0.12,
        requiresSerial: true,
      },
    ],
    [
      {
        testName: 'sort inventory',
        failureCountThisWeek: 3,
        shouldQuarantine: true,
        quarantineReason: 'Failed three times before passing on retry.',
      },
    ],
  );

  assert.equal(plan.recommendedWorkers, 1);
  assert.equal(plan.shardCount, 1);
  assert.ok(plan.quarantinedTests.includes('sort inventory'));
  assert.match(plan.workflowYaml, /npm test/);
}

async function verifyLiveIntegrations(): Promise<void> {
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
}

async function main(): Promise<void> {
  verifyGovernedCases();
  verifyScriptGeneration();
  verifyDataGeneration();
  verifyFailureAnalysis();
  verifyEnterpriseAgent();
  verifySelfHealing();
  verifyContractTesting();
  verifySecurityGeneration();
  verifyAccessibilityCoverage();
  verifyCiOptimization();
  await verifyLiveIntegrations();
  console.log('Selenium TS enterprise verification passed.');
}

void main();
