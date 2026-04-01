package com.example.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class KendoJQueryDemosPage extends BasePage {
    private final By pageHeading = By.xpath("//h1[contains(normalize-space(),'Kendo UI for jQuery Examples')]");
    private final By popularElementsHeading = By.xpath("//h2[contains(normalize-space(),'Popular Kendo UI for jQuery Elements')]");
    private final By seeAllComponentsLink = By.linkText("See All Components");

    private final By newToKendoHeading = By.xpath("//h2[contains(normalize-space(),'New to Kendo UI for jQuery')]");
    private final By downloadTrialLink = By.linkText("Download Free Trial");
    private final By exploreAllHeading = By.xpath("//h2[contains(normalize-space(),'Explore All 120+')]");

    public KendoJQueryDemosPage(WebDriver driver) {
        super(driver);
    }

    public String getHeading() {
        return getText(pageHeading);
    }

    public boolean hasPopularElementsTabs() {
        return isVisible(popularElementsHeading);
    }

    public boolean hasComponentHighlights() {
        scrollIntoView(popularElementsHeading);
        return isVisible(seeAllComponentsLink);
    }

    public boolean hasAiHighlights() {
        String source = getPageSource();
        return source.contains("AI Components & Features")
                && source.contains("AI Tools")
                && source.contains("Sample Apps");
    }

    public boolean hasAiToolsAndSampleApps() {
        String source = getPageSource();
        return source.contains("AI Coding Assistant")
                && source.contains("E-shop Application");
    }

    public boolean hasExploreAllComponentLinks() {
        scrollIntoView(exploreAllHeading);
        return isVisible(exploreAllHeading);
    }

    public boolean hasTrialCta() {
        scrollIntoView(newToKendoHeading);
        return isVisible(downloadTrialLink);
    }

    public String getSeeAllComponentsHref() {
        return getAttribute(seeAllComponentsLink, "href");
    }
}
