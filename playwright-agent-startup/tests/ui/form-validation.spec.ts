import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../fixtures/base.fixture';
import { LookupPage } from '../../pages/lookup.page';
import { RegisterPage } from '../../pages/register.page';
import { TestData } from '../../utils';

test.describe('ParaBank Form Validation Coverage @ui', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser, baseURL }) => {
    context = await browser.newContext({ baseURL, storageState: undefined });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('customer lookup shows required-field validation when submitted empty', async () => {
    const lookupPage = new LookupPage(page);

    await lookupPage.navigate();
    await lookupPage.submitEmpty();
    await lookupPage.expectRequiredFieldErrors();
  });

  test('registration shows required-field validation when submitted empty', async () => {
    const registerPage = new RegisterPage(page);

    await registerPage.navigate();
    await registerPage.submitEmpty();
    await registerPage.expectRequiredFieldErrors();
  });

  test('customer lookup can recover login info for a newly registered user', async () => {
    const registerPage = new RegisterPage(page);
    const lookupPage = new LookupPage(page);
    let user = TestData.paraBankUser();
    let registered = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      user = TestData.paraBankUser();
      await registerPage.navigate();

      try {
        await registerPage.register(user);
      } catch {
        continue;
      }

      if (await registerPage.hasDuplicateUsernameError()) {
        continue;
      }

      try {
        await registerPage.expectRegistrationSuccess(user.username);
        registered = true;
        break;
      } catch {
        continue;
      }
    }

    expect(registered).toBeTruthy();

    await lookupPage.navigate();
    await lookupPage.recoverLoginInfo({
      firstName: user.firstName,
      lastName: user.lastName,
      street: user.street,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      ssn: user.ssn,
    });

    await expect(lookupPage.successMessage).toBeVisible();
    await expect(page.getByText(new RegExp(user.username, 'i'))).toBeVisible();
  });

  test('registration blocks duplicate usernames', async () => {
    const registerPage = new RegisterPage(page);
    let user = TestData.paraBankUser();
    let registered = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      user = TestData.paraBankUser();
      await registerPage.navigate();
      await registerPage.register(user);

      if (await registerPage.hasDuplicateUsernameError()) {
        continue;
      }

      await registerPage.expectRegistrationSuccess(user.username);
      registered = true;
      break;
    }

    expect(registered).toBeTruthy();

    await registerPage.navigate();
    await registerPage.register(user);
    await expect(registerPage.duplicateUsernameError).toBeVisible();
  });
});
