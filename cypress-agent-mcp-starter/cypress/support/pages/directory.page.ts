import { BasePage } from './base.page';

export class DirectoryPage extends BasePage {
  protected urlPath = '/web/index.php/directory/viewDirectory';

  private directoryCards = '.orangehrm-directory-card';

  getEmployeeNameInput() {
    return this.getInputByLabel('Employee Name');
  }

  getJobTitleDropdown() {
    return this.getDropdownByLabel('Job Title');
  }

  getLocationDropdown() {
    return this.getDropdownByLabel('Location');
  }

  selectJobTitle(option: string) {
    this.getJobTitleDropdown().click();
    cy.contains('.oxd-select-option', option).click();
  }

  selectLocation(option: string) {
    this.getLocationDropdown().click();
    cy.contains('.oxd-select-option', option).click();
  }

  resetFilters() {
    this.clickButtonByText('Reset');
  }

  getDirectoryCards() {
    return cy.get(this.directoryCards);
  }

  getSelectedFilterValues() {
    return cy
      .get('.oxd-select-text-input')
      .then(($values) => [...$values].map((value) => value.textContent?.trim() || ''));
  }
}
