import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private title = By.css('.title');
  private cartItems = By.css('.cart_item');
  private checkoutButton = By.id('checkout');
  private continueShoppingButton = By.id('continue-shopping');
  private removeButton = By.css('[data-test^="remove"]');

  async getTitleText(): Promise<string> {
    return this.getText(this.title);
  }

  async getCartItemCount(): Promise<number> {
    const items = await this.getElements(this.cartItems);
    return items.length;
  }

  async proceedToCheckout(): Promise<void> {
    await this.jsClick(this.checkoutButton);
    await this.waitForUrlContains('checkout-step-one.html');
  }

  async continueShopping(): Promise<void> {
    await this.jsClick(this.continueShoppingButton);
    await this.waitForUrlContains('inventory.html');
  }

  async removeFirstItem(): Promise<void> {
    await this.jsClick(this.removeButton);
  }
}
