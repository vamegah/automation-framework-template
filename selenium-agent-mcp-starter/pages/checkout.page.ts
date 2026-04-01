import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  private title = By.css('.title');
  private firstNameInput = By.id('first-name');
  private lastNameInput = By.id('last-name');
  private postalCodeInput = By.id('postal-code');
  private continueButton = By.id('continue');
  private finishButton = By.id('finish');
  private cancelButton = By.id('cancel');
  private errorMessage = By.css('[data-test="error"]');
  private completeHeader = By.css('.complete-header');
  private summaryTotal = By.css('.summary_total_label');

  async getTitleText(): Promise<string> {
    return this.getText(this.title);
  }

  async continueWithCustomer(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.type(this.firstNameInput, firstName);
    await this.type(this.lastNameInput, lastName);
    await this.type(this.postalCodeInput, postalCode);
    await this.click(this.continueButton);
    await this.waitForUrlContains('checkout-step-two.html', 10000);
  }

  async continueEmpty(): Promise<void> {
    await this.jsClick(this.continueButton);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async finishCheckout(): Promise<void> {
    await this.jsClick(this.finishButton);
    await this.waitForUrlContains('checkout-complete.html');
  }

  async cancelCheckout(): Promise<void> {
    await this.jsClick(this.cancelButton);
    await this.waitForUrlContains('cart.html');
  }

  async getSummaryTotalText(): Promise<string> {
    return this.getText(this.summaryTotal);
  }

  async getCompleteHeaderText(): Promise<string> {
    return this.getText(this.completeHeader);
  }
}
