import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import type { ParaBankRegistrationData } from '../utils';

export class RegisterPage extends BasePage {
  get firstNameInput(): Locator {
    return this.page.locator('input[name="customer.firstName"]');
  }

  get lastNameInput(): Locator {
    return this.page.locator('input[name="customer.lastName"]');
  }

  get streetInput(): Locator {
    return this.page.locator('input[name="customer.address.street"]');
  }

  get cityInput(): Locator {
    return this.page.locator('input[name="customer.address.city"]');
  }

  get stateInput(): Locator {
    return this.page.locator('input[name="customer.address.state"]');
  }

  get zipCodeInput(): Locator {
    return this.page.locator('input[name="customer.address.zipCode"]');
  }

  get phoneNumberInput(): Locator {
    return this.page.locator('input[name="customer.phoneNumber"]');
  }

  get ssnInput(): Locator {
    return this.page.locator('input[name="customer.ssn"]');
  }

  get usernameInput(): Locator {
    return this.page.locator('input[name="customer.username"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[name="customer.password"]');
  }

  get repeatedPasswordInput(): Locator {
    return this.page.locator('input[name="repeatedPassword"]');
  }

  get registerButton(): Locator {
    return this.page.locator('input[value="Register"]');
  }

  get duplicateUsernameError(): Locator {
    return this.page.getByText('This username already exists.');
  }

  get firstNameError(): Locator {
    return this.page.locator('#customer\\.firstName\\.errors');
  }

  get lastNameError(): Locator {
    return this.page.locator('#customer\\.lastName\\.errors');
  }

  get streetError(): Locator {
    return this.page.locator('#customer\\.address\\.street\\.errors');
  }

  get cityError(): Locator {
    return this.page.locator('#customer\\.address\\.city\\.errors');
  }

  get stateError(): Locator {
    return this.page.locator('#customer\\.address\\.state\\.errors');
  }

  get zipCodeError(): Locator {
    return this.page.locator('#customer\\.address\\.zipCode\\.errors');
  }

  get ssnError(): Locator {
    return this.page.locator('#customer\\.ssn\\.errors');
  }

  get usernameError(): Locator {
    return this.page.locator('#customer\\.username\\.errors');
  }

  get passwordError(): Locator {
    return this.page.locator('#customer\\.password\\.errors');
  }

  get repeatedPasswordError(): Locator {
    return this.page.locator('#repeatedPassword\\.errors');
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Welcome' }).or(this.page.locator('#rightPanel h1.title'));
  }

  async navigate(): Promise<void> {
    await this.goto('register.htm');
  }

  async register(data: ParaBankRegistrationData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.ssnInput.fill(data.ssn);
    await this.usernameInput.fill(data.username);
    await this.passwordInput.fill(data.password);
    await this.repeatedPasswordInput.fill(data.password);
    await this.registerButton.click();
    await this.waitForPageLoad();
  }

  async submitEmpty(): Promise<void> {
    await this.registerButton.click();
  }

  async expectRegistrationSuccess(username: string): Promise<void> {
    await expect(this.page).toHaveURL(/register\.htm/i);
    await expect(this.page.getByText('Your account was created successfully.')).toBeVisible();
    await expect(this.page.getByText(new RegExp(username, 'i'))).toBeVisible();
  }

  async hasDuplicateUsernameError(): Promise<boolean> {
    return this.duplicateUsernameError.isVisible().catch(() => false);
  }

  async expectRequiredFieldErrors(): Promise<void> {
    await expect(this.firstNameError).toHaveText('First name is required.');
    await expect(this.lastNameError).toHaveText('Last name is required.');
    await expect(this.streetError).toHaveText('Address is required.');
    await expect(this.cityError).toHaveText('City is required.');
    await expect(this.stateError).toHaveText('State is required.');
    await expect(this.zipCodeError).toHaveText('Zip Code is required.');
    await expect(this.ssnError).toHaveText('Social Security Number is required.');
    await expect(this.usernameError).toHaveText('Username is required.');
    await expect(this.passwordError).toHaveText('Password is required.');
    await expect(this.repeatedPasswordError).toHaveText('Password confirmation is required.');
  }
}
