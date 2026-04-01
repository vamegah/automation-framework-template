import { BasePage } from './base.page';

export class AdminPage extends BasePage {
  protected urlPath = '/web/index.php/admin/viewSystemUsers';

  private tableRows = '.oxd-table-card';
  private tableCells = '.oxd-table-cell';

  getTopbarTabs() {
    return cy.get('.oxd-topbar-body-nav-tab-item');
  }

  getUsernameInput() {
    return this.getInputByLabel('Username');
  }

  searchByUsername(username: string) {
    this.getUsernameInput().clear().type(username);
    this.clickButtonByText('Search');
  }

  resetFilters() {
    this.clickButtonByText('Reset');
  }

  getTableRows() {
    return cy.get(this.tableRows);
  }

  getFirstRowUsername() {
    return this.getTableRows()
      .first()
      .find(this.tableCells)
      .eq(1)
      .invoke('text')
      .then((text) => text.trim());
  }
}
