import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private usernameInput = By.id('user-name');
  private passwordInput = By.id('password');
  private loginButton = By.id('login-button');
  private inventoryTitle = By.css('.title');
  private errorMessage = By.css('[data-test="error"]');

  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getInventoryTitle(): Promise<string> {
    return this.getText(this.inventoryTitle);
  }

  async submitEmpty(): Promise<void> {
    await this.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}
