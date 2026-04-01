package com.example.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class KendoDatePickerPage extends BasePage {
    private final By pageHeading = By.xpath("//h1[contains(normalize-space(),'DatePicker')]");
    private final By visitHeading = By.xpath("//*[contains(normalize-space(),'Schedule Your Visit')]");
    private final By appointmentLabel = By.xpath("//*[contains(normalize-space(),'Select Appointment Date')]");
    private final By cookieAcceptButton = By.id("onetrust-accept-btn-handler");

    private final By datePickerInput = By.cssSelector("span.k-datepicker input");
    private final By openCalendarButton = By.cssSelector("span.k-datepicker button");
    private final By visibleCalendar = By.cssSelector("div.k-calendar");

    public KendoDatePickerPage(WebDriver driver) {
        super(driver);
    }

    public void acceptCookiesIfPresent() {
        try {
            if (isVisible(cookieAcceptButton)) {
                jsClick(cookieAcceptButton);
            }
        } catch (Exception ignored) {
            // Cookie banner is optional on repeat visits.
        }
    }

    public String getHeading() {
        return getText(pageHeading);
    }

    public boolean hasVisitDemoContent() {
        return isVisible(visitHeading) && isVisible(appointmentLabel);
    }

    public void enterAppointmentDate(String value) {
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(datePickerInput));
        input.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        input.sendKeys(value);
        input.sendKeys(Keys.TAB);
    }

    public String getAppointmentDateValue() {
        return getAttribute(datePickerInput, "value");
    }

    public void openCalendarPopup() {
        jsClick(openCalendarButton);
    }

    public boolean isCalendarPopupVisible() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(visibleCalendar)).isDisplayed();
    }

    public boolean isCalendarPopupClosed() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(visibleCalendar));
            return false;
        } catch (TimeoutException expected) {
            return true;
        }
    }

    public void closeCalendarWithEscape() {
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(datePickerInput));
        input.sendKeys(Keys.ESCAPE);
    }
}
