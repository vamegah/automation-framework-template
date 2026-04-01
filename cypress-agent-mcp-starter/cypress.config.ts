import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenv.config();

type AxeViolationNode = {
  target: string[];
  html: string;
  failureSummary?: string;
};

type AxeViolation = {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  description: string;
  nodes: AxeViolationNode[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const formatViolationsForArtifact = (violations: AxeViolation[]) =>
  violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    helpUrl: violation.helpUrl,
    description: violation.description,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary ?? '',
    })),
  }));

const toMarkdownReport = (artifact: {
  testName: string;
  pageName: string;
  url: string;
  createdAt: string;
  violations: ReturnType<typeof formatViolationsForArtifact>;
}) => {
  const lines = [
    `# Accessibility Report`,
    ``,
    `- Test: ${artifact.testName}`,
    `- Page: ${artifact.pageName}`,
    `- URL: ${artifact.url}`,
    `- Created: ${artifact.createdAt}`,
    `- Violations: ${artifact.violations.length}`,
    ``,
  ];

  if (artifact.violations.length === 0) {
    lines.push(`No violations detected.`);
    return lines.join('\n');
  }

  artifact.violations.forEach((violation, index) => {
    lines.push(`## ${index + 1}. ${violation.id}`);
    lines.push(`- Impact: ${violation.impact}`);
    lines.push(`- Help: ${violation.help}`);
    lines.push(`- Help URL: ${violation.helpUrl}`);
    lines.push(`- Description: ${violation.description}`);
    lines.push(`- Nodes: ${violation.nodes.length}`);
    lines.push(``);

    violation.nodes.forEach((node, nodeIndex) => {
      lines.push(`### Node ${nodeIndex + 1}`);
      lines.push(`- Target: ${node.target.join(' | ')}`);
      if (node.failureSummary) {
        lines.push(`- Summary: ${node.failureSummary.replace(/\s+/g, ' ').trim()}`);
      }
      lines.push(`- HTML: \`${node.html.replace(/\s+/g, ' ').trim().slice(0, 240)}\``);
      lines.push(``);
    });
  });

  return lines.join('\n');
};

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
    supportFile: 'cypress/support/index.ts',
    specPattern: ['cypress/e2e/**/*.spec.ts', 'cypress/accessibility/**/*.spec.ts', 'cypress/database/**/*.spec.ts'],
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '10000'),
    setupNodeEvents(on, config) {
      on('task', {
        writeAccessibilityReport(input: {
          suiteName: string;
          testName: string;
          pageName: string;
          url: string;
          violations: AxeViolation[];
        }) {
          const reportDir = path.join(process.cwd(), 'test-results', 'accessibility', slugify(input.suiteName));
          fs.mkdirSync(reportDir, { recursive: true });

          const createdAt = new Date().toISOString();
          const violations = formatViolationsForArtifact(input.violations);
          const artifact = {
            suiteName: input.suiteName,
            testName: input.testName,
            pageName: input.pageName,
            url: input.url,
            createdAt,
            violations,
          };

          const fileStem = slugify(`${input.testName}-${input.pageName}`) || 'accessibility-report';
          const jsonPath = path.join(reportDir, `${fileStem}.json`);
          const markdownPath = path.join(reportDir, `${fileStem}.md`);

          fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2), 'utf8');
          fs.writeFileSync(markdownPath, toMarkdownReport(artifact), 'utf8');

          return { jsonPath, markdownPath };
        },
      });

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--lang=en-US');
        }

        if (browser.name === 'electron') {
          launchOptions.preferences ??= {};
          launchOptions.preferences.intl ??= {};
          launchOptions.preferences.intl.accept_languages = 'en-US,en';
        }

        return launchOptions;
      });

      return config;
    },
  },
  env: {
    ORANGEHRM_USERNAME: process.env.ORANGEHRM_USERNAME || 'Admin',
    ORANGEHRM_PASSWORD: process.env.ORANGEHRM_PASSWORD || 'admin123',
  },
});
