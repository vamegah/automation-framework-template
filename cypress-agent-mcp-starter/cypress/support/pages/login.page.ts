import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected urlPath = '/web/index.php/auth/login';

  private usernameInput = 'input[name="username"]';
  private passwordInput = 'input[name="password"]';
  private loginButton = 'button[type="submit"]';
  private errorMessage = '.oxd-alert-content-text';
  private requiredFieldMessage = '.oxd-input-field-error-message';
  private forgotPasswordLink = '.orangehrm-login-forgot-header';
  private resetPasswordHeader = 'h6.orangehrm-forgot-password-title';
  private resetPasswordButton = 'button[type="submit"]';
  private resetPasswordSuccessMessage = '.orangehrm-forgot-password-title + p';
  private pageHeader = 'h5.orangehrm-login-title';

  login(username: string, password: string) {
    this.type(this.usernameInput, username);
    this.type(this.passwordInput, password);
    this.click(this.loginButton);
  }

  submit() {
    this.click(this.loginButton);
  }

  enterUsername(username: string) {
    this.type(this.usernameInput, username);
  }

  enterPassword(password: string) {
    this.type(this.passwordInput, password);
  }

  getErrorMessage() {
    return this.getText(this.errorMessage);
  }

  getRequiredFieldMessages() {
    return cy.get(this.requiredFieldMessage);
  }

  getPageHeader() {
    return cy.get(this.pageHeader);
  }

  clickForgotPassword() {
    this.click(this.forgotPasswordLink);
  }

  getResetPasswordHeader() {
    return cy.get(this.resetPasswordHeader);
  }

  requestPasswordReset(username: string) {
    this.enterUsername(username);
    this.click(this.resetPasswordButton);
  }

  getResetPasswordSuccessMessage() {
    return cy.get(this.resetPasswordSuccessMessage);
  }
}
