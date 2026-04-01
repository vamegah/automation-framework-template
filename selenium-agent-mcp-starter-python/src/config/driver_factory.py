from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.remote.webdriver import WebDriver
from src.config.settings import get_env, get_bool_env


class DriverFactory:
    @staticmethod
    def create_driver() -> WebDriver:
        browser = get_env("BROWSER", "chrome").lower()
        headless = get_bool_env("HEADLESS", False)
        project_root = Path(__file__).resolve().parents[2]

        if browser == "chrome":
            options = webdriver.ChromeOptions()
            if headless:
                options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")

            local_chrome = project_root / "chrome" / "win64" / "146.0.7680.153" / "chrome.exe"
            local_driver = project_root / "chromedriver" / "win64" / "146.0.7680.153" / "chromedriver.exe"

            if local_chrome.exists() and local_driver.exists():
                options.binary_location = str(local_chrome)
                service = ChromeService(executable_path=str(local_driver))
                driver = webdriver.Chrome(service=service, options=options)
            else:
                driver = webdriver.Chrome(options=options)

        elif browser == "firefox":
            options = webdriver.FirefoxOptions()
            if headless:
                options.add_argument("--headless")
            driver = webdriver.Firefox(options=options)

        else:
            raise ValueError(f"Unsupported browser: {browser}")

        # Set timeouts
        implicit_wait = int(get_env("IMPLICIT_WAIT", "5"))
        page_load_timeout = int(get_env("PAGE_LOAD_TIMEOUT", "30"))
        driver.implicitly_wait(implicit_wait)
        driver.set_page_load_timeout(page_load_timeout)
        driver.maximize_window()

        return driver

    @staticmethod
    def quit_driver(driver: WebDriver):
        if driver:
            driver.quit()
