import { Page } from '@playwright/test';
import { Page as CorePage } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { AxeResults, Result } from 'axe-core';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { TestInfo } from '@playwright/test';

const buildWcagAudit = (page: Page) =>
  new AxeBuilder({ page: page as unknown as CorePage }).withTags(['wcag2a', 'wcag2aa']);

export const runAxeAudit = async (page: Page): Promise<AxeResults> =>
  buildWcagAudit(page).analyze();

export const getWcagViolations = async (page: Page): Promise<Result[]> =>
  (await buildWcagAudit(page).analyze()).violations;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const serializeViolations = (violations: Result[]) =>
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
  suiteName: string;
  testName: string;
  pageName: string;
  url: string;
  createdAt: string;
  violations: ReturnType<typeof serializeViolations>;
}) => {
  const lines = [
    '# Accessibility Report',
    '',
    `- Suite: ${artifact.suiteName}`,
    `- Test: ${artifact.testName}`,
    `- Page: ${artifact.pageName}`,
    `- URL: ${artifact.url}`,
    `- Created: ${artifact.createdAt}`,
    `- Violations: ${artifact.violations.length}`,
    '',
  ];

  if (artifact.violations.length === 0) {
    lines.push('No violations detected.');
    return lines.join('\n');
  }

  artifact.violations.forEach((violation, index) => {
    lines.push(`## ${index + 1}. ${violation.id}`);
    lines.push(`- Impact: ${violation.impact}`);
    lines.push(`- Help: ${violation.help}`);
    lines.push(`- Help URL: ${violation.helpUrl}`);
    lines.push(`- Description: ${violation.description}`);
    lines.push(`- Nodes: ${violation.nodes.length}`);
    lines.push('');

    violation.nodes.forEach((node, nodeIndex) => {
      lines.push(`### Node ${nodeIndex + 1}`);
      lines.push(`- Target: ${node.target.join(' | ')}`);
      if (node.failureSummary) {
        lines.push(`- Summary: ${node.failureSummary.replace(/\s+/g, ' ').trim()}`);
      }
      lines.push(`- HTML: \`${node.html.replace(/\s+/g, ' ').trim().slice(0, 240)}\``);
      lines.push('');
    });
  });

  return lines.join('\n');
};

export const writeAccessibilityArtifact = async (
  testInfo: TestInfo,
  input: {
    suiteName: string;
    testName: string;
    pageName: string;
    url: string;
    violations: Result[];
  },
) => {
  const createdAt = new Date().toISOString();
  const violations = serializeViolations(input.violations);
  const artifact = {
    suiteName: input.suiteName,
    testName: input.testName,
    pageName: input.pageName,
    url: input.url,
    createdAt,
    violations,
  };

  const reportDir = testInfo.outputPath(path.join('accessibility', slugify(input.suiteName)));
  await fs.mkdir(reportDir, { recursive: true });

  const fileStem = slugify(`${input.testName}-${input.pageName}`) || 'accessibility-report';
  const jsonPath = path.join(reportDir, `${fileStem}.json`);
  const markdownPath = path.join(reportDir, `${fileStem}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(artifact, null, 2), 'utf8');
  await fs.writeFile(markdownPath, toMarkdownReport(artifact), 'utf8');

  await testInfo.attach(`${fileStem}-json`, {
    path: jsonPath,
    contentType: 'application/json',
  });
  await testInfo.attach(`${fileStem}-markdown`, {
    path: markdownPath,
    contentType: 'text/markdown',
  });
};
