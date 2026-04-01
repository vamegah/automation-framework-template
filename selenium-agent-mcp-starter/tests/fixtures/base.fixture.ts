import { SeleniumConfig } from '../../selenium.config';
import { LoginPage } from '../../pages/login.page';

export interface SeleniumFixture {
  config: SeleniumConfig;
  loginPage: LoginPage;
}

export async function createSeleniumFixture(): Promise<SeleniumFixture> {
  const config = new SeleniumConfig();
  const driver = await config.getDriver();

  return {
    config,
    loginPage: new LoginPage(driver),
  };
}

export async function disposeSeleniumFixture(fixture: SeleniumFixture): Promise<void> {
  await fixture.config.quitDriver();
}
