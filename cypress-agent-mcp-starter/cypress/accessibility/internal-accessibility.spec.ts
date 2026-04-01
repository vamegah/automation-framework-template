import { DashboardPage, LoginPage } from '../support/pages';

const wcagOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa'],
  },
  includedImpacts: ['serious', 'critical'],
};

const expectRepresentativeViolations = (violations: axe.Result[], expectedIds: string[]) => {
  expect(violations.length, JSON.stringify(violations, null, 2)).to.be.greaterThan(0);
  const violationIds = violations.map((violation) => violation.id);
  expect(violationIds).to.include.members(expectedIds);
};

describe('OrangeHRM Internal Accessibility', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const validUser = {
    username: Cypress.env('ORANGEHRM_USERNAME') || 'Admin',
    password: Cypress.env('ORANGEHRM_PASSWORD') || 'admin123',
  };
  const writeArtifact = (testName: string, pageName: string, violations: axe.Result[]) =>
    cy.url().then((url) => cy.task('writeAccessibilityReport', {
      suiteName: 'OrangeHRM Internal Accessibility',
      testName,
      pageName,
      url,
      violations,
    }));

  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('login page surfaces representative serious and critical axe findings', () => {
    loginPage.visit();
    cy.url().should('include', '/auth/login');
    loginPage.getPageHeader().should('be.visible');

    cy.injectAxe();
    let violations: axe.Result[] = [];

    cy.checkA11y(
      undefined,
      wcagOptions,
      (results) => {
        violations = results;
        expectRepresentativeViolations(results, ['color-contrast', 'html-has-lang', 'link-name']);
      },
      true,
    ).then(() => writeArtifact(
      'login page surfaces representative serious and critical axe findings',
      'login',
      violations,
    ));
  });

  it('dashboard shell surfaces representative serious and critical axe findings after login', () => {
    loginPage.visit();
    loginPage.login(validUser.username, validUser.password);
    cy.url().should('include', '/dashboard');
    dashboardPage.getSidePanel().should('be.visible');

    cy.injectAxe();
    let violations: axe.Result[] = [];

    cy.checkA11y(
      undefined,
      wcagOptions,
      (results) => {
        violations = results;
        expectRepresentativeViolations(results, ['button-name', 'color-contrast', 'html-has-lang', 'list']);
      },
      true,
    ).then(() => writeArtifact(
      'dashboard shell surfaces representative serious and critical axe findings after login',
      'dashboard',
      violations,
    ));
  });
});
