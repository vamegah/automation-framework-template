import { expect } from 'chai';
import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';
import { getBaseUrl, getSauceDemoPassword } from '../../utils/env';

describe('Authentication Validation', () => {
  let config: SeleniumConfig;
  let loginPage: LoginPage;

  beforeEach(async () => {
    config = new SeleniumConfig();
    const driver = await config.getDriver();
    loginPage = new LoginPage(driver);
    await loginPage.navigate(getBaseUrl());
  });

  afterEach(async () => {
    await config.quitDriver();
  });

  it('shows a required-username error on empty submit', async () => {
    await loginPage.submitEmpty();
    expect(await loginPage.isErrorVisible()).to.equal(true);
    expect(await loginPage.getErrorMessage()).to.contain('Username is required');
  });

  it('shows an invalid-credentials error for a bad username', async () => {
    await loginPage.login('locked_out_user_typo', getSauceDemoPassword());
    expect(await loginPage.isErrorVisible()).to.equal(true);
    expect(await loginPage.getErrorMessage()).to.contain('Username and password do not match');
  });

  it('shows the locked-out-user error for a blocked account', async () => {
    await loginPage.login('locked_out_user', getSauceDemoPassword());
    expect(await loginPage.isErrorVisible()).to.equal(true);
    expect(await loginPage.getErrorMessage()).to.contain('Sorry, this user has been locked out');
  });
});
