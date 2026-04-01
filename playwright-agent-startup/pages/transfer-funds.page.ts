import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export class TransferFundsPage extends ParaBankPage {
  get amountInput(): Locator {
    return this.page.locator('#amount');
  }

  get fromAccountSelect(): Locator {
    return this.page.locator('#fromAccountId');
  }

  get toAccountSelect(): Locator {
    return this.page.locator('#toAccountId');
  }

  get transferButton(): Locator {
    return this.page.getByRole('button', { name: 'Transfer' });
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Transfer Complete!' });
  }

  async navigate(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.transferFundsLink.click();
    await this.waitForPageLoad();
  }

  async transfer(amount: string, fromAccountId: string, toAccountId: string): Promise<void> {
    await this.amountInput.fill(amount);
    await this.fromAccountSelect.selectOption(fromAccountId);
    await this.toAccountSelect.selectOption(toAccountId);
    await this.transferButton.click();
    await expect(this.successHeading).toBeVisible();
    await expect(this.page.locator('#amountResult')).toHaveText(`$${amount}.00`);
  }
}
