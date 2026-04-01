import { Builder, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import * as dotenv from 'dotenv';

dotenv.config();

export class SeleniumConfig {
  private driver: WebDriver | null = null;

  async getDriver(): Promise<WebDriver> {
    if (!this.driver) {
      const headless = process.env.HEADLESS !== 'false';
      const options = new Options();
      if (headless) {
        options.addArguments('--headless=new');
      }
      options.addArguments(
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1400,1000',
      );

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
      await this.driver.manage().setTimeouts({ pageLoad: 60000, implicit: 0, script: 30000 });
      await this.driver.manage().window().setRect({ width: 1400, height: 1000, x: 0, y: 0 });
    }
    return this.driver;
  }

  async quitDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }
}
