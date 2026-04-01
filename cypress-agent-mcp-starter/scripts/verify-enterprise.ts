import assert from 'node:assert/strict';
import { EnterpriseAgent } from '../cypress/support/agents/enterprise.agent';
import {
  analyzeAccessibilityFindings,
  analyzeFailure,
  buildSeedScript,
  detectFlakyTests,
  generateContractTestArtifact,
  generateEnterpriseScript,
  generateGovernedTestCases,
  generateOwaspSecurityCases,
  generateSyntheticRecords,
  inferJsonSchema,
  maskSensitiveFields,
  optimizePipeline,
  parseWebhookRequirement,
  planDraftPullRequest,
  reviewGeneratedCode,
  suggestLocatorHealing,
  validateJsonAgainstSchema,
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
}

function verifySelfHealing(): void {
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
  assert.equal(artifact.fileName, 'products-api.contract.cy.ts');
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
  assert.match(artifact.assertions.join('\n'), /have\.attr', 'alt'/);
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
}

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

console.log('Cypress enterprise verification passed.');
