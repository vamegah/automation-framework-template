from selenium.webdriver.remote.webdriver import WebDriver


class ElementInteractionSkill:
    def __init__(self, driver: WebDriver):
        self.driver = driver

    def click_css(self, selector: str):
        self.driver.find_element("css selector", selector).click()

    def type_css(self, selector: str, value: str):
        element = self.driver.find_element("css selector", selector)
        element.clear()
        element.send_keys(value)

    def text_css(self, selector: str) -> str:
        return self.driver.find_element("css selector", selector).text
