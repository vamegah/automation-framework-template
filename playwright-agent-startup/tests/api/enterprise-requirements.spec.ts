import { test, expect } from '../fixtures/base.fixture';
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
} from '../../enterprise';

const repoRoot = process.cwd();

test.describe('Enterprise Requirement Coverage @api', () => {
  test('ingests webhook work items, generates traceability, risk scoring, and a draft PR plan', async () => {
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

    expect(jiraRequirement.id).toBe('JIRA-1234');
    expect(generated.testCases).toHaveLength(1);
    expect(generated.testCases[0].reviewState).toBe('draft');
    expect(generated.matrix.rows[0].requirementId).toBe('JIRA-1234');
    expect(generated.matrix.rows[0].riskScore).toBeGreaterThanOrEqual(65);
    expect(draftPlan.isDraft).toBeTruthy();
    expect(draftPlan.reviewers).toContain('qa-lead');
  });

  test('generates Playwright and C# scripts that reuse page objects and keep secrets out of source', async () => {
    const playwrightArtifact = generateEnterpriseScript(repoRoot, {
      framework: 'typescript-playwright',
      testName: 'Transfer Funds Enterprise Flow',
      pageObjectHint: 'transfer',
      scenario: ['navigate to transfer funds page', 'submit transfer request'],
      assertions: ['transfer confirmation is visible'],
      secretKeys: ['API_KEY'],
      secretProvider: 'vault',
    });

    const csharpArtifact = generateEnterpriseScript(repoRoot, {
      framework: 'csharp-dotnet',
      testName: 'Transfer Funds Enterprise Flow',
      pageObjectHint: 'transfer',
      scenario: ['navigate to transfer funds page', 'submit transfer request'],
      assertions: ['transfer confirmation is visible'],
      secretKeys: ['API_KEY'],
      secretProvider: 'aws-secrets-manager',
    });

    expect(playwrightArtifact.reusedPageObjects.length).toBeGreaterThan(0);
    expect(playwrightArtifact.content).toContain('TransferFundsPage');
    expect(playwrightArtifact.content).toContain("getVaultSecret('API_KEY')");
    expect(csharpArtifact.content).toContain("getAwsSecret('API_KEY')");
    expect(playwrightArtifact.secretPlaceholders[0]).toBe("await getVaultSecret('API_KEY')");
    expect(csharpArtifact.secretPlaceholders[0]).toBe("await getAwsSecret('API_KEY')");

    const findings = reviewGeneratedCode(`
      await page.waitForTimeout(3000);
      const password = "super-secret";
    `);

    expect(findings.map((finding) => finding.rule)).toEqual(
      expect.arrayContaining(['no-hard-waits', 'no-hardcoded-secrets']),
    );
  });

  test('creates synthetic data, masks sensitive fields, and emits SQL for ephemeral seeding', async () => {
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

    expect(records[0].email).toContain('synthetic.example.test');
    expect(maskingResult.maskedFields).toEqual(expect.arrayContaining(['credit_card', 'ssn']));
    expect(String(maskingResult.maskedRecord.credit_card)).toMatch(/\*{4,}\d{4}$/);
    expect(seedScript.sql).toContain('INSERT INTO customers');
    expect(seedScript.sql).toContain('***-**-');
  });

  test('correlates AUT logs, builds alert payloads, detects flaky tests, and recommends quarantine', async () => {
    const report = analyzeFailure(
      {
        testName: 'bill pay shows backend error',
        testError: 'Expected success toast, saw 500 banner',
        videoPath: 'test-results/bill-pay.webm',
        curlCommand: `curl -X POST https://bank.example.test/billpay -d '{"amount":125}'`,
        service: 'billpay-service',
        endpoint: '/billpay',
        requestId: 'req-77',
      },
      [
        {
          timestamp: '2026-03-24T10:00:00.000Z',
          source: 'test',
          provider: 'playwright',
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

    expect(report.likelyRootCause).toContain('Server-side datadog error');
    expect(report.alertPayloads).toHaveLength(2);
    expect(report.alertPayloads[0].body).toContain('curl -X POST');
    expect(flakyDecisions[0].shouldQuarantine).toBeTruthy();
    expect(flakyDecisions[0].quarantineReason).toContain('three times');
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

    expect(issue).toEqual({ key: 'JIRA-900' });
    expect(vaultSecret).toBe('vault-secret');
    expect(logs).toHaveLength(3);
    expect(fetchCalls.some((call) => call.url.includes('/rest/api/3/issue/JIRA-900'))).toBeTruthy();
    expect(fetchCalls.some((call) => call.url.includes('hooks.slack.example'))).toBeTruthy();
  });

  test('suggests stable self-healing locator patches when a page object locator breaks', async () => {
    const result = suggestLocatorHealing({
      failingLocator: "page.locator('.submit-btn')",
      failureMessage: 'strict mode violation: locator resolved to 2 elements',
      pageObjectPath: 'pages/login.page.ts',
      pageObjectSource: "return this.page.locator('.submit-btn');",
      candidates: [
        {
          locator: "page.getByRole('button', { name: 'Log In' })",
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

    expect(result.shouldHeal).toBeTruthy();
    expect(result.healedLocator).toContain("getByRole('button'");
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.patch[0]).toContain('pages/login.page.ts');
  });

  test('infers response schemas, validates payloads, and emits contract test artifacts', async () => {
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

    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(expect.arrayContaining(['success', 'products']));
    expect(validResult.valid).toBeTruthy();
    expect(invalidResult.valid).toBeFalsy();
    expect(invalidResult.errors.join('\n')).toContain('payload.products[0].id expected number');
    expect(artifact.fileName).toBe('products-api.contract.spec.ts');
    expect(artifact.content).toContain('validateJsonAgainstSchema');
  });

  test('generates OWASP-oriented security cases from a requirement', async () => {
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

    expect(cases).toHaveLength(4);
    expect(cases.map((testCase) => testCase.category)).toEqual(
      expect.arrayContaining(['sql-injection', 'xss', 'auth-bypass', 'input-validation']),
    );
    expect(cases[0].steps.join(' ')).toContain('login API');
    expect(cases.some((testCase) => testCase.severity === 'critical')).toBeTruthy();
  });

  test('turns accessibility findings into remediation guidance and Playwright assertions', async () => {
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

    expect(artifact.summary).toContain('2 accessibility finding(s)');
    expect(artifact.recommendations).toHaveLength(2);
    expect(artifact.assertions.join('\n')).toContain('toHaveAccessibleName');
    expect(artifact.assertions.join('\n')).toContain("toHaveAttribute('alt'");
  });

  test('optimizes CI sharding and quarantine recommendations from suite telemetry', async () => {
    const plan = optimizePipeline(
      [
        {
          name: 'ui-chromium',
          averageDurationSeconds: 420,
          failureRate: 0.08,
          requiresSerial: false,
        },
        {
          name: 'stateful-banking',
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

    expect(plan.recommendedWorkers).toBe(1);
    expect(plan.shardCount).toBe(1);
    expect(plan.quarantinedTests).toContain('find transactions by date');
    expect(plan.workflowYaml).toContain('--grep-invert');
    expect(plan.rationale[1]).toContain('flaky test');
  });
});
