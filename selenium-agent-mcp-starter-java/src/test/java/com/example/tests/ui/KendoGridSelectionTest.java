package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.KendoGridSelectionPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class KendoGridSelectionTest {
    private WebDriver driver;
    private KendoGridSelectionPage gridPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        gridPage = new KendoGridSelectionPage(driver);
        gridPage.navigateTo("https://demos.telerik.com/kendo-ui/grid/selection");
        gridPage.acceptCookiesIfPresent();
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testGridSelectionDemoLoads() {
        assertTrue(gridPage.getHeading().contains("jQuery Grid Selection"));
        assertTrue(gridPage.hasSelectionSections());
    }

    @Test
    public void testRowSelectionInteractionWorks() {
        gridPage.selectFirstRow();
        assertTrue(gridPage.isFirstRowSelected());
        gridPage.selectSecondRow();
        assertTrue(gridPage.isSecondRowSelected());
    }
}
