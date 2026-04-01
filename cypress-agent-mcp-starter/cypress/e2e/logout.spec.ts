import { DashboardPage, LoginPage } from '../support/pages';

describe('OrangeHRM Session Management', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes("Cannot read properties of undefined (reading 'response')")) {
        return false;
      }
    });
  });

  it('logs out from the user menu and returns to the login page', () => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    cy.url().should('include', '/dashboard');

    dashboardPage.logout();

    cy.url().should('include', '/auth/login');
    loginPage.getPageHeader().should('contain', 'Login');
  });
});
