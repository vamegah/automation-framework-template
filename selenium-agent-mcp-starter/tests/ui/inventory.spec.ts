import { expect } from 'chai';
import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';
import { InventoryPage } from '../../pages/inventory.page';
import { ItemDetailsPage } from '../../pages/item-details.page';
import { getBaseUrl, getSauceDemoPassword, getSauceDemoUsername } from '../../utils/env';

describe('Inventory Coverage', () => {
  let config: SeleniumConfig;
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let itemDetailsPage: ItemDetailsPage;

  beforeEach(async () => {
    config = new SeleniumConfig();
    const driver = await config.getDriver();
    loginPage = new LoginPage(driver);
    inventoryPage = new InventoryPage(driver);
    itemDetailsPage = new ItemDetailsPage(driver);
    await loginPage.navigate(getBaseUrl());
    await loginPage.login(getSauceDemoUsername(), getSauceDemoPassword());
  });

  afterEach(async () => {
    await config.quitDriver();
  });

  it('shows the inventory list after login', async () => {
    expect(await inventoryPage.getTitleText()).to.equal('Products');
    expect(await inventoryPage.getItemCount()).to.equal(6);
    expect(await inventoryPage.getCurrentSortValue()).to.equal('az');
  });

  it('can change the inventory sort order', async () => {
    await inventoryPage.sortBy('za');
    expect(await inventoryPage.getCurrentSortValue()).to.equal('za');
    const itemNames = await inventoryPage.getItemNames();
    expect(itemNames[0]).to.equal('Test.allTheThings() T-Shirt (Red)');
  });

  it('opens an item details page and returns to the products grid', async () => {
    await inventoryPage.openFirstItem();
    expect(await itemDetailsPage.getItemName()).to.not.equal('');
    expect(await itemDetailsPage.getItemDescription()).to.not.equal('');
    await itemDetailsPage.goBackToProducts();
    expect(await inventoryPage.getTitleText()).to.equal('Products');
  });

  it('can add and remove an item directly from the inventory grid', async () => {
    await inventoryPage.addFirstItemToCart();
    expect(await inventoryPage.isCartBadgeVisible()).to.equal(true);
    expect(await inventoryPage.getCartBadgeText()).to.equal('1');
    await inventoryPage.removeFirstItemFromCart();
    expect(await inventoryPage.isCartBadgeVisible()).to.equal(false);
  });

  it('can add and remove an item from the item details page', async () => {
    await inventoryPage.openFirstItem();
    await itemDetailsPage.addToCart();
    expect(await itemDetailsPage.getCartBadgeText()).to.equal('1');
    await itemDetailsPage.removeFromCart();
    expect(await itemDetailsPage.isCartBadgeVisible()).to.equal(false);
  });

  it('can reset the app state from the menu', async () => {
    await inventoryPage.addFirstItemToCart();
    expect(await inventoryPage.getCartBadgeText()).to.equal('1');
    await inventoryPage.clickResetAppState();
    expect(await inventoryPage.isCartBadgeVisible()).to.equal(false);
  });

  it('can open the about page from the inventory menu', async () => {
    await inventoryPage.clickAbout();
    expect(await inventoryPage.getCurrentUrl()).to.contain('saucelabs.com');
  });

  it('can log out from the inventory menu', async () => {
    await inventoryPage.clickLogout();
    expect(await loginPage.getCurrentUrl()).to.equal(getBaseUrl());
  });
});
