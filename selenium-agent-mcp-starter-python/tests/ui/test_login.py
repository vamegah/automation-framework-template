import pytest
from src.pages.login_page import LoginPage
from src.config.settings import get_env
from src.pages.inventory_page import InventoryPage


def test_login_page_loads(driver, base_url):
    login_page = LoginPage(driver)
    login_page.navigate_to(base_url)

    assert login_page.is_loaded()
    assert "Swag Labs" in login_page.title()


def test_invalid_login_shows_error(driver, base_url):
    username = get_env("SAUCEDEMO_USERNAME", "invalid_user")
    password = get_env("SAUCEDEMO_PASSWORD", "wrong-password")
    login_page = LoginPage(driver)
    login_page.navigate_to(base_url)

    login_page.login(username, password)
    error = login_page.get_error_message()
    assert "Epic sadface" in error


def test_standard_user_login_reaches_inventory(driver, base_url, standard_user_credentials):
    username, password = standard_user_credentials
    login_page = LoginPage(driver)
    inventory_page = InventoryPage(driver)
    login_page.navigate_to(base_url)

    login_page.login(username, password)

    assert inventory_page.is_loaded()
    assert inventory_page.get_logo_text() == "Swag Labs"
