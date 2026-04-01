import { LoginPage } from '../support/pages';

describe('OrangeHRM Authentication Validation', () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    loginPage.visit();
  });

  it('shows required field validation when the form is empty', () => {
    loginPage.submit();

    loginPage.getRequiredFieldMessages().should('have.length.at.least', 2);
    loginPage.getRequiredFieldMessages().each(($message) => {
      cy.wrap($message).should('contain.text', 'Required');
    });
  });

  it('shows an error for invalid credentials', () => {
    loginPage.login('invalid-user', 'invalid-password');

    loginPage.getErrorMessage().should('contain', 'Invalid credentials');
    cy.url().should('include', '/auth/login');
  });

  it('redirects unauthenticated users away from the dashboard', () => {
    cy.visit('/web/index.php/dashboard/index');

    cy.url().should('include', '/auth/login');
    loginPage.getPageHeader().should('contain', 'Login');
  });

  it('opens the forgot password screen', () => {
    loginPage.clickForgotPassword();

    cy.url().should('include', '/requestPasswordResetCode');
    loginPage.getResetPasswordHeader().should('contain', 'Reset Password');
  });

  it('requires a username before requesting a password reset', () => {
    loginPage.clickForgotPassword();
    loginPage.submit();

    loginPage.getRequiredFieldMessages().should('contain.text', 'Required');
  });
});
