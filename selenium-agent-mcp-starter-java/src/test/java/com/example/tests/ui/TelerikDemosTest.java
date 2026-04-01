package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.TelerikDemosPage;
import com.example.utils.EnvUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class TelerikDemosTest {
    private WebDriver driver;
    private TelerikDemosPage demosPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        demosPage = new TelerikDemosPage(driver);
        String baseUrl = EnvUtils.getProperty("base.url", "https://www.telerik.com/support/demos");
        demosPage.navigateTo(baseUrl);
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testDemosLandingPageLoads() {
        assertEquals("Demos", demosPage.getHeading());
        assertTrue(demosPage.hasJqueryDemosLink());
    }

    @Test
    public void testTopCategoryTabsAreVisible() {
        assertTrue(demosPage.hasTopCategoryTabs());
        assertTrue(demosPage.getTitle().contains("Telerik Product Demos"));
    }

    @Test
    public void testWebSectionLaunchLinksAreVisible() {
        assertTrue(demosPage.hasWebDemoLaunchLinks());
        assertTrue(demosPage.getJqueryDemosHref().contains("demos.telerik.com"));
    }

    @Test
    public void testDesktopAndMobileSectionsExposeRepresentativeDemoLinks() {
        assertTrue(demosPage.hasDesktopAndMobileDemoLinks());
    }

    @Test
    public void testReportingTestingAndDebuggingSectionsExposeDemoLinks() {
        assertTrue(demosPage.hasReportingTestingAndDebuggingLinks());
    }

    @Test
    public void testConversationalUiSectionListsProductDemoLinks() {
        assertTrue(demosPage.hasConversationalUiLinks());
    }
}
