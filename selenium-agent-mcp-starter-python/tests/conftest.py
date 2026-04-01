import pytest
from src.config.driver_factory import DriverFactory
from src.config.settings import get_env, resolve_secret


@pytest.fixture(scope="function")
def driver():
    driver = DriverFactory.create_driver()
    yield driver
    DriverFactory.quit_driver(driver)


@pytest.fixture(scope="function")
def base_url():
    return get_env("BASE_URL", "https://www.saucedemo.com")


@pytest.fixture(scope="function")
def standard_user_credentials():
    return (
        resolve_secret("SAUCEDEMO_STANDARD_USERNAME", default="standard_user"),
        resolve_secret("SAUCEDEMO_STANDARD_PASSWORD", default="secret_sauce"),
    )
