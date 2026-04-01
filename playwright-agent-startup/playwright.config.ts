import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import { Timeouts } from './utils';

/**
 * Playwright Configuration
 *
 * This config reads environment variables from .env (via dotenv) and sets up
 * multi-browser testing with sensible defaults for both local and CI runs.
 *
 * Projects:
 *   - setup:    Runs auth.setup.ts first (login, save storageState)
 *   - chromium: UI tests in Chrome (depends on setup)
 *   - firefox:  UI tests in Firefox (depends on setup)
 *   - webkit:   UI tests in Safari (depends on setup)
 *   - api:      API-only tests — no browser launched
 *
 * Usage:
 *   npm test            - Run all tests across all browsers
 *   npm run test:ui     - Run only @ui-tagged tests
 *   npm run test:api    - Run only @api-tagged tests
 *   npm run test:debug  - Run tests in debug mode (headed + Playwright Inspector)
 *   npm run report      - Open the HTML report
 *
 * @see https://playwright.dev/docs/test-configuration
 */

/** Stored outside outputDir so Playwright doesn't wipe it between runs. */
const AUTH_STATE_PATH = '.auth/state.json';

export default defineConfig({
  /* Directory where test files are located */
  testDir: './tests',

  /* Directory for test artifacts (screenshots, videos, traces) */
  outputDir: './test-results',

  /* Maximum time a single test can run */
  timeout: Timeouts.TEST,

  /* Maximum time expect() assertions can wait */
  expect: {
    timeout: Timeouts.MEDIUM,
  },

  /* Keep the public demo stable by avoiding overlapping stateful flows. */
  fullyParallel: false,

  /* Fail the build on CI if test.only is left in source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests: 2 on CI, 1 locally (catches flaky tests during dev) */
  retries: process.env.CI ? 2 : 1,

  /* The live ParaBank demo is sensitive to concurrent write flows. */
  workers: 1,

  /* Reporter configuration */
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  webServer: {
    command: 'node controlled-target/server.ts',
    url: `http://127.0.0.1:${process.env.CONTROLLED_TARGET_PORT || '4300'}/index.htm`,
    reuseExistingServer: !process.env.CI,
    timeout: Timeouts.GLOBAL,
  },

  /* Shared settings applied to all projects below */
  use: {
    /* Base URL for navigation actions like page.goto('/') */
    baseURL: process.env.BASE_URL || 'https://parabank.parasoft.com/parabank/index.htm',

    /* Timeout for actions like click(), fill(), etc. — fail fast instead of hanging */
    actionTimeout: Timeouts.LONG,

    /* Timeout for page.goto() and navigations */
    navigationTimeout: Timeouts.NAVIGATION,

    /* Capture trace on first retry to help debug flaky tests */
    trace: 'on-first-retry',

    /* Take screenshots only when a test fails */
    screenshot: 'only-on-failure',

    /* Record video but keep only for failed tests */
    video: 'retain-on-failure',

    /* Extra HTTP headers (useful for API testing or auth tokens) */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  projects: [
    /* ---- Auth setup (runs before UI projects) ---- */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ---- UI browser projects (depend on auth setup) ---- */
    {
      name: 'chromium',
      grepInvert: /@api|@controlled|@unstable/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      grepInvert: /@api|@controlled|@unstable/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      grepInvert: /@api|@controlled|@unstable/,
      use: {
        ...devices['Desktop Safari'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },

    /* ---- API project (no browser — faster, cleaner separation) ---- */
    {
      name: 'controlled-chromium',
      grep: /@controlled/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${process.env.CONTROLLED_TARGET_PORT || '4300'}/`,
        storageState: undefined,
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL || 'https://httpbin.org',
      },
    },
  ],
});
