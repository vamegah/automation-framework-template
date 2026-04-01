import { AdminPage, DashboardPage, LoginPage } from '../support/pages';

describe('OrangeHRM Admin Workflows', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const adminPage = new AdminPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    dashboardPage.navigateToMenu('Admin');
    cy.url().should('include', '/admin/viewSystemUsers');
  });

  it('shows the expected admin management tabs', () => {
    adminPage.getTopbarTabs().then(($tabs) => {
      const labels = [...$tabs].map((tab) => tab.textContent?.trim() || '');
      expect(labels).to.include.members(['User Management', 'Job', 'Organization']);
    });
  });

  it('filters system users by username and can reset the form', () => {
    adminPage.getFirstRowUsername().then((username) => {
      adminPage.searchByUsername(username);
      adminPage.getTableRows().first().should('contain.text', username);

      adminPage.resetFilters();
      adminPage.getUsernameInput().should('have.value', '');
    });
  });
});
