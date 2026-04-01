import * as fs from 'node:fs';
import * as path from 'node:path';

type AccessibilityNode = {
  target: string[];
  html: string;
  failureSummary?: string;
};

type AccessibilityViolation = {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | 'info' | 'unknown';
  help: string;
  helpUrl: string;
  description: string;
  nodes: AccessibilityNode[];
};

type AccessibilityArtifactInput = {
  suiteName: string;
  testName: string;
  pageName: string;
  url: string;
  violations: AccessibilityViolation[];
  metrics?: Record<string, number>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const toMarkdownReport = (artifact: AccessibilityArtifactInput & { createdAt: string }) => {
  const lines = [
    '# Accessibility Report',
    '',
    `- Test: ${artifact.testName}`,
    `- Page: ${artifact.pageName}`,
    `- URL: ${artifact.url}`,
    `- Created: ${artifact.createdAt}`,
    `- Violations: ${artifact.violations.length}`,
    '',
  ];

  if (artifact.metrics && Object.keys(artifact.metrics).length > 0) {
    lines.push('## Metrics');
    Object.entries(artifact.metrics).forEach(([key, value]) => {
      lines.push(`- ${key}: ${value}`);
    });
    lines.push('');
  }

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

export const writeAccessibilityArtifact = (input: AccessibilityArtifactInput) => {
  const reportDir = path.join(process.cwd(), 'test-results', 'accessibility', slugify(input.suiteName));
  fs.mkdirSync(reportDir, { recursive: true });

  const createdAt = new Date().toISOString();
  const artifact = {
    ...input,
    createdAt,
  };

  const fileStem = slugify(`${input.testName}-${input.pageName}`) || 'accessibility-report';
  const jsonPath = path.join(reportDir, `${fileStem}.json`);
  const markdownPath = path.join(reportDir, `${fileStem}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2), 'utf8');
  fs.writeFileSync(markdownPath, toMarkdownReport(artifact), 'utf8');

  return {
    jsonPath,
    markdownPath,
  };
};

export const createHeuristicViolation = (input: {
  id: string;
  impact: AccessibilityViolation['impact'];
  help: string;
  helpUrl: string;
  description: string;
  nodes: AccessibilityNode[];
}) => input;
