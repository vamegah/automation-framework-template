import { DashboardPage, LoginPage } from '../support/pages';

describe('Login Page', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    loginPage.visit();
  });

  it('logs in to OrangeHRM with the demo account', () => {
    loginPage.login(validUser.username, validUser.password);
    cy.url().should('include', '/dashboard');
    dashboardPage.getTopbarHeader().should('contain', 'Dashboard');
  });
});
