package com.example.config;

import com.example.utils.EnvUtils;
import org.openqa.selenium.PageLoadStrategy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

import java.time.Duration;

public class DriverFactory {
    private static WebDriver driver;

    public static WebDriver createDriver() {
        String browser = EnvUtils.getProperty("browser", "chrome");
        boolean headless = Boolean.parseBoolean(EnvUtils.getProperty("headless", "true"));

        if (browser.equalsIgnoreCase("chrome")) {
            ChromeOptions options = new ChromeOptions();
            options.setPageLoadStrategy(PageLoadStrategy.EAGER);
            if (headless) {
                options.addArguments("--headless=new");
            }
            options.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1400,1000");
            driver = new ChromeDriver(options);
        } else if (browser.equalsIgnoreCase("firefox")) {
            FirefoxOptions options = new FirefoxOptions();
            if (headless) {
                options.addArguments("--headless");
            }
            driver = new FirefoxDriver(options);
        } else {
            throw new RuntimeException("Unsupported browser: " + browser);
        }

        // Set timeouts
        int implicitWait = Integer.parseInt(EnvUtils.getProperty("implicit.wait", "5"));
        int pageLoadTimeout = Integer.parseInt(EnvUtils.getProperty("page.load.timeout", "60"));
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(implicitWait));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(pageLoadTimeout));
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(1400, 1000));

        return driver;
    }

    public static void quitDriver() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }
}
