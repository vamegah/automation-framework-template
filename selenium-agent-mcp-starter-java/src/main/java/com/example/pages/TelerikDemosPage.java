package com.example.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class TelerikDemosPage extends BasePage {
    private final By pageHeading = By.tagName("h1");
    private final By webTab = By.linkText("Web");
    private final By desktopTab = By.linkText("Desktop");
    private final By mobileTab = By.linkText("Mobile");
    private final By reportingTab = By.linkText("Reporting & Docs");
    private final By testingTab = By.linkText("Testing & Mocking");
    private final By debuggingTab = By.linkText("Debugging");
    private final By conversationalTab = By.linkText("Conversational UI");

    private final By webSection = By.xpath("//h2[normalize-space()='Web']");
    private final By desktopSection = By.xpath("//h2[normalize-space()='Desktop']");
    private final By mobileSection = By.xpath("//h2[normalize-space()='Mobile']");
    private final By reportingSection = By.xpath("//h2[contains(normalize-space(),'Reporting')]");
    private final By testingSection = By.xpath("//h2[contains(normalize-space(),'Testing')]");
    private final By debuggingSection = By.xpath("//h2[normalize-space()='Debugging']");
    private final By conversationalSection = By.xpath("//h2[normalize-space()='Conversational UI']");

    private final By jqueryDemosLink = By.linkText("Launch UI for jQuery demos");
    private final By angularDemosLink = By.linkText("Launch UI for Angular demos");
    private final By reactDemosLink = By.linkText("Launch KendoReact demos");
    private final By vueDemosLink = By.linkText("Launch UI for Vue demos");
    private final By blazorDemosLink = By.linkText("Launch Blazor demos");
    private final By aspNetCoreDemosLink = By.linkText("Launch ASP.NET Core demos");
    private final By aspNetMvcDemosLink = By.linkText("Launch ASP.NET MVC demos");
    private final By aspNetAjaxDemosLink = By.linkText("Launch ASP.NET AJAX demos");

    private final By mauiDesktopLink = By.linkText("Explore the .NET MAUI demos");
    private final By winUiDemosLink = By.linkText("Launch WinUI demos");
    private final By winFormsDemosLink = By.linkText("Download WinForms Demos");
    private final By wpfDemosLink = By.linkText("Launch WPF demos");
    private final By xamarinGooglePlayLink = By.xpath("//h2[normalize-space()='Mobile']/following::a[contains(@href,'play.google.com')][1]");

    private final By reportingDemosLink = By.linkText("Launch Reporting demos");
    private final By reportServerDemosLink = By.linkText("Launch Report Server demo");
    private final By documentProcessingDemosLink = By.linkText("Launch Document Processing demos");
    private final By testStudioSignupLink = By.linkText("Sign up now");
    private final By testingMeetupLink = By.linkText("Reserve your seat");
    private final By fiddlerCoreDemosLink = By.linkText("View FiddlerCore demos");

    private final By conversationalJqueryLink = By.linkText("Kendo UI for jQuery");
    private final By conversationalAngularLink = By.linkText("Kendo UI for Angular");
    private final By conversationalReactLink = By.linkText("KendoReact");
    private final By conversationalVueLink = By.linkText("Kendo UI for Vue");

    public TelerikDemosPage(WebDriver driver) {
        super(driver);
    }

    public String getHeading() {
        return getText(pageHeading);
    }

    public boolean hasJqueryDemosLink() {
        return isVisible(jqueryDemosLink);
    }

    public boolean hasTopCategoryTabs() {
        return isVisible(webTab)
                && isVisible(desktopTab)
                && isVisible(mobileTab)
                && isVisible(reportingTab)
                && isVisible(testingTab)
                && isVisible(debuggingTab)
                && isVisible(conversationalTab);
    }

    public boolean hasWebDemoLaunchLinks() {
        scrollIntoView(webSection);
        return isVisible(jqueryDemosLink)
                && isVisible(angularDemosLink)
                && isVisible(reactDemosLink)
                && isVisible(vueDemosLink)
                && isVisible(blazorDemosLink)
                && isVisible(aspNetCoreDemosLink)
                && isVisible(aspNetMvcDemosLink)
                && isVisible(aspNetAjaxDemosLink);
    }

    public boolean hasDesktopAndMobileDemoLinks() {
        scrollIntoView(desktopSection);
        boolean desktopVisible = isVisible(mauiDesktopLink)
                && isVisible(winUiDemosLink)
                && isVisible(winFormsDemosLink)
                && isVisible(wpfDemosLink);

        scrollIntoView(mobileSection);
        return desktopVisible && isVisible(xamarinGooglePlayLink);
    }

    public boolean hasReportingTestingAndDebuggingLinks() {
        scrollIntoView(reportingSection);
        boolean reportingVisible = isVisible(reportingDemosLink)
                && isVisible(reportServerDemosLink)
                && isVisible(documentProcessingDemosLink);

        scrollIntoView(testingSection);
        boolean testingVisible = isVisible(testStudioSignupLink)
                && isVisible(testingMeetupLink);

        scrollIntoView(debuggingSection);
        return reportingVisible && testingVisible && isVisible(fiddlerCoreDemosLink);
    }

    public boolean hasConversationalUiLinks() {
        scrollIntoView(conversationalSection);
        return isVisible(conversationalJqueryLink)
                && isVisible(conversationalAngularLink)
                && isVisible(conversationalReactLink)
                && isVisible(conversationalVueLink);
    }

    public String getJqueryDemosHref() {
        return getAttribute(jqueryDemosLink, "href");
    }

    public void openJqueryDemos() {
        scrollIntoView(webSection);
        click(jqueryDemosLink);
    }
}
