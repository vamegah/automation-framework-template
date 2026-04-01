import { expect } from 'chai';
import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';
import { getBaseUrl, getSauceDemoPassword, getSauceDemoUsername } from '../../utils/env';
import { InventoryPage } from '../../pages/inventory.page';

describe('Login Page', () => {
  let config: SeleniumConfig;
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  beforeEach(async () => {
    config = new SeleniumConfig();
    const driver = await config.getDriver();
    loginPage = new LoginPage(driver);
    inventoryPage = new InventoryPage(driver);
    await loginPage.navigate(getBaseUrl());
  });

  afterEach(async () => {
    await config.quitDriver();
  });

  it('should log in to Sauce Demo with the standard user', async () => {
    await loginPage.login(getSauceDemoUsername(), getSauceDemoPassword());
    const title = await inventoryPage.getTitleText();
    expect(title).to.contain('Products');
  });
});
