import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ParaBankPage extends BasePage {
  get accountServicesHeading(): Locator {
    return this.page.locator('#leftPanel').getByRole('heading', { name: 'Account Services' });
  }

  get openNewAccountLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Open New Account', exact: true });
  }

  get accountsOverviewLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Accounts Overview', exact: true });
  }

  get transferFundsLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Transfer Funds', exact: true });
  }

  get billPayLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Bill Pay', exact: true });
  }

  get findTransactionsLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Find Transactions', exact: true });
  }

  get updateContactInfoLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Update Contact Info', exact: true });
  }

  get requestLoanLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Request Loan', exact: true });
  }

  get logoutLink(): Locator {
    return this.page.locator('#leftPanel').getByRole('link', { name: 'Log Out', exact: true });
  }

  get errorHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Error!' });
  }

  async expectAuthenticatedShell(): Promise<void> {
    await expect(this.accountServicesHeading).toBeVisible();
    await expect(this.openNewAccountLink).toBeVisible();
    await expect(this.accountsOverviewLink).toBeVisible();
  }

  async navigateToAuthenticatedHome(): Promise<void> {
    await this.goto('index.htm');
    await this.expectAuthenticatedShell();
  }
}
