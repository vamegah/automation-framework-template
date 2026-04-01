package com.example.tests.ui;

import com.example.config.DriverFactory;
import com.example.pages.KendoDatePickerPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class KendoDatePickerTest {
    private WebDriver driver;
    private KendoDatePickerPage datePickerPage;

    @BeforeEach
    public void setUp() {
        driver = DriverFactory.createDriver();
        datePickerPage = new KendoDatePickerPage(driver);
        datePickerPage.navigateTo("https://demos.telerik.com/kendo-ui/datepicker/index");
        datePickerPage.acceptCookiesIfPresent();
    }

    @AfterEach
    public void tearDown() {
        DriverFactory.quitDriver();
    }

    @Test
    public void testDatePickerDemoLoads() {
        assertTrue(datePickerPage.getHeading().contains("DatePicker"));
        assertTrue(datePickerPage.hasVisitDemoContent());
        assertTrue(datePickerPage.getCurrentUrl().contains("/datepicker/index"));
    }

    @Test
    public void testDatePickerAcceptsDateInputAndOpensCalendar() {
        datePickerPage.enterAppointmentDate("3/15/2026");
        assertTrue(datePickerPage.getAppointmentDateValue().contains("3/15/2026"));

        datePickerPage.openCalendarPopup();
        assertTrue(datePickerPage.isCalendarPopupVisible());
        assertTrue(datePickerPage.getAppointmentDateValue().contains("3/15/2026"));
    }
}
