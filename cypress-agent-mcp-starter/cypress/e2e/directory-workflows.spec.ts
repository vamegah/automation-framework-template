import { DashboardPage, DirectoryPage, LoginPage } from '../support/pages';

describe('OrangeHRM Directory Workflows', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const directoryPage = new DirectoryPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  beforeEach(() => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    dashboardPage.navigateToMenu('Directory');
    cy.url().should('include', '/directory/viewDirectory');
  });

  it('allows selecting directory filters and resetting them', () => {
    directoryPage.getDirectoryCards().its('length').should('be.greaterThan', 0);

    directoryPage.selectJobTitle('QA Engineer');
    directoryPage.selectLocation('Texas R&D');

    directoryPage.getSelectedFilterValues().then((values) => {
      expect(values).to.include.members(['QA Engineer', 'Texas R&D']);
    });

    directoryPage.resetFilters();

    directoryPage.getSelectedFilterValues().then((values) => {
      expect(values.filter((value) => value === '-- Select --')).to.have.length.at.least(2);
    });
  });
});
