package com.example.skills;

import org.openqa.selenium.WebDriver;

public class NavigationSkill {
    private final WebDriver driver;

    public NavigationSkill(WebDriver driver) {
        this.driver = driver;
    }

    public void open(String url) {
        driver.get(url);
    }

    public String currentUrl() {
        return driver.getCurrentUrl();
    }
}
