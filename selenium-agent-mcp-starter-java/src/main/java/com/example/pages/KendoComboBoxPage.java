package com.example.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class KendoComboBoxPage extends BasePage {
    private final By pageHeading = By.xpath("//h1[contains(normalize-space(),'ComboBox')]");
    private final By hobbiesHeading = By.xpath("//*[contains(normalize-space(),'Hobbies')]");
    private final By favoriteSportLabel = By.xpath("//*[contains(normalize-space(),'Favourite sport')]");
    private final By addFavoriteSportText = By.xpath("//*[contains(normalize-space(),'Add your favourite sport')]");
    private final By cookieAcceptButton = By.id("onetrust-accept-btn-handler");

    private final By comboInput = By.cssSelector("span.k-combobox input");
    private final By openButton = By.cssSelector("span.k-combobox button");
    private final By visibleOptions = By.cssSelector("ul[id$='_listbox'] li");
    private final By noDataMessage = By.cssSelector(".k-no-data");

    public KendoComboBoxPage(WebDriver driver) {
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

    public boolean hasDemoContent() {
        return isVisible(hobbiesHeading)
                && isVisible(favoriteSportLabel)
                && isVisible(addFavoriteSportText);
    }

    public void openOptions() {
        jsClick(openButton);
    }

    public String selectFirstOptionAndReturnText() {
        List<WebElement> options = wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(visibleOptions));
        WebElement firstOption = options.get(0);
        String text = firstOption.getText().trim();
        firstOption.click();
        return text;
    }

    public String getSelectedValue() {
        return getAttribute(comboInput, "value");
    }

    public void typeFilterValue(String value) {
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(comboInput));
        input.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        input.sendKeys(value);
    }

    public boolean hasVisibleNoDataMessage() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(noDataMessage)).isDisplayed();
        } catch (TimeoutException expected) {
            return false;
        }
    }
}
