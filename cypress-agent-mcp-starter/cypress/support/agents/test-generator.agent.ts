import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent, AgentMap, AgentTask, AgentAction } from './base.agent';

interface Journey {
  name: string;
  tags: string[];
  route: string;
  task: AgentTask;
}

export class TestGeneratorAgent extends BaseAgent {
  execute(map: AgentMap): void {
    map.tasks.forEach((task) => {
      if (task.url) {
        cy.visit(task.url);
      }

      task.actions.forEach((action) => {
        switch (action.type) {
          case 'login':
            cy.get('#username').clear().type(action.username ?? '');
            cy.get('#password').clear().type(action.password ?? '');
            cy.get('button[type="submit"]').click();
            break;
          case 'click':
            cy.get(action.selector ?? 'body').click();
            break;
          case 'type':
            cy.get(action.selector ?? 'body').clear().type(action.value ?? '');
            break;
          case 'screenshot':
            cy.screenshot(action.path ?? 'generated-shot');
            break;
          case 'navigate':
            cy.visit(action.url || task.url);
            break;
          case 'assertText':
            cy.contains(action.value ?? action.text ?? '').should('be.visible');
            break;
          case 'assertUrl':
            cy.url().should('include', action.url ?? '');
            break;
        }
      });
    });
  }

  generateFromFile(filePath: string, repoRoot = path.resolve(__dirname, '../../..')): string {
    const absolutePath = path.resolve(repoRoot, filePath);
    const rawMap = fs.readFileSync(absolutePath, 'utf8');
    const map = JSON.parse(this.interpolateEnv(rawMap)) as AgentMap;
    const journeys = this.buildJourneys(map);
    const outputDir = path.join(repoRoot, 'cypress', 'e2e', 'generated');
    const reportPath = path.join(repoRoot, 'docs', 'generated-coverage.md');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    const specPath = path.join(outputDir, 'ai-generated.spec.ts');
    fs.writeFileSync(specPath, this.renderSpec(journeys));
    fs.writeFileSync(reportPath, this.renderCoverage(repoRoot, journeys));
    return specPath;
  }

  private interpolateEnv(content: string): string {
    return content.replace(/\$\{([A-Z0-9_]+)\}/g, (_match, envKey: string) => process.env[envKey] ?? '');
  }

  private buildJourneys(map: AgentMap): Journey[] {
    return map.tasks.map((task, index) => ({
      name: task.name ?? `Task ${index + 1}`,
      tags: index === 0 ? ['@smoke', '@ui'] : ['@regression', '@ui'],
      route: task.url,
      task,
    }));
  }

  private renderSpec(journeys: Journey[]): string {
    const tests = journeys.map((journey) => {
      const lines = [
        `  it('${journey.name} ${journey.tags.join(' ')}', () => {`,
        `    cy.visit(${JSON.stringify(journey.route)});`,
        ...journey.task.actions.map((action) => this.renderAction(action)),
        '  });',
      ];
      return lines.join('\n');
    });

    return [`describe('AI Generated Journeys', () => {`, ...tests, `});`, ''].join('\n');
  }

  private renderAction(action: AgentAction): string {
    switch (action.type) {
      case 'navigate':
        return `    cy.visit(${JSON.stringify(action.url ?? '/')});`;
      case 'login':
        return [
          `    cy.get('#username').clear().type(${JSON.stringify(action.username ?? '')});`,
          `    cy.get('#password').clear().type(${JSON.stringify(action.password ?? '')});`,
          `    cy.get('button[type="submit"]').click();`,
        ].join('\n');
      case 'click':
        return `    cy.get(${JSON.stringify(action.selector ?? 'body')}).click();`;
      case 'type':
        return `    cy.get(${JSON.stringify(action.selector ?? 'body')}).clear().type(${JSON.stringify(action.value ?? '')});`;
      case 'screenshot':
        return `    cy.screenshot(${JSON.stringify(action.path ?? 'generated-shot')});`;
      case 'assertText':
        return `    cy.contains(${JSON.stringify(action.value ?? action.text ?? '')}).should('be.visible');`;
      case 'assertUrl':
        return `    cy.url().should('include', ${JSON.stringify(action.url ?? '')});`;
      default: {
        const exhaustiveCheck: never = action;
        return `    // Unsupported action ${(exhaustiveCheck as any).type}`;
      }
    }
  }

  private renderCoverage(repoRoot: string, journeys: Journey[]): string {
    const existingSpecs = this.listFiles(path.join(repoRoot, 'cypress', 'e2e'), '.spec.ts');
    const missing = journeys.filter(
      (journey) => !existingSpecs.some((file) => file.toLowerCase().includes(this.toKebabCase(journey.name))),
    );

    return [
      '## Cypress Coverage Report',
      '',
      '### Covered',
      ...existingSpecs.map((file) => `- [x] ${file}`),
      '',
      '### Missing',
      ...(missing.length ? missing.map((journey) => `- [ ] ${journey.name}`) : ['- [x] No obvious gaps detected']),
      '',
    ].join('\n');
  }

  private listFiles(rootDir: string, extension: string): string[] {
    if (!fs.existsSync(rootDir)) {
      return [];
    }

    const files: string[] = [];
    const visit = (currentDir: string): void => {
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        const entryPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          visit(entryPath);
        } else if (entry.name.endsWith(extension)) {
          files.push(path.relative(rootDir, entryPath).replace(/\\/g, '/'));
        }
      }
    };

    visit(rootDir);
    return files;
  }

  private toKebabCase(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
}
