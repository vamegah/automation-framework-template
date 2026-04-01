from selenium.webdriver.common.by import By
from src.pages.base_page import BasePage


class CartPage(BasePage):
    _title = (By.CSS_SELECTOR, ".title")
    _cart_items = (By.CSS_SELECTOR, ".cart_item, [data-test='inventory-item']")
    _checkout_button = (By.ID, "checkout")
    _continue_shopping_button = (By.ID, "continue-shopping")
    _remove_backpack_button = (
        By.XPATH,
        "//div[contains(@class,'cart_item')][.//div[contains(@class,'inventory_item_name') and normalize-space()='Sauce Labs Backpack']]//button[contains(@id,'remove') or normalize-space()='Remove']",
    )

    def is_loaded(self) -> bool:
        return "cart.html" in self.current_url() and self.is_visible(self._checkout_button)

    def get_item_count(self) -> int:
        return len(self.find_elements(self._cart_items))

    def remove_backpack(self):
        self.js_click(self._remove_backpack_button)

    def continue_shopping(self):
        self.js_click(self._continue_shopping_button)
        self.wait_for_url_contains("inventory.html")

    def checkout(self):
        self.js_click(self._checkout_button)
        self.wait_for_url_contains("checkout-step-one.html")
