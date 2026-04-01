from selenium.webdriver.remote.webdriver import WebDriver


class NavigationSkill:
    def __init__(self, driver: WebDriver):
        self.driver = driver

    def open(self, url: str):
        self.driver.get(url)

    def current_url(self) -> str:
        return self.driver.current_url
