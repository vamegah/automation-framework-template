import { BasePage } from './base.page';

export class PimPage extends BasePage {
  protected urlPath = '/web/index.php/pim/viewEmployeeList';

  private tableRows = '.oxd-table-card';
  private tableCells = '.oxd-table-cell';

  getTopbarTabs() {
    return cy.get('.oxd-topbar-body-nav-tab-item');
  }

  getEmployeeIdInput() {
    return this.getInputByLabel('Employee Id');
  }

  getEmployeeNameInput() {
    return this.getInputByLabel('Employee Name');
  }

  searchByEmployeeId(employeeId: string) {
    this.getEmployeeIdInput().clear().type(employeeId);
    this.clickButtonByText('Search');
  }

  searchByEmployeeName(employeeQuery: string, employeeOption: string) {
    this.getEmployeeNameInput().clear().type(employeeQuery);
    cy.contains('.oxd-autocomplete-option', employeeOption, { timeout: 10000 }).click();
    this.clickButtonByText('Search');
  }

  resetFilters() {
    this.clickButtonByText('Reset');
  }

  openAddEmployeeTab() {
    cy.contains('.oxd-topbar-body-nav-tab-item', 'Add Employee').click();
  }

  getFirstRowEmployeeId() {
    return cy
      .get(this.tableRows)
      .first()
      .find(this.tableCells)
      .eq(1)
      .invoke('text')
      .then((text) => text.trim());
  }

  getEmployeeFormHeader() {
    return cy.get('.orangehrm-main-title');
  }

  getFirstNameInput() {
    return cy.get('input.orangehrm-firstname');
  }

  getLastNameInput() {
    return cy.get('input.orangehrm-lastname');
  }

  createEmployee(firstName: string, lastName: string) {
    this.getFirstNameInput().clear().type(firstName);
    this.getLastNameInput().clear().type(lastName);
    cy.get('button[type="submit"]', { timeout: 20000 }).last().click();
  }

  deleteFirstSearchResult() {
    cy.get(this.tableRows).first().find('button').eq(1).click();
    cy.contains('button', 'Yes, Delete').click();
  }
}
