from selenium.webdriver.common.by import By
from src.pages.base_page import BasePage


class LoginPage(BasePage):
    _login_logo = (By.CSS_SELECTOR, ".login_logo")
    _username_input = (By.ID, "user-name")
    _password_input = (By.ID, "password")
    _login_button = (By.ID, "login-button")
    _error_message = (By.CSS_SELECTOR, "h3[data-test='error']")

    def is_loaded(self) -> bool:
        return self.is_visible(self._login_logo)

    def login(self, username: str, password: str):
        self.type(self._username_input, username)
        self.type(self._password_input, password)
        self.click(self._login_button)

    def get_error_message(self) -> str:
        return self.get_text(self._error_message)
