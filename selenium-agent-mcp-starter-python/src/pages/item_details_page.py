from selenium.webdriver.common.by import By
from src.pages.base_page import BasePage


class ItemDetailsPage(BasePage):
    _title = (By.CSS_SELECTOR, ".title")
    _item_name = (By.CSS_SELECTOR, ".inventory_details_name, [data-test='inventory-item-name']")
    _item_description = (By.CSS_SELECTOR, ".inventory_details_desc, [data-test='inventory-item-desc']")
    _item_price = (By.CSS_SELECTOR, ".inventory_details_price, [data-test='inventory-item-price']")
    _add_button = (By.ID, "add-to-cart")
    _remove_button = (By.ID, "remove")
    _back_button = (By.CSS_SELECTOR, "#back-to-products, [data-test='back-to-products'], .inventory_details_back_button")

    def is_loaded(self) -> bool:
        return "inventory-item.html" in self.current_url() and self.is_visible(self._item_name)

    def get_item_name(self) -> str:
        return self.get_text(self._item_name)

    def has_item_content(self) -> bool:
        return self.is_visible(self._item_description) and self.is_visible(self._item_price)

    def add_to_cart(self):
        self.js_click(self._add_button)

    def remove_from_cart(self):
        self.js_click(self._remove_button)

    def is_remove_visible(self) -> bool:
        return self.is_visible(self._remove_button)

    def go_back_to_products(self):
        self.js_click(self._back_button)
        self.wait_for_url_contains("inventory.html")
