package com.example.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class KendoGridSelectionPage extends BasePage {
    private final By pageHeading = By.xpath("//h1[contains(normalize-space(),'jQuery Grid Selection')]");
    private final By rowSelectionHeading = By.xpath("//*[contains(normalize-space(),'Grid with multiple row selection enabled')]");
    private final By cellSelectionHeading = By.xpath("//*[contains(normalize-space(),'Grid with multiple cell selection enabled')]");
    private final By firstRow = By.xpath("(//div[contains(@class,'k-grid')])[1]//tbody/tr[1]");
    private final By secondRow = By.xpath("(//div[contains(@class,'k-grid')])[1]//tbody/tr[2]");
    private final By firstCell = By.xpath("(//div[contains(@class,'k-grid')])[2]//tbody/tr[1]/td[1]");
    private final By secondCell = By.xpath("(//div[contains(@class,'k-grid')])[2]//tbody/tr[1]/td[2]");
    private final By cookieAcceptButton = By.id("onetrust-accept-btn-handler");

    public KendoGridSelectionPage(WebDriver driver) {
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

    public boolean hasSelectionSections() {
        return isVisible(rowSelectionHeading) && isVisible(cellSelectionHeading);
    }

    public void selectFirstRow() {
        jsClick(firstRow);
    }

    public void selectSecondRow() {
        jsClick(secondRow);
    }

    public boolean isFirstRowSelected() {
        return getAttribute(firstRow, "class").contains("k-selected");
    }

    public boolean isSecondRowSelected() {
        return getAttribute(secondRow, "class").contains("k-selected");
    }

    public void selectFirstCell() {
        jsClick(firstCell);
    }

    public void selectSecondCell() {
        jsClick(secondCell);
    }

    public boolean isFirstCellSelected() {
        return getAttribute(firstCell, "class").contains("k-selected");
    }

    public boolean isSecondCellSelected() {
        return getAttribute(secondCell, "class").contains("k-selected");
    }
}
