import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LoginPage - Example Page Object for a Login Form
 *
 * THIS IS AN EXAMPLE. You will need to adapt the selectors and methods
 * to match your actual application's login page structure.
 *
 * This page object demonstrates:
 *   1. How to extend BasePage to create page-specific classes
 *   2. How to use accessible selectors (getByRole, getByLabel, getByTestId)
 *   3. How to encapsulate page interactions into reusable methods
 *   4. How to compose small methods into higher-level actions (e.g., login())
 *
 * Selector Priority (use in this order):
 *   1. getByRole()   - Best: matches ARIA roles (button, textbox, link, etc.)
 *   2. getByLabel()  - Great for form inputs with visible labels
 *   3. getByText()   - Good for finding elements by visible text
 *   4. getByTestId() - Fallback: uses data-testid attributes
 *   5. locator()     - Last resort: CSS/XPath selectors (avoid if possible)
 *
 * @example
 *   test('user can log in', async ({ page }) => {
 *     const loginPage = new LoginPage(page);
 *     await loginPage.navigateToLogin();
 *     await loginPage.login('testuser', 'testpassword');
 *     // Assert redirect to dashboard, etc.
 *   });
 */
export class LoginPage extends BasePage {

  // ---------------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------------
  // Define locators as readonly properties so they are computed lazily
  // and always use the latest page state.

  /**
   * Username input field.
   *
   * Uses getByRole('textbox') with a name filter. This matches an <input>
   * element that has an accessible name of "Username" (via <label>, aria-label,
   * or placeholder).
   *
   * ADAPT THIS: Change 'Username' to match your app's actual label text,
   * or switch to getByLabel('Email') if your app uses email-based login.
   */
  get usernameInput(): Locator {
    return this.page.locator('input[name="username"]');
  }

  /**
   * Password input field.
   *
   * Note: Password inputs do not have an implicit ARIA role, so we use
   * getByLabel() which finds the input associated with a <label> element.
   *
   * ADAPT THIS: Change 'Password' to match your app's actual label text.
   */
  get passwordInput(): Locator {
    return this.page.locator('input[name="password"]');
  }

  /**
   * Submit/Login button.
   *
   * Uses getByRole('button') which is the most accessible and resilient
   * selector for buttons. The name filter matches the button's accessible name.
   *
   * ADAPT THIS: Change 'Sign in' to match your button's text
   * (e.g., 'Log in', 'Submit', 'Continue').
   */
  get submitButton(): Locator {
    return this.page.locator('input[value="Log In"]');
  }

  /**
   * Error message container.
   *
   * Uses getByRole('alert') which matches elements with role="alert" or
   * <div role="alert">. This is the standard way to display form errors
   * accessibly.
   *
   * ADAPT THIS: If your app uses a different pattern for error messages,
   * you might need getByTestId('error-message') or getByText('Invalid').
   */
  get errorMessage(): Locator {
    return this.page.locator('.error');
  }

  /**
   * Alternative: Using data-testid selectors.
   *
   * If your app does not have proper ARIA roles or labels, you can ask
   * developers to add data-testid attributes. These are stable and
   * explicitly intended for testing.
   *
   * Example HTML: <form data-testid="login-form">...</form>
   */
  get loginForm(): Locator {
    return this.page.locator('#loginPanel');
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the login page.
   *
   * ADAPT THIS: Change '/login' to your app's actual login page path.
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto(process.env.BASE_URL || 'https://parabank.parasoft.com/parabank/index.htm');
    await this.waitForPageLoad();
  }

  /**
   * Fill in the username field.
   *
   * Uses Playwright's fill() method which clears the field first, then types
   * the value. This is more reliable than type() for pre-filled fields.
   *
   * @param username - The username to enter
   */
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /**
   * Fill in the password field.
   *
   * @param password - The password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the submit/login button.
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform a complete login action.
   *
   * This is a high-level method that composes the individual steps
   * (fill username, fill password, click submit) into a single action.
   * Tests that need to log in can call this one method instead of
   * repeating three separate steps.
   *
   * @param username - The username to log in with
   * @param password - The password to log in with
   *
   * @example
   *   const loginPage = new LoginPage(page);
   *   await loginPage.navigateToLogin();
   *   await loginPage.login('admin', 'secret123');
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSubmit();

    // Wait for navigation after form submission.
    // This ensures the login action is fully complete before the test continues.
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the error message text displayed on the login page.
   *
   * @returns The text content of the error message, or null if no error is displayed
   *
   * @example
   *   await loginPage.login('wrong', 'credentials');
   *   const error = await loginPage.getErrorMessage();
   *   expect(error).toContain('Invalid username or password');
   */
  async getErrorMessage(): Promise<string | null> {
    // Wait briefly for the error to appear (auto-waits up to the configured timeout)
    const isVisible = await this.errorMessage.isVisible().catch(() => false);

    if (isVisible) {
      return this.errorMessage.textContent();
    }

    return null;
  }

  /**
   * Check if the login form is visible on the page.
   *
   * Useful for verifying that unauthenticated users are redirected
   * to the login page.
   *
   * @returns true if the username input is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return this.usernameInput.isVisible().catch(() => false);
  }

  get registerLink(): Locator {
    return this.page.getByRole('link', { name: 'Register' });
  }
}
