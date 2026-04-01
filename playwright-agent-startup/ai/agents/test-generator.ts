import * as fs from 'fs';
import * as path from 'path';
import { Agent } from './agent';

type JourneyPriority = 'high' | 'medium' | 'low';
type JourneyKind = 'ui' | 'api';
type StepType =
  | 'navigate'
  | 'login'
  | 'click'
  | 'type'
  | 'assertText'
  | 'assertUrl'
  | 'request'
  | 'assertStatus'
  | 'screenshot';

interface GeneratorStep {
  type: StepType;
  selector?: string;
  value?: string;
  text?: string;
  path?: string;
  url?: string;
  username?: string;
  password?: string;
  method?: 'GET' | 'POST';
  status?: number;
}

interface GeneratorJourney {
  name: string;
  description?: string;
  kind: JourneyKind;
  priority: JourneyPriority;
  tags: string[];
  route?: string;
  steps: GeneratorStep[];
}

interface GeneratorPage {
  name: string;
  route: string;
  pageObjectPath?: string;
  requiresAuth?: boolean;
  interactiveElements: string[];
}

interface GeneratorMap {
  pages?: Array<Partial<GeneratorPage>>;
  journeys?: Array<Partial<GeneratorJourney>>;
  tasks?: Array<{
    url: string;
    actions: GeneratorStep[];
  }>;
}

interface TestGeneratorArgs {
  url: string;
  mapPath?: string;
  outputDir?: string;
  reportPath?: string;
}

class TestGeneratorAgent implements Agent {
  async run(args: TestGeneratorArgs): Promise<void> {
    const repoRoot = path.resolve(__dirname, '../..');
    const map = args.mapPath ? this.loadMap(path.resolve(repoRoot, args.mapPath)) : undefined;
    const pages = await this.explore(args.url, repoRoot, map);
    const journeys = await this.mapUserJourneys(pages, map);

    const outputDir = path.resolve(repoRoot, args.outputDir ?? 'tests');
    await this.generateTests(journeys, outputDir);

    const reportPath = path.resolve(repoRoot, args.reportPath ?? 'ai/reports/test-generator-coverage.md');
    await this.detectMissingCoverage(repoRoot, pages, journeys, reportPath);

    console.log(`Generated ${journeys.length} journeys and wrote coverage report to ${reportPath}`);
  }

  private loadMap(filePath: string): GeneratorMap {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as GeneratorMap;
  }

