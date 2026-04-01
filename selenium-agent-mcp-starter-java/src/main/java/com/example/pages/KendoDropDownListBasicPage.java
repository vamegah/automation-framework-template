package com.example.pages;

import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class KendoDropDownListBasicPage extends BasePage {
    private final By pageHeading = By.xpath("//h1[contains(normalize-space(),'DropDownList')]");
    private final By demoDescription = By.xpath("//p[contains(normalize-space(),'bind the DropDownList component')]");
    private final By cookieAcceptButton = By.id("onetrust-accept-btn-handler");

    private final By colorDropdown = By.cssSelector("span[aria-controls='color_listbox']");
    private final By sizeDropdown = By.cssSelector("span[aria-controls='size_listbox']");
    private final By orangeOption = By.xpath("//ul[@id='color_listbox']/li[normalize-space()='Orange']");
    private final By mediumOption = By.xpath("//ul[@id='size_listbox']/li[normalize-space()='M - 7 1/4\"']");
    private final By capPreview = By.id("cap");
    private final By getValueButton = By.id("get");

    public KendoDropDownListBasicPage(WebDriver driver) {
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

    public boolean hasDemoDescription() {
        return isVisible(demoDescription);
    }

    public void selectOrangeCapColor() {
        jsClick(colorDropdown);
        click(orangeOption);
    }

    public void selectMediumSize() {
        jsClick(sizeDropdown);
        click(mediumOption);
    }

    public boolean isOrangeCapPreviewVisible() {
        return getAttribute(capPreview, "class").contains("orange-cap");
    }

    public String submitSelectionAndReadAlert() {
        jsClick(getValueButton);
        Alert alert = wait.until(ExpectedConditions.alertIsPresent());
        String text = alert.getText();
        alert.accept();
        return text;
    }

    public boolean isSelectionAlertClosed() {
        try {
            wait.until(ExpectedConditions.alertIsPresent());
            return false;
        } catch (TimeoutException expected) {
            return true;
        }
    }
}
