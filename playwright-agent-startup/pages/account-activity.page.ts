import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export class AccountActivityPage extends ParaBankPage {
  get accountDetailsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Details' });
  }

  get accountActivityHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Activity' });
  }

  get accountIdValue(): Locator {
    return this.page.locator('#accountId');
  }

  get accountTypeValue(): Locator {
    return this.page.locator('#accountType');
  }

  get balanceValue(): Locator {
    return this.page.locator('#balance');
  }

  get availableBalanceValue(): Locator {
    return this.page.locator('#availableBalance');
  }

  get monthSelect(): Locator {
    return this.page.locator('#month');
  }

  get transactionTypeSelect(): Locator {
    return this.page.locator('#transactionType');
  }

  get goButton(): Locator {
    return this.page.getByRole('button', { name: 'Go' });
  }

  get noTransactionsMessage(): Locator {
    return this.page.locator('#noTransactions');
  }

  get transactionTable(): Locator {
    return this.page.locator('#transactionTable');
  }

  get transactionRows(): Locator {
    return this.page.locator('#transactionTable tbody tr');
  }

  get firstTransactionLink(): Locator {
    return this.page.locator('#transactionTable tbody tr a').first();
  }

  async navigateToFirstAccount(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.accountsOverviewLink.click();
    await this.waitForPageLoad();
    await expect(this.page.locator('#accountTable a').first()).toBeVisible();
    await this.page.locator('#accountTable a').first().click();
    await this.waitForPageLoad();
  }

  async navigateToAccount(accountId: string): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.accountsOverviewLink.click();
    await this.waitForPageLoad();
    await this.page.getByRole('link', { name: accountId, exact: true }).click();
    await this.waitForPageLoad();
  }

  async expectDetailsLoaded(): Promise<void> {
    await expect(this.accountDetailsHeading).toBeVisible();
    await expect(this.accountActivityHeading).toBeVisible();
    await expect(this.accountIdValue).toHaveText(/\d+/);
    await expect(this.accountTypeValue).toHaveText(/CHECKING|SAVINGS/i);
    await expect(this.balanceValue).toHaveText(/\$/);
    await expect(this.availableBalanceValue).toHaveText(/\$/);
  }

  async filter(period: string, type: string): Promise<void> {
    await this.monthSelect.selectOption({ label: period });
    await this.transactionTypeSelect.selectOption({ label: type });
    await this.goButton.click();
    await expect(this.accountActivityHeading).toBeVisible();
  }

  async openFirstTransactionDetail(): Promise<void> {
    await expect(this.transactionRows.first()).toBeVisible();
    await this.firstTransactionLink.click();
    await this.waitForPageLoad();
  }
}
