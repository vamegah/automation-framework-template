import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';

export class ItemDetailsPage extends BasePage {
  private itemName = By.css('.inventory_details_name');
  private itemDescription = By.css('.inventory_details_desc');
  private addToCartButton = By.css('[data-test^="add-to-cart"]');
  private removeButton = By.css('[data-test^="remove"]');
  private backToProductsButton = By.id('back-to-products');
  private cartBadge = By.css('.shopping_cart_badge');

  async getItemName(): Promise<string> {
    return this.getText(this.itemName);
  }

  async getItemDescription(): Promise<string> {
    return this.getText(this.itemDescription);
  }

  async addToCart(): Promise<void> {
    await this.jsClick(this.addToCartButton);
    await this.waitForVisible(this.cartBadge);
  }

  async removeFromCart(): Promise<void> {
    await this.jsClick(this.removeButton);
    await this.driver.wait(async () => !(await this.isVisible(this.cartBadge)), 5000);
  }

  async goBackToProducts(): Promise<void> {
    await this.jsClick(this.backToProductsButton);
  }

  async getCartBadgeText(): Promise<string> {
    return this.getText(this.cartBadge);
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.isVisible(this.cartBadge);
  }
}
