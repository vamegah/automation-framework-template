import { test as base, expect, APIRequestContext } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Custom Playwright Fixtures
 *
 * Fixtures are reusable setup/teardown blocks that Playwright injects into your
 * tests automatically. They replace the need for beforeEach/afterEach hooks in
 * most cases and provide better isolation between tests.
 *
 * How fixtures work:
 *   1. You declare them below using base.extend<MyFixtures>({...})
 *   2. In your test files, import { test, expect } from this file
 *   3. Playwright creates a fresh fixture for each test that uses it
 *   4. After the test, the fixture is automatically torn down
 *
 * @see https://playwright.dev/docs/test-fixtures
 */

/** Type definitions for our custom fixtures */
type CustomFixtures = {
  /** A page that has already navigated to the application's base URL */
  homePage: Page;

  /** A pre-configured API request context for making HTTP calls */
  apiContext: APIRequestContext;
};

/**
 * Extended test object with custom fixtures.
 *
 * Import this in your test files instead of the default '@playwright/test':
 *
 *   import { test, expect } from '../fixtures/base.fixture';
 */
export const test = base.extend<CustomFixtures>({
  /**
   * homePage fixture
   *
   * Navigates to the base URL before the test starts.
   * The page is automatically closed after the test completes.
   *
   * Usage in tests:
   *   test('my test', async ({ homePage }) => {
   *     // homePage is already at baseURL - start asserting!
   *     await expect(homePage).toHaveTitle(/./);
   *   });
   */
  homePage: async ({ page, baseURL }, use) => {
    // Navigate to the base URL (configured in playwright.config.ts)
    await page.goto(baseURL ?? '/');

    // Wait for the page to be fully loaded before handing it to the test
    await page.waitForLoadState('domcontentloaded');

    // Provide the page to the test function
    await use(page);

    // Teardown: Playwright automatically closes the page after the test
  },

  /**
   * apiContext fixture
   *
   * Creates an APIRequestContext configured with the API base URL from
   * environment variables. This is the recommended way to make API calls
   * in Playwright tests (instead of using external tools like Postman).
   *
   * Usage in tests:
   *   test('my api test', async ({ apiContext }) => {
   *     const response = await apiContext.get('/api/health');
   *     expect(response.ok()).toBeTruthy();
   *   });
   */
  apiContext: async ({ playwright }, use) => {
    // Create a new API context with the API base URL
    // Falls back to BASE_URL if API_BASE_URL is not set
    // Default to httpbin.org — a public HTTP testing service that always works.
    // Set API_BASE_URL in your .env to point to your own API.
    const apiBaseUrl = process.env.API_BASE_URL
      || 'https://httpbin.org';

    const context = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Provide the API context to the test
    await use(context);

    // Teardown: Dispose of the API context to free resources
    await context.dispose();
  },
});

/**
 * Re-export expect so test files only need one import:
 *
 *   import { test, expect } from '../fixtures/base.fixture';
 */
export { expect };
