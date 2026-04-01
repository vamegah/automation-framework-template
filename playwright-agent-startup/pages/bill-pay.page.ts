import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';
import type { BillPayData } from '../utils';

export class BillPayPage extends ParaBankPage {
  get payeeNameInput(): Locator {
    return this.page.locator('input[name="payee.name"]');
  }

  get streetInput(): Locator {
    return this.page.locator('input[name="payee.address.street"]');
  }

  get cityInput(): Locator {
    return this.page.locator('input[name="payee.address.city"]');
  }

  get stateInput(): Locator {
    return this.page.locator('input[name="payee.address.state"]');
  }

  get zipCodeInput(): Locator {
    return this.page.locator('input[name="payee.address.zipCode"]');
  }

  get phoneNumberInput(): Locator {
    return this.page.locator('input[name="payee.phoneNumber"]');
  }

  get accountNumberInput(): Locator {
    return this.page.locator('input[name="payee.accountNumber"]');
  }

  get verifyAccountInput(): Locator {
    return this.page.locator('input[name="verifyAccount"]');
  }

  get amountInput(): Locator {
    return this.page.locator('input[name="amount"]');
  }

  get fromAccountSelect(): Locator {
    return this.page.locator('select[name="fromAccountId"]');
  }

  get sendPaymentButton(): Locator {
    return this.page.getByRole('button', { name: 'Send Payment' });
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Bill Payment Complete' });
  }

  get errorHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Error!' });
  }

  get internalErrorMessage(): Locator {
    return this.page.getByText('An internal error has occurred and has been logged.');
  }

  get payeeNameError(): Locator {
    return this.page.locator('#validationModel-name');
  }

  get addressError(): Locator {
    return this.page.locator('#validationModel-address');
  }

  get cityError(): Locator {
    return this.page.locator('#validationModel-city');
  }

  get stateError(): Locator {
    return this.page.locator('#validationModel-state');
  }

  get zipCodeError(): Locator {
    return this.page.locator('#validationModel-zipCode');
  }

  get phoneNumberError(): Locator {
    return this.page.locator('#validationModel-phoneNumber');
  }

  get accountEmptyError(): Locator {
    return this.page.locator('#validationModel-account-empty');
  }

  get verifyAccountMismatchError(): Locator {
    return this.page.locator('#validationModel-verifyAccount-mismatch');
  }

  get amountEmptyError(): Locator {
    return this.page.locator('#validationModel-amount-empty');
  }

  async navigate(): Promise<void> {
    await this.navigateToAuthenticatedHome();
    await this.billPayLink.click();
    await this.waitForPageLoad();
  }

  async submitPayment(data: BillPayData, fromAccountId?: string): Promise<void> {
    await this.payeeNameInput.fill(data.payeeName);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.accountNumberInput.fill(data.accountNumber);
    await this.verifyAccountInput.fill(data.accountNumber);
    await this.amountInput.fill(data.amount);

    if (fromAccountId) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }

    await this.sendPaymentButton.click();
    await expect(this.successHeading).toBeVisible();
    await expect(this.page.locator('#payeeName')).toHaveText(data.payeeName);
  }

  async submitEmpty(): Promise<void> {
    await this.sendPaymentButton.click();
  }

  async submitWithMismatchedAccounts(data: BillPayData): Promise<void> {
    await this.payeeNameInput.fill(data.payeeName);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.accountNumberInput.fill(data.accountNumber);
    await this.verifyAccountInput.fill(`${Number(data.accountNumber) + 1}`);
    await this.amountInput.fill(data.amount);
    await this.sendPaymentButton.click();
  }

  async submitWithInvalidFromAccount(data: BillPayData, invalidFromAccountId = '999999'): Promise<void> {
    await this.payeeNameInput.fill(data.payeeName);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.accountNumberInput.fill(data.accountNumber);
    await this.verifyAccountInput.fill(data.accountNumber);
    await this.amountInput.fill(data.amount);
    await this.page.evaluate((value) => {
      const browserDocument = (globalThis as { document?: any }).document;
      const select = browserDocument?.querySelector('select[name="fromAccountId"]');

      if (!select) {
        return;
      }

      if (![...select.options].some((option) => option.value === value)) {
        const option = browserDocument.createElement('option');
        option.value = value;
        option.text = value;
        select.appendChild(option);
      }

      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }, invalidFromAccountId);
    await this.sendPaymentButton.click();
  }
}
