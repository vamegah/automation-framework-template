import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export class RequestLoanPage extends ParaBankPage {
  get amountInput(): Locator {
    return this.page.locator('#amount');
  }

  get downPaymentInput(): Locator {
    return this.page.locator('#downPayment');
  }

  get fromAccountSelect(): Locator {
    return this.page.locator('#fromAccountId');
  }

  get applyNowButton(): Locator {
    return this.page.getByRole('button', { name: 'Apply Now' });
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Loan Request Processed' });
  }

  get loanStatus(): Locator {
    return this.page.locator('#loanStatus');
  }

  get denialMessage(): Locator {
    return this.page.locator('#loanRequestDenied p.error');
  }

  get approvalMessage(): Locator {
    return this.page.getByText(/Congratulations, your loan has been approved/i);
  }

  async navigate(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.requestLoanLink.click();
    await this.waitForPageLoad();
  }

  async requestLoan(amount: string, downPayment: string, fromAccountId?: string): Promise<void> {
    await this.amountInput.fill(amount);
    await this.downPaymentInput.fill(downPayment);

    if (fromAccountId) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }

    await this.applyNowButton.click();
    await expect(this.successHeading).toBeVisible();
    await expect(this.approvalMessage).toBeVisible();
  }

  async requestLoanAndExpectDenial(amount: string, downPayment: string, expectedMessage: RegExp, fromAccountId?: string): Promise<void> {
    await this.amountInput.fill(amount);
    await this.downPaymentInput.fill(downPayment);

    if (fromAccountId) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }

    await this.applyNowButton.click();
    await expect(this.successHeading).toBeVisible();
    await expect(this.loanStatus).toHaveText('Denied');
    await expect(this.denialMessage).toContainText(expectedMessage);
  }
}
