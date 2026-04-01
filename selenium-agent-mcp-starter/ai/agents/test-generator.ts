import * as fs from 'fs';
import * as path from 'path';
import { By } from 'selenium-webdriver';
import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';

interface AgentAction {
  type: 'login' | 'click' | 'type' | 'screenshot' | 'navigate' | 'assertText' | 'assertUrl';
  selector?: string;
  value?: string;
  username?: string;
  password?: string;
  path?: string;
  url?: string;
}

interface AgentTask {
  name?: string;
  url: string;
  actions: AgentAction[];
}

export class TestGeneratorAgent {
  private config: SeleniumConfig;

  constructor() {
    this.config = new SeleniumConfig();
  }

  async runAgentMap(mapFile: string): Promise<void> {
    const repoRoot = path.resolve(__dirname, '../..');
    const absoluteMapPath = path.resolve(repoRoot, mapFile);
    const rawMap = fs.readFileSync(absoluteMapPath, 'utf-8');
    const map: { tasks: AgentTask[] } = JSON.parse(this.interpolateEnv(rawMap));

    await this.generateArtifacts(repoRoot, map.tasks);
    await this.executeTasks(map.tasks);
  }

  private interpolateEnv(content: string): string {
    return content.replace(/\$\{([A-Z0-9_]+)\}/g, (_match, envKey: string) => process.env[envKey] ?? '');
  }

  private async executeTasks(tasks: AgentTask[]): Promise<void> {
    const driver = await this.config.getDriver();

    try {
      for (const task of tasks) {
        await driver.get(task.url);

        for (const action of task.actions) {
          switch (action.type) {
            case 'navigate':
              await driver.get(action.url ?? task.url);
              break;
            case 'login': {
              const loginPage = new LoginPage(driver);
              await loginPage.login(action.username ?? '', action.password ?? '');
              break;
            }
            case 'click':
              await driver.findElement(By.css(action.selector ?? 'body')).click();
              break;
            case 'type': {
              const input = await driver.findElement(By.css(action.selector ?? 'body'));
              await input.clear();
              await input.sendKeys(action.value ?? '');
              break;
            }
            case 'assertText': {
              const bodyText = await driver.findElement(By.css('body')).getText();
              if (!bodyText.includes(action.value ?? '')) {
                throw new Error(`Expected page to contain text: ${action.value}`);
              }
              break;
            }
            case 'assertUrl': {
              const currentUrl = await driver.getCurrentUrl();
              if (!currentUrl.includes(action.url ?? '')) {
                throw new Error(`Expected URL to include: ${action.url}, actual: ${currentUrl}`);
              }
              break;
            }
            case 'screenshot': {
              const screenshot = await driver.takeScreenshot();
              const screenshotPath = path.resolve(action.path ?? path.join(process.cwd(), 'screenshots', 'generated.png'));
              fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
              fs.writeFileSync(screenshotPath, screenshot, 'base64');
              break;
            }
          }
        }
      }
    } finally {
      await this.config.quitDriver();
    }
  }

  private async generateArtifacts(repoRoot: string, tasks: AgentTask[]): Promise<void> {
    const outputDir = path.join(repoRoot, 'tests', 'generated');
    const reportPath = path.join(repoRoot, 'docs', 'generated-coverage.md');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    fs.writeFileSync(path.join(outputDir, 'ai-generated.spec.ts'), this.renderSpec(tasks));
    fs.writeFileSync(reportPath, this.renderCoverage(repoRoot, tasks));
  }

  private renderSpec(tasks: AgentTask[]): string {
    const tests = tasks.map((task, index) => {
      const name = task.name ?? `Generated task ${index + 1}`;
      const steps = task.actions.map((action) => this.renderStep(action)).join('\n');
      return [
        `  it('${name}', async () => {`,
        `    await loginPage.navigate(${JSON.stringify(task.url)});`,
        steps,
        '  });',
      ].join('\n');
    });

    return [
      `import { expect } from 'chai';`,
      `import { By, WebDriver } from 'selenium-webdriver';`,
      `import { SeleniumConfig } from '../../selenium.config';`,
      `import { LoginPage } from '../../pages/login.page';`,
      '',
      `describe('AI Generated Journeys', () => {`,
      `  let config: SeleniumConfig;`,
      `  let driver: WebDriver;`,
      `  let loginPage: LoginPage;`,
      '',
      `  beforeEach(async () => {`,
      `    config = new SeleniumConfig();`,
      `    driver = await config.getDriver();`,
      `    loginPage = new LoginPage(driver);`,
      `  });`,
      '',
      `  afterEach(async () => {`,
      `    await config.quitDriver();`,
      `  });`,
      '',
      ...tests,
      `});`,
      '',
    ].join('\n');
  }

  private renderStep(action: AgentAction): string {
    switch (action.type) {
      case 'navigate':
        return `    await loginPage.navigate(${JSON.stringify(action.url ?? '/')});`;
      case 'login':
        return `    await loginPage.login(${JSON.stringify(action.username ?? '')}, ${JSON.stringify(action.password ?? '')});`;
      case 'click':
        return [
          `    const clickable = await driver.findElement(By.css(${JSON.stringify(action.selector ?? 'body')}));`,
          `    await clickable.click();`,
        ].join('\n');
      case 'type':
        return [
          `    const input = await driver.findElement(By.css(${JSON.stringify(action.selector ?? 'body')}));`,
          `    await input.clear();`,
          `    await input.sendKeys(${JSON.stringify(action.value ?? '')});`,
        ].join('\n');
      case 'assertText':
        return `    expect(await (await driver.findElement(By.css('body'))).getText()).to.contain(${JSON.stringify(action.value ?? '')});`;
      case 'assertUrl':
        return `    expect(await driver.getCurrentUrl()).to.contain(${JSON.stringify(action.url ?? '')});`;
      case 'screenshot':
        return `    await loginPage.takeScreenshot(${JSON.stringify(action.path ?? './screenshots/generated.png')});`;
      default:
        return `    // Unsupported action`;
    }
  }

  private renderCoverage(repoRoot: string, tasks: AgentTask[]): string {
    const existingSpecs = this.listFiles(path.join(repoRoot, 'tests'), '.spec.ts');
    const missingTasks = tasks.filter(
      (task) => !existingSpecs.some((file) => file.toLowerCase().includes((task.name ?? '').toLowerCase().replace(/\s+/g, '-'))),
    );

    return [
      '## Selenium TS Coverage Report',
      '',
      '### Covered',
      ...existingSpecs.map((file) => `- [x] ${file}`),
      '',
      '### Missing',
      ...(missingTasks.length ? missingTasks.map((task) => `- [ ] ${task.name ?? task.url}`) : ['- [x] No obvious gaps detected']),
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
}
