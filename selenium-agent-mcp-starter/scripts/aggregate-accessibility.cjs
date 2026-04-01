const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, 'test-results');
const outputJson = path.join(reportsDir, 'accessibility-index.json');
const outputMarkdown = path.join(reportsDir, 'accessibility-index.md');

const walk = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
  });
};

const isAccessibilityArtifact = (value) =>
  value
  && typeof value === 'object'
  && typeof value.suiteName === 'string'
  && typeof value.testName === 'string'
  && typeof value.pageName === 'string'
  && typeof value.url === 'string'
  && typeof value.createdAt === 'string'
  && Array.isArray(value.violations);

const summarizeViolations = (violations) => ({
  count: violations.length,
  ids: [...new Set(violations.map((violation) => violation.id))].sort(),
  impacts: [...new Set(violations.map((violation) => violation.impact || 'unknown'))].sort(),
  nodes: violations.reduce((total, violation) => total + (violation.nodes?.length || 0), 0),
});

const readArtifacts = () =>
  walk(reportsDir)
    .map((filePath) => {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return isAccessibilityArtifact(parsed)
          ? { ...parsed, sourcePath: path.relative(rootDir, filePath).replaceAll('\\', '/') }
          : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

const getPreferenceScore = (artifact) => {
  if (artifact.sourcePath.includes('/accessibility/')) {
    return 2;
  }

  if (artifact.sourcePath.includes('/attachments/')) {
    return 1;
  }

  return 0;
};

const latestByKey = (artifacts) => {
  const latest = new Map();

  for (const artifact of artifacts) {
    const key = `${artifact.suiteName}::${artifact.testName}::${artifact.pageName}`;
    const current = latest.get(key);
    const artifactTime = new Date(artifact.createdAt).getTime();
    const currentTime = current ? new Date(current.createdAt).getTime() : -1;
    const artifactScore = getPreferenceScore(artifact);
    const currentScore = current ? getPreferenceScore(current) : -1;

    if (
      !current
      || artifactTime > currentTime
      || (artifactTime === currentTime && artifactScore > currentScore)
    ) {
      latest.set(key, artifact);
    }
  }

  return [...latest.values()].sort((a, b) =>
    `${a.suiteName}${a.testName}${a.pageName}`.localeCompare(`${b.suiteName}${b.testName}${b.pageName}`),
  );
};

const toMarkdown = (summary) => {
  const lines = [
    '# Accessibility Index',
    '',
    `- Generated: ${summary.generatedAt}`,
    `- Project: ${summary.projectName}`,
    `- Reports: ${summary.reports.length}`,
    '',
  ];

  if (summary.reports.length === 0) {
    lines.push('No accessibility artifacts found.');
    return lines.join('\n');
  }

  summary.reports.forEach((report, index) => {
    lines.push(`## ${index + 1}. ${report.suiteName} / ${report.pageName}`);
    lines.push(`- Test: ${report.testName}`);
    lines.push(`- URL: ${report.url}`);
    lines.push(`- Created: ${report.createdAt}`);
    lines.push(`- Violation Count: ${report.summary.count}`);
    lines.push(`- Impacts: ${report.summary.impacts.join(', ') || 'none'}`);
    lines.push(`- IDs: ${report.summary.ids.join(', ') || 'none'}`);
    lines.push(`- Source JSON: ${report.sourcePath}`);
    lines.push('');
  });

  return lines.join('\n');
};

const artifacts = latestByKey(readArtifacts());

const summary = {
  projectName: path.basename(rootDir),
  generatedAt: new Date().toISOString(),
  reports: artifacts.map((artifact) => ({
    suiteName: artifact.suiteName,
    testName: artifact.testName,
    pageName: artifact.pageName,
    url: artifact.url,
    createdAt: artifact.createdAt,
    sourcePath: artifact.sourcePath,
    summary: summarizeViolations(artifact.violations),
  })),
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outputJson, JSON.stringify(summary, null, 2), 'utf8');
fs.writeFileSync(outputMarkdown, toMarkdown(summary), 'utf8');

console.log(`Accessibility index written to ${path.relative(rootDir, outputJson)}`);
console.log(`Accessibility index written to ${path.relative(rootDir, outputMarkdown)}`);
