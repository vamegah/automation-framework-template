import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export class AccountsPage extends ParaBankPage {
  get pageTitle(): Locator {
    return this.page.getByRole('heading', { name: /Accounts Overview/i });
  }

  get accountsTable(): Locator {
    return this.page.locator('#accountTable');
  }

  get openAccountTypeSelect(): Locator {
    return this.page.locator('#type');
  }

  get fromAccountSelect(): Locator {
    return this.page.locator('#fromAccountId');
  }

  get openNewAccountButton(): Locator {
    return this.page.getByRole('button', { name: 'Open New Account' });
  }

  get openAccountSuccessHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Opened!' });
  }

  get newAccountIdLink(): Locator {
    return this.page.locator('#newAccountId');
  }

  async navigateToOverview(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.accountsOverviewLink.click();
    await this.waitForPageLoad();
  }

  async navigateToOpenNewAccount(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.openNewAccountLink.click();
    await this.waitForPageLoad();
  }

  async getAccountIds(): Promise<string[]> {
    return this.page.locator('#accountTable a').evaluateAll((links) =>
      links
        .map((link) => link.textContent?.trim() ?? '')
        .filter((value) => /^\d+$/.test(value)),
    );
  }

  async ensureMultipleAccounts(): Promise<string[]> {
    await this.navigateToOverview();
    let accountIds = await this.getAccountIds();

    if (accountIds.length >= 2) {
      return accountIds;
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.navigateToOpenNewAccount();
      await this.openNewAccountButton.click();
      await this.navigateToOverview();

      try {
        await expect.poll(async () => (await this.getAccountIds()).length, { timeout: 15000 }).toBeGreaterThanOrEqual(2);
      } catch {
        // Retry once more before failing the test.
      }

      accountIds = await this.getAccountIds();

      if (accountIds.length >= 2) {
        return accountIds;
      }
    }

    expect(accountIds.length).toBeGreaterThanOrEqual(2);
    return accountIds;
  }

  async openNewAccount(accountType: '0' | '1' = '1'): Promise<string> {
    await this.navigateToOverview();
    const initialAccountIds = await this.getAccountIds();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.navigateToOpenNewAccount();
      await this.openAccountTypeSelect.selectOption(accountType);
      await this.openNewAccountButton.click();
      await this.navigateToOverview();

      try {
        await expect.poll(async () => (await this.getAccountIds()).length, { timeout: 15000 }).toBeGreaterThan(initialAccountIds.length);
      } catch {
        // Retry once more before failing the test.
      }

      const updatedAccountIds = await this.getAccountIds();
      const newAccountId = updatedAccountIds.find((accountId) => !initialAccountIds.includes(accountId))
        ?? updatedAccountIds[updatedAccountIds.length - 1];

      if (updatedAccountIds.length > initialAccountIds.length) {
        expect(newAccountId).toMatch(/^\d+$/);
        return newAccountId;
      }
    }

    throw new Error('Unable to create a new ParaBank account after 2 attempts.');
  }
}
