import { Page, Locator } from '@playwright/test';

/**
 * BasePage - Foundation for the Page Object Model (POM)
 *
 * The Page Object Model is a design pattern that creates an abstraction layer
 * between your test code and the page structure. Each page (or significant
 * component) in your application gets its own class that:
 *
 *   1. Encapsulates selectors - If a selector changes, you update ONE place.
 *   2. Provides action methods - Tests read like user stories: page.login(user, pass)
 *   3. Reduces duplication - Common interactions are defined once, reused everywhere.
 *
 * How to use:
 *   - Create a new page class that extends BasePage (see login.page.ts for example)
 *   - Define selectors as properties or methods using getByRole(), getByTestId(), etc.
 *   - Define action methods that combine selectors with Playwright interactions
 *   - Use the page object in your tests instead of interacting with selectors directly
 *
 * Example:
 *   class DashboardPage extends BasePage {
 *     readonly heading = this.page.getByRole('heading', { name: 'Dashboard' });
 *
 *     async isLoaded(): Promise<boolean> {
 *       await this.heading.waitFor({ state: 'visible' });
 *       return true;
 *     }
 *   }
 *
 * @see https://playwright.dev/docs/pom
 */
export class BasePage {
  /**
   * The Playwright Page instance.
   *
   * This is the core Playwright object that provides all browser interaction
   * methods. It is passed in via the constructor and stored as a readonly
   * property so subclasses can use it directly.
   */
  readonly page: Page;

  /**
   * Creates a new BasePage instance.
   *
   * @param page - The Playwright Page object, typically provided by the test fixture.
   *
   * @example
   *   test('example', async ({ page }) => {
   *     const basePage = new BasePage(page);
   *     await basePage.goto('/dashboard');
   *   });
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path relative to the configured baseURL.
   *
   * @param path - The URL path to navigate to (e.g., '/login', '/dashboard')
   *
   * @example
   *   await basePage.goto('/login');
   *   // Navigates to: https://example.com/login (if baseURL is https://example.com)
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Get the current page title.
   *
   * @returns The document title as a string
   *
   * @example
   *   const title = await basePage.getTitle();
   *   expect(title).toContain('Dashboard');
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Wait for the page to reach a fully loaded state.
   *
   * This method waits for the 'domcontentloaded' event, which fires when the
   * HTML document has been completely parsed. This is generally faster and more
   * reliable than waiting for 'load' (which waits for all resources like images).
   *
   * IMPORTANT: Avoid using page.waitForTimeout() (arbitrary sleeps). Instead:
   *   - Use waitForLoadState() for page navigation
   *   - Use locator.waitFor() for specific elements
   *   - Use expect(locator).toBeVisible() for assertions that auto-wait
   *
   * @example
   *   await basePage.waitForPageLoad();
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Find an element by its data-testid attribute.
   *
   * data-testid attributes are added by developers specifically for testing.
   * They are stable (not affected by CSS refactors) and clearly communicate
   * intent. Use this when role-based or label-based selectors are not available.
   *
   * @param testId - The value of the data-testid attribute
   * @returns A Playwright Locator for the matching element
   *
   * @example
   *   // HTML: <button data-testid="submit-btn">Submit</button>
   *   const button = basePage.getByTestId('submit-btn');
   *   await button.click();
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Find an element by its ARIA role.
   *
   * Role-based selectors are the PREFERRED selector strategy because they
   * match how assistive technologies (screen readers) identify elements.
   * This makes your tests both resilient and accessibility-aware.
   *
   * Common roles: 'button', 'link', 'heading', 'textbox', 'checkbox',
   * 'navigation', 'dialog', 'alert', 'img', 'list', 'listitem'
   *
   * @param role - The ARIA role to search for
   * @param options - Optional filters (name, exact, etc.)
   * @returns A Playwright Locator for the matching element(s)
   *
   * @example
   *   // Find a button with the accessible name "Submit"
   *   const submitBtn = basePage.getByRole('button', { name: 'Submit' });
   *
   *   // Find a heading with specific text
   *   const heading = basePage.getByRole('heading', { name: 'Welcome' });
   *
   *   // Find a link by its text
   *   const link = basePage.getByRole('link', { name: 'Learn more' });
   */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get the current page URL.
   *
   * @returns The full URL of the current page
   *
   * @example
   *   const url = basePage.getCurrentUrl();
   *   expect(url).toContain('/dashboard');
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot of the current page state.
   *
   * Useful for visual debugging. Screenshots are also automatically captured
   * on test failure (configured in playwright.config.ts).
   *
   * @param name - A descriptive name for the screenshot file
   *
   * @example
   *   await basePage.takeScreenshot('after-login');
   *   // Saves to: test-results/after-login.png
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
