from src.pages.login_page import LoginPage


class BaseTest:
    def create_login_page(self, driver):
        return LoginPage(driver)
