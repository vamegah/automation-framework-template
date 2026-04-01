Cypress.Commands.add('safeClick', (selector: string) => {
  cy.get(selector).should('be.visible').click();
});

Cypress.Commands.add('fillInput', (selector: string, text: string) => {
  cy.get(selector).clear().type(text);
});

declare global {
  namespace Cypress {
    interface Chainable {
      safeClick(selector: string): Chainable<void>;
      fillInput(selector: string, text: string): Chainable<void>;
    }
  }
}