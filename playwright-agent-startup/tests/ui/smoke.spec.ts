import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../fixtures/base.fixture';
import { LoginPage } from '../../pages/login.page';

test.describe('ParaBank Public Smoke Tests @ui', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser, baseURL }) => {
    context = await browser.newContext({ baseURL, storageState: undefined });
    page = await context.newPage();
    await page.goto(baseURL ?? 'https://parabank.parasoft.com/parabank/index.htm');
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('home page loads successfully', async () => {
    await expect(page).toHaveTitle(/ParaBank/i);
    await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
  });

  test('page returns valid HTTP status', async () => {
    const response = await page.goto(page.url());
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('customer login panel is present', async () => {
    const loginPage = new LoginPage(page);

    await expect(loginPage.loginForm).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('forgot login info is reachable from the login panel', async () => {
    const loginPage = new LoginPage(page);

    await page.getByRole('link', { name: 'Forgot login info?' }).click();
    await expect(page).toHaveURL(/lookup\.htm/i);
    await expect(page.getByRole('heading', { name: /Customer Lookup/i })).toBeVisible();
  });

  test('register link navigates to the registration page', async () => {
    const loginPage = new LoginPage(page);

    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/register/i);
    await expect(page.getByRole('heading', { name: 'Signing up is easy!' })).toBeVisible();
  });

  test('contact page is reachable from the main navigation', async () => {
    await page.getByRole('link', { name: 'Contact Us' }).click();
    await expect(page).toHaveURL(/contact/i);
    await expect(page.getByRole('heading', { name: 'Customer Care' })).toBeVisible();
  });
});
