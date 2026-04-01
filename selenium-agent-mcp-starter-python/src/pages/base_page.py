from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement
from src.config.settings import get_env


class BasePage:
    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.explicit_wait = int(get_env("EXPLICIT_WAIT", "10"))

    def navigate_to(self, url: str):
        self.driver.get(url)

    def find_element(self, locator: tuple):
        return self.driver.find_element(*locator)

    def find_elements(self, locator: tuple):
        return self.driver.find_elements(*locator)

    def wait_for_element(self, locator: tuple, timeout: int = None):
        timeout = timeout or self.explicit_wait
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )

    def wait_for_visible_element(self, locator: tuple, timeout: int = None):
        timeout = timeout or self.explicit_wait
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )

    def click(self, locator: tuple):
        element = WebDriverWait(self.driver, self.explicit_wait).until(
            EC.element_to_be_clickable(locator)
        )
        element.click()

    def type(self, locator: tuple, text: str):
        element = self.wait_for_visible_element(locator)
        element.click()
        element.send_keys(Keys.CONTROL, "a")
        element.clear()
        element.send_keys(text)

    def get_text(self, locator: tuple) -> str:
        element = self.wait_for_element(locator)
        return element.text

    def get_attribute(self, locator: tuple, name: str) -> str:
        element = self.wait_for_element(locator)
        return element.get_attribute(name)

    def is_visible(self, locator: tuple) -> bool:
        return self.wait_for_visible_element(locator).is_displayed()

    def current_url(self) -> str:
        return self.driver.current_url

    def title(self) -> str:
        return self.driver.title

    def click_element(self, element: WebElement):
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        element.click()

    def js_click(self, locator: tuple):
        element = self.wait_for_visible_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        self.driver.execute_script("arguments[0].click();", element)

    def wait_for_url_contains(self, value: str, timeout: int = None):
        timeout = timeout or self.explicit_wait
        WebDriverWait(self.driver, timeout).until(EC.url_contains(value))

    def take_screenshot(self, filepath: str):
        self.driver.save_screenshot(filepath)
