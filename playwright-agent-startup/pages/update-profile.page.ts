import { Locator, expect } from '@playwright/test';
import { ParaBankPage } from './parabank.page';

export interface ProfileUpdateData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

export class UpdateProfilePage extends ParaBankPage {
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

  get updateProfileButton(): Locator {
    return this.page.getByRole('button', { name: 'Update Profile' });
  }

  get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Profile Updated' });
  }

  async navigate(): Promise<void> {
    await this.goto('updateprofile.htm');
  }

  async updateProfile(data: ProfileUpdateData): Promise<void> {
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.updateProfileButton.click();
    await expect(this.successHeading).toBeVisible();
  }
}
