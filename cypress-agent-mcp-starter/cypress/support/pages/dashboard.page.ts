import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  protected urlPath = '/web/index.php/dashboard/index';

  private topbarHeader = '.oxd-topbar-header-breadcrumb h6';
  private sidePanel = '.oxd-sidepanel-body';
  private userDropdownTab = '.oxd-userdropdown-tab';
  private userDropdownMenu = '.oxd-dropdown-menu';
  private menuItems = '.oxd-main-menu-item';
  private quickLaunchSection = '.orangehrm-quick-launch';

  navigateToMenu(label: string) {
    cy.contains(this.menuItems, label).click();
  }

  getTopbarHeader() {
    return cy.get(this.topbarHeader);
  }

  getSidePanel() {
    return cy.get(this.sidePanel);
  }

  getMenuItem(label: string) {
    return cy.contains(this.menuItems, label);
  }

  getQuickLaunchSection() {
    return cy.get(this.quickLaunchSection);
  }

  openUserMenu() {
    cy.get(this.userDropdownTab).click();
    return cy.get(this.userDropdownMenu);
  }

  logout() {
    this.openUserMenu();
    cy.contains('.oxd-userdropdown-link', 'Logout').click();
  }
}
