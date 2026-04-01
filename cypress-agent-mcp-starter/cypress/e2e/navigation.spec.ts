import { DashboardPage, LoginPage } from '../support/pages';

describe('OrangeHRM Authenticated Navigation', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };

  const menuRoutes = [
    { label: 'Admin', expectedUrl: '/admin/', expectedHeader: 'Admin' },
    { label: 'PIM', expectedUrl: '/pim/', expectedHeader: 'PIM' },
    { label: 'Leave', expectedUrl: '/leave/', expectedHeader: 'Leave' },
    { label: 'Time', expectedUrl: '/time/', expectedHeader: 'Time' },
    { label: 'Recruitment', expectedUrl: '/recruitment/', expectedHeader: 'Recruitment' },
    { label: 'My Info', expectedUrl: '/viewPersonalDetails', expectedHeader: 'PIM' },
    { label: 'Performance', expectedUrl: '/performance/', expectedHeader: 'Performance' },
    { label: 'Directory', expectedUrl: '/directory/', expectedHeader: 'Directory' },
    { label: 'Buzz', expectedUrl: '/buzz/', expectedHeader: 'Buzz' },
  ];

  beforeEach(() => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    cy.url().should('include', '/dashboard');
  });

  it('shows the main navigation shell after login', () => {
    dashboardPage.getSidePanel().should('be.visible');
    dashboardPage.getTopbarHeader().should('contain', 'Dashboard');
    dashboardPage.getQuickLaunchSection().should('be.visible');

    ['Admin', 'PIM', 'Leave', 'Time', 'Recruitment', 'My Info', 'Performance', 'Directory', 'Buzz'].forEach(
      (label) => {
        dashboardPage.getMenuItem(label).should('be.visible');
      },
    );
  });

  menuRoutes.forEach(({ label, expectedUrl, expectedHeader }) => {
    it(`navigates to ${label} from the side menu`, () => {
      dashboardPage.navigateToMenu(label);

      cy.url().should('include', expectedUrl);
      dashboardPage.getTopbarHeader().should('contain', expectedHeader);
    });
  });
});
