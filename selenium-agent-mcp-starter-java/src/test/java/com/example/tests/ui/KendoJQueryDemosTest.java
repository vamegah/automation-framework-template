package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.KendoJQueryDemosPage;
import com.example.pages.TelerikDemosPage;
import com.example.utils.EnvUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class KendoJQueryDemosTest {
    private WebDriver driver;
    private TelerikDemosPage demosPage;
    private KendoJQueryDemosPage jqueryPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        demosPage = new TelerikDemosPage(driver);
        jqueryPage = new KendoJQueryDemosPage(driver);
        String baseUrl = EnvUtils.getProperty("base.url", "https://www.telerik.com/support/demos");
        demosPage.navigateTo(baseUrl);
        demosPage.navigateTo(demosPage.getJqueryDemosHref());
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testKendoJqueryDemosLandingPageLoads() {
        assertTrue(jqueryPage.getHeading().contains("Kendo UI for jQuery Examples"));
        assertTrue(jqueryPage.getCurrentUrl().contains("demos.telerik.com/kendo-ui"));
    }

    @Test
    public void testPopularElementsSurfaceIsVisible() {
        assertTrue(jqueryPage.hasPopularElementsTabs());
        assertTrue(jqueryPage.hasComponentHighlights());
    }

    @Test
    public void testNewToKendoAndExploreAllSectionsAreVisible() {
        assertTrue(jqueryPage.hasTrialCta());
        assertTrue(jqueryPage.hasExploreAllComponentLinks());
        assertTrue(jqueryPage.getPageSource().contains("Download Free Trial"));
    }
}