  private async explore(url: string, repoRoot: string, map?: GeneratorMap): Promise<GeneratorPage[]> {
    const pagesDir = path.join(repoRoot, 'pages');
    const discoveredPages: GeneratorPage[] = [];
    const seenRoutes = new Set<string>();
    const pageFiles = fs.existsSync(pagesDir)
      ? fs.readdirSync(pagesDir).filter((file) => file.endsWith('.page.ts'))
      : [];

    for (const file of pageFiles) {
      const route = file.includes('login') ? '/login' : '/';
      const pageName = this.toTitleCase(path.basename(file, '.page.ts').replace('.', ' '));
      discoveredPages.push({
        name: pageName,
        route,
        pageObjectPath: `pages/${file}`,
        requiresAuth: route !== '/',
        interactiveElements: route === '/login' ? ['username', 'password', 'submit'] : ['navigation'],
      });
      seenRoutes.add(route);
    }

    if (!seenRoutes.has('/')) {
      discoveredPages.push({
        name: 'Home',
        route: '/',
        interactiveElements: ['navigation', 'links'],
      });
      seenRoutes.add('/');
    }

    if (!seenRoutes.has('/login')) {
      discoveredPages.push({
        name: 'Login',
        route: '/login',
        interactiveElements: ['username', 'password', 'submit'],
      });
      seenRoutes.add('/login');
    }

    if (map?.pages) {
      for (const page of map.pages) {
        if (!page.route || seenRoutes.has(page.route)) {
          continue;
        }

        discoveredPages.push({
          name: page.name ?? this.toTitleCase(page.route.replace(/\//g, ' ')),
          route: page.route,
          pageObjectPath: page.pageObjectPath,
          requiresAuth: page.requiresAuth ?? false,
          interactiveElements: page.interactiveElements ?? [],
        });
        seenRoutes.add(page.route);
      }
    }

    const target = new URL(url);
    return discoveredPages.map((page) => ({
      ...page,
      route: page.route.startsWith('http') ? page.route : `${target.origin}${page.route}`,
    }));
  }

  private async mapUserJourneys(pages: GeneratorPage[], map?: GeneratorMap): Promise<GeneratorJourney[]> {
    if (map?.journeys?.length) {
      return map.journeys.map((journey) => ({
        name: journey.name ?? 'Generated Journey',
        description: journey.description,
        kind: journey.kind ?? 'ui',
        priority: journey.priority ?? 'medium',
        tags: journey.tags ?? ['@regression'],
        route: journey.route,
        steps: journey.steps ?? [],
      }));
    }

    if (map?.tasks?.length) {
      return map.tasks.map((task, index) => ({
        name: `Task ${index + 1}`,
        kind: 'ui',
        priority: index === 0 ? 'high' : 'medium',
        tags: index === 0 ? ['@smoke', '@ui'] : ['@regression', '@ui'],
        route: task.url,
        steps: task.actions,
      }));
    }

    const journeys: GeneratorJourney[] = [];
    const loginPage = pages.find((page) => page.route.endsWith('/login'));
    if (loginPage) {
      journeys.push({
        name: 'User Login',
        description: 'Verify an invalid login displays an accessible error.',
        kind: 'ui',
        priority: 'high',
        tags: ['@smoke', '@ui'],
        route: loginPage.route,
        steps: [
          { type: 'navigate', url: loginPage.route },
          { type: 'login', username: 'invalid', password: 'invalid' },
          { type: 'assertText', text: 'Invalid username or password' },
        ],
      });
    }

    const homePage = pages.find((page) => page.route.endsWith('/'));
    journeys.push({
      name: 'Home Page Smoke',
      description: 'Verify the app shell loads.',
      kind: 'ui',
      priority: 'high',
      tags: ['@smoke', '@ui'],
      route: homePage?.route,
      steps: [
        { type: 'navigate', url: homePage?.route },
        { type: 'assertUrl', url: '/' },
      ],
    });

    journeys.push({
      name: 'API Health Check',
      description: 'Verify the API baseline endpoint returns HTTP 200.',
      kind: 'api',
      priority: 'high',
      tags: ['@smoke', '@api'],
      route: '/get',
      steps: [
        { type: 'request', method: 'GET', url: '/get' },
        { type: 'assertStatus', status: 200 },
      ],
    });

    return journeys;
  }

  private async generateTests(journeys: GeneratorJourney[], outputDir: string): Promise<void> {
    const uiJourneys = journeys.filter((journey) => journey.kind === 'ui');
    const apiJourneys = journeys.filter((journey) => journey.kind === 'api');

    const uiDir = path.join(outputDir, 'ui', 'generated');
    const apiDir = path.join(outputDir, 'api', 'generated');
    fs.mkdirSync(uiDir, { recursive: true });
    fs.mkdirSync(apiDir, { recursive: true });

    if (uiJourneys.length) {
      fs.writeFileSync(path.join(uiDir, 'ai-generated.spec.ts'), this.renderUiSpec(uiJourneys));
    }

    if (apiJourneys.length) {
      fs.writeFileSync(path.join(apiDir, 'ai-generated.spec.ts'), this.renderApiSpec(apiJourneys));
    }
  }

  private async detectMissingCoverage(
    repoRoot: string,
    pages: GeneratorPage[],
    journeys: GeneratorJourney[],
    reportPath: string,
  ): Promise<void> {
    const pageObjects = this.listFiles(path.join(repoRoot, 'pages'), '.page.ts');
    const tests = this.listFiles(path.join(repoRoot, 'tests'), '.spec.ts');
    const missingPages = pages.filter(
      (page) => !tests.some((testFile) => testFile.toLowerCase().includes(path.basename(page.route).toLowerCase())),
    );
    const missingJourneys = journeys.filter(
      (journey) => !tests.some((testFile) => testFile.toLowerCase().includes(this.toKebabCase(journey.name))),
    );

    const recommendations = [
      ...missingPages.map((page) => `Add coverage for ${page.name} (${page.route})`),
      ...missingJourneys.map((journey) => `Add or keep generated coverage for ${journey.name}`),
      ...pageObjects
        .filter((pageObject) => !tests.some((testFile) => testFile.includes(path.basename(pageObject, '.page.ts'))))
        .map((pageObject) => `Page object without obvious spec coverage: ${pageObject}`),
    ];

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      [
        '## Coverage Report',
        '',
        '### Covered',
        ...tests.map((testFile) => `- [x] ${testFile}`),
        '',
        '### Missing',
        ...(missingPages.length || missingJourneys.length
          ? [
              ...missingPages.map((page) => `- [ ] Page coverage missing for ${page.name} (${page.route})`),
              ...missingJourneys.map((journey) => `- [ ] Journey missing dedicated spec name for ${journey.name}`),
            ]
          : ['- [x] No obvious coverage gaps were detected']),
        '',
        '### Recommendations',
        ...(recommendations.length
          ? recommendations.map((item, index) => `${index + 1}. ${item}`)
          : ['1. Keep generated specs aligned with the product flows.']),
        '',
      ].join('\n'),
    );
  }

  private renderUiSpec(journeys: GeneratorJourney[]): string {
    const needsLoginPage = journeys.some((journey) => journey.steps.some((step) => step.type === 'login'));
    const importLines = [
      `import { test, expect } from '../../fixtures/base.fixture';`,
      needsLoginPage ? `import { LoginPage } from '../../../pages/login.page';` : '',
      '',
    ].filter(Boolean);

    const tests = journeys.map((journey) => {
      const body = journey.steps.map((step) => this.renderPlaywrightStep(step)).join('\n');
      return [
        `  test('${journey.name} ${journey.tags.join(' ')}', async ({ page }) => {`,
        needsLoginPage && journey.steps.some((step) => step.type === 'login') ? `    const loginPage = new LoginPage(page);` : '',
        body,
        '  });',
      ]
        .filter(Boolean)
        .join('\n');
    });

    return [...importLines, `test.describe('AI Generated Journeys', () => {`, ...tests, `});`, ''].join('\n');
  }

  private renderApiSpec(journeys: GeneratorJourney[]): string {
    const tests = journeys.map((journey) => {
      const body = journey.steps.map((step) => this.renderPlaywrightApiStep(step)).join('\n');
      return [`  test('${journey.name} ${journey.tags.join(' ')}', async ({ apiContext }) => {`, body, '  });'].join('\n');
    });

    return [
      `import { test, expect } from '../../fixtures/base.fixture';`,
      '',
      `test.describe('AI Generated API Journeys', () => {`,
      ...tests,
      `});`,
      '',
    ].join('\n');
  }

  private renderPlaywrightStep(step: GeneratorStep): string {
    switch (step.type) {
      case 'navigate':
        return `    await page.goto(${JSON.stringify(step.url ?? '/')});`;
      case 'login':
        return [
          `    await loginPage.navigateToLogin();`,
          `    await loginPage.login(${JSON.stringify(step.username ?? 'invalid')}, ${JSON.stringify(step.password ?? 'invalid')});`,
        ].join('\n');
      case 'click':
        return `    await page.locator(${JSON.stringify(step.selector ?? 'body')}).click();`;
      case 'type':
        return `    await page.locator(${JSON.stringify(step.selector ?? 'body')}).fill(${JSON.stringify(step.value ?? '')});`;
      case 'assertText':
        return `    await expect(page.getByText(${JSON.stringify(step.text ?? step.value ?? '')})).toBeVisible();`;
      case 'assertUrl':
        return `    await expect(page).toHaveURL(/${this.escapeForRegex(step.url ?? '')}/);`;
      case 'screenshot':
        return `    await page.screenshot({ path: ${JSON.stringify(step.path ?? 'test-results/generated.png')} });`;
      default:
        return `    // Unsupported UI step: ${step.type}`;
    }
  }

  private renderPlaywrightApiStep(step: GeneratorStep): string {
    switch (step.type) {
      case 'request':
        return `    const response = await apiContext.${(step.method ?? 'GET').toLowerCase()}(${JSON.stringify(step.url ?? '/')});`;
      case 'assertStatus':
        return `    expect(response.status()).toBe(${step.status ?? 200});`;
      default:
        return `    // Unsupported API step: ${step.type}`;
    }
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

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private toKebabCase(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private escapeForRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const testGeneratorAgent = new TestGeneratorAgent();
