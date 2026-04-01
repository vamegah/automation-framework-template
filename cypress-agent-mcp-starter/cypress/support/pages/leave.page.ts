import { BasePage } from './base.page';

export class LeavePage extends BasePage {
  protected urlPath = '/web/index.php/leave/viewLeaveList';

  getTopbarTabs() {
    return cy.get('.oxd-topbar-body-nav-tab-item');
  }

  getFromDateInput() {
    return this.getInputByLabel('From Date');
  }

  getToDateInput() {
    return this.getInputByLabel('To Date');
  }

  getLeaveTypeDropdown() {
    return this.getDropdownByLabel('Leave Type');
  }

  getEmployeeNameInput() {
    return this.getInputByLabel('Employee Name');
  }

  openApplyTab() {
    cy.contains('.oxd-topbar-body-nav-tab-item', 'Apply').click();
  }

  getApplyFormHeader() {
    return cy.get('.orangehrm-main-title');
  }

  getApplyLeaveTypeDropdown() {
    return this.getDropdownByLabel('Leave Type');
  }

  getApplyDateInput() {
    return this.getInputByLabel('From Date');
  }

  getApplyCommentInput() {
    return cy.get('textarea');
  }

  visitAddEntitlement() {
    this.visit('/web/index.php/leave/addLeaveEntitlement');
  }

  getEntitlementHeader() {
    return cy.get('.orangehrm-main-title');
  }

  getEntitlementEmployeeInput() {
    return this.getInputByLabel('Employee Name');
  }

  getEntitlementLeaveTypeDropdown() {
    return this.getDropdownByLabel('Leave Type');
  }

  getEntitlementAmountInput() {
    return this.getInputByLabel('Entitlement');
  }

  assignEntitlementToEmployee(employeeNameQuery: string, employeeNameOption: string, leaveType: string, amount: string) {
    this.getEntitlementEmployeeInput().clear().type(employeeNameQuery);
    cy.contains('.oxd-autocomplete-option', employeeNameOption, { timeout: 10000 }).click();
    this.getEntitlementLeaveTypeDropdown().click();
    cy.contains('.oxd-select-option', leaveType).click();
    this.getEntitlementAmountInput().clear().type(amount);
    this.clickButtonByText('Save');
  }
}
