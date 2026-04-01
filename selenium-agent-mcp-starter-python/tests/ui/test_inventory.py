from src.pages.login_page import LoginPage
from src.pages.inventory_page import InventoryPage
from src.pages.item_details_page import ItemDetailsPage


def login_as_standard_user(driver, base_url, standard_user_credentials):
    username, password = standard_user_credentials
    login_page = LoginPage(driver)
    login_page.navigate_to(base_url)
    login_page.login(username, password)
    return InventoryPage(driver)


def test_inventory_screen_lists_products(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)

    assert inventory_page.is_loaded()
    assert inventory_page.get_inventory_count() == 6
    assert inventory_page.get_selected_sort() == "Name (A to Z)"


def test_inventory_item_details_and_back_navigation(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)
    item_details_page = ItemDetailsPage(driver)

    inventory_page.open_backpack_details()

    assert item_details_page.is_loaded()
    assert item_details_page.get_item_name() == "Sauce Labs Backpack"
    assert item_details_page.has_item_content()
    assert "inventory-item.html" in item_details_page.current_url()


def test_inventory_add_remove_and_logout(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)
    login_page = LoginPage(driver)

    inventory_page.add_backpack_to_cart()
    assert inventory_page.get_cart_badge_count() == "1"
    inventory_page.logout()

    assert login_page.is_loaded()
