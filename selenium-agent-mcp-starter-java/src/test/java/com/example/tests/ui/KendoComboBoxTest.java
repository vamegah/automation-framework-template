package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.KendoComboBoxPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class KendoComboBoxTest {
    private WebDriver driver;
    private KendoComboBoxPage comboBoxPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        comboBoxPage = new KendoComboBoxPage(driver);
        comboBoxPage.navigateTo("https://demos.telerik.com/kendo-ui/combobox/index");
        comboBoxPage.acceptCookiesIfPresent();
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testComboBoxDemoLoads() {
        assertTrue(comboBoxPage.getHeading().contains("ComboBox"));
        assertTrue(comboBoxPage.hasDemoContent());
        assertTrue(comboBoxPage.getCurrentUrl().contains("/combobox/index"));
    }

    @Test
    public void testComboBoxSelectsAVisibleOption() {
        comboBoxPage.openOptions();
        String selectedOption = comboBoxPage.selectFirstOptionAndReturnText();

        assertFalse(selectedOption.isBlank());
        assertTrue(comboBoxPage.getSelectedValue().contains(selectedOption));
    }

    @Test
    public void testComboBoxShowsNoDataStateForUnknownValue() {
        comboBoxPage.typeFilterValue("zzzz-not-a-real-sport");
        assertTrue(comboBoxPage.hasVisibleNoDataMessage());
    }
}
