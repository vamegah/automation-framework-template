import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export class FindTransactionsPage extends ParaBankPage {
  get transactionIdInput(): Locator {
    return this.page.locator('#transactionId');
  }

  get transactionDateInput(): Locator {
    return this.page.locator('#transactionDate');
  }

  get fromDateInput(): Locator {
    return this.page.locator('#fromDate');
  }

  get toDateInput(): Locator {
    return this.page.locator('#toDate');
  }

  get accountSelect(): Locator {
    return this.page.locator('#accountId');
  }

  get amountInput(): Locator {
    return this.page.locator('#amount');
  }

  get findByAmountButton(): Locator {
    return this.page.locator('#findByAmount');
  }

  get findByIdButton(): Locator {
    return this.page.locator('#findById');
  }

  get findByDateButton(): Locator {
    return this.page.locator('#findByDate');
  }

  get findByDateRangeButton(): Locator {
    return this.page.locator('#findByDateRange');
  }

  get transactionIdError(): Locator {
    return this.page.locator('#transactionIdError');
  }

  get transactionDateError(): Locator {
    return this.page.locator('#transactionDateError');
  }

  get dateRangeError(): Locator {
    return this.page.locator('#dateRangeError');
  }

  get amountError(): Locator {
    return this.page.locator('#amountError');
  }

  get resultsHeading(): Locator {
    return this.page.getByRole('heading', { name: /Transaction Results/i });
  }

  get resultsTable(): Locator {
    return this.page.locator('#transactionTable');
  }

  get noTransactionsMessage(): Locator {
    return this.page.locator('#noTransactions');
  }

  get resultRows(): Locator {
    return this.page.locator('#transactionTable tbody tr');
  }

  get firstResultLink(): Locator {
    return this.page.locator('#transactionTable tbody tr a').first();
  }

  async navigate(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.findTransactionsLink.click();
    await this.waitForPageLoad();
  }

  async findByAmount(accountId: string, amount: string): Promise<void> {
    await this.accountSelect.selectOption(accountId);
    await this.amountInput.fill(amount);
    await this.findByAmountButton.click();
    await expect(this.resultsHeading).toBeVisible();
  }

  async findByAmountAndExpectNoResults(accountId: string, amount: string): Promise<void> {
    await this.accountSelect.selectOption(accountId);
    await this.amountInput.fill(amount);
    await this.findByAmountButton.click();
    await expect(this.resultsHeading).toBeVisible();
    await expect(this.resultsTable).toBeVisible();
    await expect(this.page.locator('#transactionTable tbody tr')).toHaveCount(0);
  }

  async submitInvalidAmount(value: string): Promise<void> {
    await this.amountInput.fill(value);
    await this.findByAmountButton.click();
  }

  async submitInvalidDate(value: string): Promise<void> {
    await this.transactionDateInput.fill(value);
    await this.findByDateButton.click();
  }

  async submitInvalidDateRange(from: string, to: string): Promise<void> {
    await this.fromDateInput.fill(from);
    await this.toDateInput.fill(to);
    await this.findByDateRangeButton.click();
  }

  async submitInvalidTransactionId(value: string): Promise<void> {
    await this.transactionIdInput.fill(value);
    await this.findByIdButton.click();
  }

  async openFirstResultByAmount(accountId: string, amount: string): Promise<void> {
    await this.findByAmount(accountId, amount);
    await expect(this.resultRows.first()).toBeVisible();
    await this.firstResultLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
