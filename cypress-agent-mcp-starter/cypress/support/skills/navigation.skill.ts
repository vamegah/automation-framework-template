// Example of a custom command: cy.navigateTo(url)
Cypress.Commands.add('navigateTo', (url: string) => {
  cy.visit(url);
});

// Declare the command type for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      navigateTo(url: string): Chainable<void>;
    }
  }
}