package com.example.tests.base;

import com.example.config.DriverFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;

public abstract class BaseTest {
    protected WebDriver driver;

    @BeforeEach
    void setUpDriver() {
        driver = DriverFactory.createDriver();
    }

    @AfterEach
    void tearDownDriver() {
        DriverFactory.quitDriver();
    }
}
