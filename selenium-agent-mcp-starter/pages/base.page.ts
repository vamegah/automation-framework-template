import { By, WebDriver, WebElement, until } from 'selenium-webdriver';

export class BasePage {
  constructor(protected driver: WebDriver) {}

  async navigate(url: string): Promise<void> {
    await this.driver.get(url);
  }

  async findElement(locator: By): Promise<WebElement> {
    return this.driver.findElement(locator);
  }

  async waitForElement(locator: By, timeout = 5000): Promise<WebElement> {
    return this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForVisible(locator: By, timeout = 5000): Promise<WebElement> {
    const element = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async click(locator: By): Promise<void> {
    const element = await this.waitForVisible(locator);
    await element.click();
  }

  async jsClick(locator: By): Promise<void> {
    const element = await this.waitForVisible(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
    await this.driver.executeScript('arguments[0].click();', element);
  }

  async type(locator: By, text: string): Promise<void> {
    const element = await this.waitForVisible(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator: By): Promise<string> {
    const element = await this.waitForVisible(locator);
    return element.getText();
  }

  async getCurrentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
  }

  async getTitle(): Promise<string> {
    return this.driver.getTitle();
  }

  async isVisible(locator: By): Promise<boolean> {
    try {
      const element = await this.waitForVisible(locator);
      return element.isDisplayed();
    } catch {
      return false;
    }
  }

  async getAttribute(locator: By, attribute: string): Promise<string> {
    const element = await this.waitForVisible(locator);
    return (await element.getAttribute(attribute)) ?? '';
  }

  async getElements(locator: By): Promise<WebElement[]> {
    return this.driver.findElements(locator);
  }

  async waitForUrlContains(path: string, timeout = 5000): Promise<void> {
    await this.driver.wait(until.urlContains(path), timeout);
  }

  async takeScreenshot(filePath: string): Promise<string> {
    const image = await this.driver.takeScreenshot();
    // In a real implementation, write the base64 image to a file
    return image;
  }
}
