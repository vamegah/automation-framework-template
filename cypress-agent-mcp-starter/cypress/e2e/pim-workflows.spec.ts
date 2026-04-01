import { DashboardPage, LoginPage, PimPage } from '../support/pages';

describe('OrangeHRM PIM Workflows', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const pimPage = new PimPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    dashboardPage.navigateToMenu('PIM');
    cy.url().should('include', '/pim/viewEmployeeList');
  });

  it('shows core PIM tabs', () => {
    pimPage.getTopbarTabs().then(($tabs) => {
      const labels = [...$tabs].map((tab) => tab.textContent?.trim() || '');
      expect(labels).to.include.members(['Employee List', 'Add Employee', 'Reports']);
    });
  });

  it('filters the employee list by employee id and resets the form', () => {
    pimPage.getFirstRowEmployeeId().then((employeeId) => {
      pimPage.searchByEmployeeId(employeeId);
      cy.get('.oxd-table-card').first().should('contain.text', employeeId);

      pimPage.resetFilters();
      pimPage.getEmployeeIdInput().should('have.value', '');
    });
  });

  it('opens the add employee form', () => {
    pimPage.openAddEmployeeTab();

    cy.url().should('include', '/pim/addEmployee');
    pimPage.getEmployeeFormHeader().should('contain', 'Add Employee');
    pimPage.getFirstNameInput().should('be.visible');
    pimPage.getLastNameInput().should('be.visible');
  });
});
