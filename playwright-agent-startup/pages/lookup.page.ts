import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface LookupData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
}

export class LookupPage extends BasePage {
  get firstNameInput(): Locator {
    return this.page.locator('#firstName');
  }

  get lastNameInput(): Locator {
    return this.page.locator('#lastName');
  }

  get streetInput(): Locator {
    return this.page.locator('#address\\.street');
  }

  get cityInput(): Locator {
    return this.page.locator('#address\\.city');
  }

  get stateInput(): Locator {
    return this.page.locator('#address\\.state');
  }

  get zipCodeInput(): Locator {
    return this.page.locator('#address\\.zipCode');
  }

  get ssnInput(): Locator {
    return this.page.locator('#ssn');
  }

  get findLoginInfoButton(): Locator {
    return this.page.locator('input[value="Find My Login Info"]');
  }

  get successMessage(): Locator {
    return this.page.getByText('Your login information was located successfully.');
  }

  get firstNameError(): Locator {
    return this.page.locator('#firstName\\.errors');
  }

  get lastNameError(): Locator {
    return this.page.locator('#lastName\\.errors');
  }

  get streetError(): Locator {
    return this.page.locator('#address\\.street\\.errors');
  }

  get cityError(): Locator {
    return this.page.locator('#address\\.city\\.errors');
  }

  get stateError(): Locator {
    return this.page.locator('#address\\.state\\.errors');
  }

  get zipCodeError(): Locator {
    return this.page.locator('#address\\.zipCode\\.errors');
  }

  get ssnError(): Locator {
    return this.page.locator('#ssn\\.errors');
  }

  async navigate(): Promise<void> {
    await this.goto('lookup.htm');
  }

  async submitEmpty(): Promise<void> {
    await this.findLoginInfoButton.click();
  }

  async recoverLoginInfo(data: LookupData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.ssnInput.fill(data.ssn);
    await this.findLoginInfoButton.click();
  }

  async expectRequiredFieldErrors(): Promise<void> {
    await expect(this.firstNameError).toHaveText('First name is required.');
    await expect(this.lastNameError).toHaveText('Last name is required.');
    await expect(this.streetError).toHaveText('Address is required.');
    await expect(this.cityError).toHaveText('City is required.');
    await expect(this.stateError).toHaveText('State is required.');
    await expect(this.zipCodeError).toHaveText('Zip Code is required.');
    await expect(this.ssnError).toHaveText('Social Security Number is required.');
  }
}
