import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  private title = By.css('.title');
  private cartLink = By.css('.shopping_cart_link');
  private cartBadge = By.css('.shopping_cart_badge');
  private inventoryItems = By.css('.inventory_item');
  private sortSelect = By.css('[data-test="product-sort-container"]');
  private menuButton = By.id('react-burger-menu-btn');
  private logoutLink = By.id('logout_sidebar_link');
  private aboutLink = By.id('about_sidebar_link');
  private resetAppStateLink = By.id('reset_sidebar_link');
  private firstItemName = By.id('item_4_title_link');
  private firstAddToCartButton = By.id('add-to-cart-sauce-labs-backpack');
  private firstRemoveButton = By.id('remove-sauce-labs-backpack');
  private secondAddToCartButton = By.id('add-to-cart-sauce-labs-bike-light');
  private itemNames = By.css('.inventory_item_name');

  async getTitleText(): Promise<string> {
    return this.getText(this.title);
  }

  async getItemCount(): Promise<number> {
    const items = await this.getElements(this.inventoryItems);
    return items.length;
  }

  async openFirstItem(): Promise<void> {
    await this.jsClick(this.firstItemName);
    await this.waitForUrlContains('inventory-item.html');
  }

  async addFirstItemToCart(): Promise<void> {
    await this.jsClick(this.firstAddToCartButton);
    await this.driver.wait(async () => {
      if (await this.isCartBadgeVisible()) {
        return true;
      }
      return this.isVisible(this.firstRemoveButton);
    }, 5000);
  }

  async removeFirstItemFromCart(): Promise<void> {
    await this.jsClick(this.firstRemoveButton);
    await this.driver.wait(async () => !(await this.isCartBadgeVisible()), 5000);
  }

  async openCart(): Promise<void> {
    const currentUrl = await this.getCurrentUrl();
    const cartUrl = new URL('cart.html', currentUrl).toString();

    try {
      await this.jsClick(this.cartLink);
      await this.waitForUrlContains('cart.html');
    } catch {
      await this.navigate(cartUrl);
      await this.waitForUrlContains('cart.html');
    }
  }

  async getCartBadgeText(): Promise<string> {
    return this.getText(this.cartBadge);
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.isVisible(this.cartBadge);
  }

  async getCurrentSortValue(): Promise<string> {
    return this.getAttribute(this.sortSelect, 'value');
  }

  async sortBy(value: string): Promise<void> {
    const select = await this.waitForVisible(this.sortSelect);
    await this.driver.executeScript(
      'arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event("change", { bubbles: true }));',
      select,
      value,
    );
    await this.driver.wait(async () => (await this.getCurrentSortValue()) === value, 5000);
  }

  async getItemNames(): Promise<string[]> {
    const elements = await this.getElements(this.itemNames);
    const names = await Promise.all(elements.map((element) => element.getText()));
    return names.filter(Boolean);
  }

  async addSecondItemToCart(): Promise<void> {
    await this.jsClick(this.secondAddToCartButton);
    await this.driver.wait(async () => (await this.getCartBadgeText()) === '2', 5000);
  }

  async openMenu(): Promise<void> {
    await this.jsClick(this.menuButton);
    await this.waitForVisible(this.logoutLink);
  }

  async clickLogout(): Promise<void> {
    await this.openMenu();
    await this.jsClick(this.logoutLink);
    await this.waitForUrlContains('saucedemo.com');
  }

  async clickAbout(): Promise<void> {
    await this.openMenu();
    await this.jsClick(this.aboutLink);
    await this.driver.wait(async () => (await this.getCurrentUrl()).includes('saucelabs.com'), 10000);
  }

  async clickResetAppState(): Promise<void> {
    await this.openMenu();
    await this.jsClick(this.resetAppStateLink);
    await this.driver.wait(async () => !(await this.isCartBadgeVisible()), 5000);
  }
}
