package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.KendoDropDownListBasicPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class KendoDropDownListBasicTest {
    private WebDriver driver;
    private KendoDropDownListBasicPage dropDownListPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        dropDownListPage = new KendoDropDownListBasicPage(driver);
        dropDownListPage.navigateTo("https://demos.telerik.com/kendo-ui/dropdownlist/basic-usage");
        dropDownListPage.acceptCookiesIfPresent();
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testDropDownListDemoLoads() {
        assertTrue(dropDownListPage.getHeading().contains("DropDownList"));
        assertTrue(dropDownListPage.hasDemoDescription());
        assertTrue(dropDownListPage.getTitle().contains("DropDownList Widget Demo"));
    }

    @Test
    public void testDropDownSelectionUpdatesPreviewAndAlert() {
        dropDownListPage.selectOrangeCapColor();
        dropDownListPage.selectMediumSize();

        assertTrue(dropDownListPage.isOrangeCapPreviewVisible());

        String alertText = dropDownListPage.submitSelectionAndReadAlert();

        assertTrue(alertText.contains("Color ID: 2"));
        assertTrue(alertText.contains("Size: M - 7 1/4"));
        assertTrue(dropDownListPage.isSelectionAlertClosed());
    }
}
