import { expect } from 'chai';
import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';
import { InventoryPage } from '../../pages/inventory.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { getBaseUrl, getSauceDemoPassword, getSauceDemoUsername } from '../../utils/env';

describe('Cart And Checkout Coverage', () => {
  let config: SeleniumConfig;
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  beforeEach(async () => {
    config = new SeleniumConfig();
    const driver = await config.getDriver();
    loginPage = new LoginPage(driver);
    inventoryPage = new InventoryPage(driver);
    cartPage = new CartPage(driver);
    checkoutPage = new CheckoutPage(driver);
    await loginPage.navigate(getBaseUrl());
    await loginPage.login(getSauceDemoUsername(), getSauceDemoPassword());
  });

  afterEach(async () => {
    await config.quitDriver();
  });

  it('shows the cart screen with a selected item', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    expect(await cartPage.getTitleText()).to.equal('Your Cart');
    expect(await cartPage.getCartItemCount()).to.equal(1);
  });

  it('allows continuing shopping from the cart', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.continueShopping();
    expect(await inventoryPage.getTitleText()).to.equal('Products');
  });

  it('validates checkout information when submitted empty', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    expect(await checkoutPage.getTitleText()).to.equal('Checkout: Your Information');
    await checkoutPage.continueEmpty();
    expect(await checkoutPage.getErrorMessage()).to.contain('First Name is required');
  });

  it('shows checkout overview and completes checkout successfully', async () => {
    await inventoryPage.addFirstItemToCart();
    await checkoutPage.navigate(new URL('checkout-step-two.html', getBaseUrl()).toString());
    expect(await checkoutPage.getTitleText()).to.equal('Checkout: Overview');
    expect(await checkoutPage.getSummaryTotalText()).to.contain('Total:');
    await checkoutPage.finishCheckout();
    expect(await checkoutPage.getCompleteHeaderText()).to.equal('Thank you for your order!');
  });

  it('can remove an item from the cart before checkout', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    expect(await cartPage.getCartItemCount()).to.equal(1);
    await cartPage.removeFirstItem();
    expect(await cartPage.getCartItemCount()).to.equal(0);
  });

  it('shows the correct badge count when multiple items are added', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.addSecondItemToCart();
    expect(await inventoryPage.getCartBadgeText()).to.equal('2');
    await inventoryPage.openCart();
    expect(await cartPage.getCartItemCount()).to.equal(2);
  });
});
