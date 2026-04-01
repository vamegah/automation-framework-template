from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from src.pages.base_page import BasePage


class InventoryPage(BasePage):
    _title = (By.CSS_SELECTOR, ".title")
    _app_logo = (By.CSS_SELECTOR, ".app_logo")
    _inventory_items = (By.CSS_SELECTOR, ".inventory_item")
    _sort_select = (By.CSS_SELECTOR, ".product_sort_container, [data-test='product-sort-container']")
    _cart_link = (By.CSS_SELECTOR, ".shopping_cart_link, [data-test='shopping-cart-link']")
    _cart_badge = (By.CSS_SELECTOR, ".shopping_cart_badge, [data-test='shopping-cart-badge']")
    _menu_button = (By.ID, "react-burger-menu-btn")
    _logout_link = (By.ID, "logout_sidebar_link")
    _about_link = (By.ID, "about_sidebar_link")
    _backpack_item_name = (By.ID, "item_4_title_link")
    _backpack_add_button = (By.CSS_SELECTOR, "#add-to-cart-sauce-labs-backpack, [data-test='add-to-cart-sauce-labs-backpack']")
    _backpack_remove_button = (By.CSS_SELECTOR, "#remove-sauce-labs-backpack, [data-test='remove-sauce-labs-backpack']")

    def is_loaded(self) -> bool:
        return self.is_visible(self._title) and self.get_text(self._title) == "Products"

    def get_logo_text(self) -> str:
        return self.get_text(self._app_logo)

    def get_inventory_count(self) -> int:
        return len(self.find_elements(self._inventory_items))

    def get_selected_sort(self) -> str:
        return Select(self.find_element(self._sort_select)).first_selected_option.text

    def add_backpack_to_cart(self):
        self.js_click(self._backpack_add_button)

    def remove_backpack_from_cart(self):
        self.js_click(self._backpack_remove_button)

    def open_backpack_details(self):
        self.js_click(self._backpack_item_name)
        self.wait_for_url_contains("inventory-item.html")

    def open_cart(self):
        self.js_click(self._cart_link)
        self.wait_for_url_contains("cart.html")

    def get_cart_badge_count(self) -> str:
        return self.get_text(self._cart_badge)

    def is_backpack_remove_visible(self) -> bool:
        return self.is_visible(self._backpack_remove_button)

    def open_menu(self):
        self.js_click(self._menu_button)
        self.wait_for_visible_element(self._logout_link)

    def logout(self):
        self.open_menu()
        self.js_click(self._logout_link)
        self.wait_for_url_contains("saucedemo.com")

    def open_about(self):
        self.open_menu()
        self.click(self._about_link)
