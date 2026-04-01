package com.example.utils;

import com.example.config.SeleniumConfig;

public class EnvUtils {
    public static String getProperty(String key, String defaultValue) {
        // First try system property, then config file
        String value = System.getProperty(key);
        if (value == null) {
            value = System.getenv(key);
        }
        if (value == null) {
            value = SeleniumConfig.getProperty(key, defaultValue);
        }
        return value;
    }
}
