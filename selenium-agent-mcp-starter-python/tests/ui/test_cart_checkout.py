from src.pages.login_page import LoginPage
from src.pages.inventory_page import InventoryPage
from src.pages.cart_page import CartPage
from src.pages.checkout_page import CheckoutPage


def login_as_standard_user(driver, base_url, standard_user_credentials):
    username, password = standard_user_credentials
    login_page = LoginPage(driver)
    login_page.navigate_to(base_url)
    login_page.login(username, password)
    return InventoryPage(driver)


def test_cart_screen_shows_added_item(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)
    cart_page = CartPage(driver)

    inventory_page.add_backpack_to_cart()
    cart_page.navigate_to(f"{base_url}/cart.html")

    assert cart_page.is_loaded()
    assert cart_page.get_item_count() == 1


def test_checkout_information_requires_first_name(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)
    cart_page = CartPage(driver)
    checkout_page = CheckoutPage(driver)

    inventory_page.add_backpack_to_cart()
    cart_page.navigate_to(f"{base_url}/cart.html")
    cart_page.checkout()

    assert checkout_page.get_title_text() == "Checkout: Your Information"
    checkout_page.continue_checkout()

    assert "First Name is required" in checkout_page.get_error_message()


def test_checkout_information_screen_loads(driver, base_url, standard_user_credentials):
    inventory_page = login_as_standard_user(driver, base_url, standard_user_credentials)
    cart_page = CartPage(driver)
    checkout_page = CheckoutPage(driver)

    inventory_page.add_backpack_to_cart()
    cart_page.navigate_to(f"{base_url}/cart.html")
    cart_page.checkout()

    assert checkout_page.get_title_text() == "Checkout: Your Information"
