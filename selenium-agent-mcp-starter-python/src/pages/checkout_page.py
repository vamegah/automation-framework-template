from selenium.webdriver.common.by import By
from src.pages.base_page import BasePage


class CheckoutPage(BasePage):
    _title = (By.CSS_SELECTOR, ".title")
    _first_name_input = (By.ID, "first-name")
    _last_name_input = (By.ID, "last-name")
    _postal_code_input = (By.ID, "postal-code")
    _continue_button = (By.ID, "continue")
    _finish_button = (By.ID, "finish")
    _error_message = (By.CSS_SELECTOR, "[data-test='error'], .error-message-container h3")
    _summary_container = (By.ID, "checkout_summary_container")
    _complete_header = (By.CSS_SELECTOR, ".complete-header, [data-test='complete-header']")
    _back_home_button = (By.ID, "back-to-products")

    def _set_value(self, locator: tuple, value: str):
        element = self.wait_for_visible_element(locator)
        self.driver.execute_script(
            """
            const element = arguments[0];
            const value = arguments[1];
            element.focus();
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            value,
        )

    def get_title_text(self) -> str:
        return self.get_text(self._title)

    def fill_customer_info(self, first_name: str, last_name: str, postal_code: str):
        self._set_value(self._first_name_input, first_name)
        self._set_value(self._last_name_input, last_name)
        self._set_value(self._postal_code_input, postal_code)

    def continue_checkout(self):
        self.js_click(self._continue_button)
        if "checkout-step-one.html" in self.current_url():
            return
        self.wait_for_url_contains("checkout-step-two.html")

    def finish_checkout(self):
        self.js_click(self._finish_button)
        self.wait_for_url_contains("checkout-complete.html")

    def get_error_message(self) -> str:
        return self.get_text(self._error_message)

    def has_summary(self) -> bool:
        return self.is_visible(self._summary_container)

    def get_complete_header(self) -> str:
        return self.get_text(self._complete_header)

    def back_home(self):
        self.js_click(self._back_home_button)
        self.wait_for_url_contains("inventory.html")
