import { DashboardPage, LeavePage, LoginPage } from '../support/pages';

describe('OrangeHRM Leave Workflows', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const leavePage = new LeavePage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    dashboardPage.navigateToMenu('Leave');
    cy.url().should('include', '/leave/');
  });

  it('shows the leave list filter form', () => {
    leavePage.getTopbarTabs().then(($tabs) => {
      const labels = [...$tabs].map((tab) => tab.textContent?.trim() || '');
      expect(labels).to.include.members(['Apply', 'My Leave', 'Leave List']);
    });

    leavePage.getFromDateInput().should('be.visible');
    leavePage.getToDateInput().should('be.visible');
    leavePage.getLeaveTypeDropdown().should('be.visible');
    leavePage.getEmployeeNameInput().should('be.visible');
  });

  it('opens the apply leave form', () => {
    leavePage.openApplyTab();

    cy.url().should('include', '/leave/applyLeave');
    leavePage.getApplyFormHeader().should('contain', 'Apply Leave');
    leavePage.getApplyLeaveTypeDropdown().should('be.visible');
    leavePage.getApplyDateInput().should('be.visible');
    leavePage.getApplyCommentInput().should('be.visible');
  });
});
