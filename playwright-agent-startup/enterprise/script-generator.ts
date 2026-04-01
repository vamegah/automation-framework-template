import * as fs from 'fs';
import * as path from 'path';
import {
  GeneratedScriptArtifact,
  PageObjectMethodMatch,
  ReviewBotFinding,
  ScriptGenerationRequest,
  SecretProvider,
} from './types';

interface PageObjectIndexEntry extends PageObjectMethodMatch {
  fileName: string;
}

function scanPageObjects(repoRoot: string): PageObjectIndexEntry[] {
  const pagesDir = path.join(repoRoot, 'pages');
  if (!fs.existsSync(pagesDir)) {
    return [];
  }

  return fs.readdirSync(pagesDir)
    .filter((file) => file.endsWith('.page.ts'))
    .map((file) => {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
      const classMatch = content.match(/export class (\w+)/);
      const methodMatches = [...content.matchAll(/\n\s+async\s+(\w+)\(/g)].map((match) => match[1]);
      return {
        className: classMatch?.[1] ?? path.basename(file, '.page.ts'),
        importPath: `../../pages/${file.replace(/\.ts$/, '')}`,
        methodNames: methodMatches,
        fileName: file.toLowerCase(),
      };
    });
}

function findPageObjectMatches(repoRoot: string, hint: string, scenario: string[]): PageObjectMethodMatch[] {
  const normalizedHint = hint.toLowerCase();
  return scanPageObjects(repoRoot)
    .filter((entry) => entry.fileName.includes(normalizedHint) || entry.className.toLowerCase().includes(normalizedHint))
    .map((entry) => {
      const methodNames = entry.methodNames.filter((methodName) =>
        scenario.some((step) => step.toLowerCase().includes(methodName.toLowerCase())),
      );

      return {
        className: entry.className,
        importPath: entry.importPath,
        methodNames: methodNames.length > 0 ? methodNames : entry.methodNames.slice(0, 3),
      };
    });
}

function buildSecretExpressions(secretKeys: string[], provider: SecretProvider): string[] {
  return secretKeys.map((key) => {
    if (provider === 'vault') {
      return `await getVaultSecret('${key}')`;
    }
    return `await getAwsSecret('${key}')`;
  });
}

function renderSecretHelpers(provider: SecretProvider): string {
  if (provider === 'vault') {
    return [
      'async function getVaultSecret(key: string): Promise<string> {',
      "  return process.env[key] ?? `vault://qa/${key}`;",
      '}',
    ].join('\n');
  }

  return [
    'async function getAwsSecret(key: string): Promise<string> {',
    "  return process.env[key] ?? `aws-secrets-manager://qa/${key}`;",
    '}',
  ].join('\n');
}

function renderPlaywrightScript(request: ScriptGenerationRequest, matches: PageObjectMethodMatch[], secretPlaceholders: string[]): string {
  const imports = ["import { test, expect } from '../fixtures/base.fixture';"];
  const objectConstruction: string[] = [];
  const reusableSteps: string[] = [];

  matches.forEach((match, index) => {
    imports.push(`import { ${match.className} } from '${match.importPath}';`);
    const variableName = `${match.className.charAt(0).toLowerCase()}${match.className.slice(1)}${index || ''}`;
    objectConstruction.push(`  const ${variableName} = new ${match.className}(page);`);
    if (match.methodNames[0]) {
      reusableSteps.push(`  await ${variableName}.${match.methodNames[0]}();`);
    }
  });

  const secretAssignments = request.secretKeys.map((key, index) => `  const ${key.toLowerCase()} = ${secretPlaceholders[index]};`);

  return [
    ...imports,
    '',
    renderSecretHelpers(request.secretProvider),
    '',
    `test('${request.testName}', async ({ page }) => {`,
    ...objectConstruction,
    ...secretAssignments,
    ...reusableSteps,
    ...request.scenario.map((step) => `  // ${step}`),
    ...request.assertions.map((assertion) => `  // Assert: ${assertion}`),
    '  await expect(page).toHaveURL(/.*/);',
    '});',
    '',
  ].join('\n');
}

function renderCSharpScript(request: ScriptGenerationRequest, matches: PageObjectMethodMatch[], secretPlaceholders: string[]): string {
  const usingLines = ['using Microsoft.Playwright;', 'using NUnit.Framework;'];
  const pomComment = matches.length > 0
    ? `// Reuse page objects: ${matches.map((match) => match.className).join(', ')}`
    : '// No matching page objects were found. Add one before merging.';

  return [
    ...usingLines,
    '',
    'namespace Generated.Tests;',
    '',
    'public class GeneratedEnterpriseTest',
    '{',
    '    [Test]',
    `    public async Task ${request.testName.replace(/[^A-Za-z0-9]+/g, '')}()`,
    '    {',
    `        ${pomComment}`,
    ...request.secretKeys.map((key, index) => `        var ${key.toLowerCase()} = "${secretPlaceholders[index]}";`),
    '        Assert.Pass("Draft enterprise script generated for review.");',
    '    }',
    '}',
    '',
  ].join('\n');
}

export function generateEnterpriseScript(repoRoot: string, request: ScriptGenerationRequest): GeneratedScriptArtifact {
  const matches = findPageObjectMatches(repoRoot, request.pageObjectHint, request.scenario);
  const secretPlaceholders = buildSecretExpressions(request.secretKeys, request.secretProvider);

  if (request.framework === 'typescript-playwright') {
    return {
      framework: request.framework,
      fileName: `${request.testName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.spec.ts`,
      content: renderPlaywrightScript(request, matches, secretPlaceholders),
      reusedPageObjects: matches,
      secretPlaceholders,
    };
  }

  if (request.framework === 'csharp-dotnet') {
    return {
      framework: request.framework,
      fileName: `${request.testName.replace(/[^A-Za-z0-9]+/g, '')}.cs`,
      content: renderCSharpScript(request, matches, secretPlaceholders),
      reusedPageObjects: matches,
      secretPlaceholders,
    };
  }

  return {
    framework: request.framework,
    fileName: `${request.testName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`,
    content: `Framework ${request.framework} is supported conceptually. Add a project-specific renderer before merge.`,
    reusedPageObjects: matches,
    secretPlaceholders,
  };
}

export function reviewGeneratedCode(content: string): ReviewBotFinding[] {
  const findings: ReviewBotFinding[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (/waitForTimeout|sleep\(/.test(line)) {
      findings.push({
        severity: 'error',
        rule: 'no-hard-waits',
        message: 'Replace hard waits with resilient Playwright waits.',
        line: index + 1,
      });
    }

    if (/password\s*=\s*["'][^"']+["']|api[_-]?key\s*[:=]\s*["'][^"']+["']/i.test(line)) {
      findings.push({
        severity: 'error',
        rule: 'no-hardcoded-secrets',
        message: 'Credentials must come from Vault, AWS Secrets Manager, or environment placeholders.',
        line: index + 1,
      });
    }
  });

  return findings;
}
