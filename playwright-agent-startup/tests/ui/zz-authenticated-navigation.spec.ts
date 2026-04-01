import { test, expect } from '../fixtures/base.fixture';
import { ParaBankPage } from '../../pages/parabank.page';
import { LoginPage } from '../../pages/login.page';

test.describe('ParaBank Authenticated Navigation Coverage @ui @unstable', () => {
  test('logout resets the session and blocks direct access to protected pages', async ({ page }) => {
    const paraBankPage = new ParaBankPage(page);
    const loginPage = new LoginPage(page);

    await page.goto('overview.htm');
    await paraBankPage.expectAuthenticatedShell();

    await paraBankPage.logoutLink.click();
    await page.waitForLoadState('domcontentloaded');

    await expect(loginPage.loginForm).toBeVisible();
    await expect(paraBankPage.accountServicesHeading).toHaveCount(0);

    await page.goto('overview.htm');
    await page.waitForLoadState('domcontentloaded');

    await expect(loginPage.loginForm).toBeVisible();
    await expect(paraBankPage.accountServicesHeading).toHaveCount(0);
  });
});
