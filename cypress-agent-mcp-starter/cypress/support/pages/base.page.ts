export class BasePage {
  protected urlPath = '';

  visit(path?: string) {
    const fullPath = path || this.urlPath;
    cy.visit(fullPath);
  }

  getTitle() {
    return cy.title();
  }

  waitForElement(selector: string, timeout?: number) {
    return cy.get(selector, { timeout });
  }

  click(selector: string) {
    cy.get(selector).click();
  }

  type(selector: string, text: string) {
    cy.get(selector).clear().type(text);
  }

  getText(selector: string) {
    return cy.get(selector).invoke('text');
  }

  getInputGroup(label: string) {
    return cy.contains('.oxd-input-group', label).closest('.oxd-input-group');
  }

  getInputByLabel(label: string) {
    return this.getInputGroup(label).find('input');
  }

  getDropdownByLabel(label: string) {
    return this.getInputGroup(label).find('.oxd-select-text');
  }

  clickButtonByText(label: string) {
    return cy.contains('button', label).click();
  }

  screenshot(name: string) {
    cy.screenshot(name);
  }
}
