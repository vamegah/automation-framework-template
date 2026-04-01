import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { TestData } from '../utils';

const AUTH_STATE_PATH = '.auth/state.json';

async function waitForInteractivePage(page: Parameters<typeof setup>[1] extends never ? never : any): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForLoadState('domcontentloaded');
    const challengeVisible = await page.getByText('Performing security verification').isVisible().catch(() => false);

    if (!challengeVisible) {
      return;
    }

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  }
}

setup('authenticate', async ({ page }) => {
  const fullPath = path.resolve(AUTH_STATE_PATH);

  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { force: true });
  }

  // eslint-disable-next-line no-console
  console.log('[auth] Creating a fresh authenticated session...');

  const username = process.env.PARABANK_USERNAME;
  const password = process.env.PARABANK_PASSWORD;
  const baseUrl = process.env.BASE_URL || 'https://parabank.parasoft.com/parabank/index.htm';

  if (username && password) {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
    await waitForInteractivePage(page);
    await loginPage.login(username, password);
  } else {
    const registerPage = new RegisterPage(page);
    let registered = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const user = TestData.paraBankUser();

      await registerPage.navigate();
      await waitForInteractivePage(page);

      try {
        await registerPage.register(user);
        await waitForInteractivePage(page);
      } catch {
        continue;
      }

      if (await registerPage.hasDuplicateUsernameError()) {
        continue;
      }

      try {
        await registerPage.expectRegistrationSuccess(user.username);
      } catch {
        continue;
      }
      registered = true;
      break;
    }

    if (!registered) {
      throw new Error('Unable to create a unique ParaBank user after 5 attempts.');
    }
  }

  await page.goto(baseUrl);
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
