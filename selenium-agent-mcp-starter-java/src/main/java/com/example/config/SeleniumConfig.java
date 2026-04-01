package com.example.config;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Properties;

public class SeleniumConfig {
    private static Properties properties = new Properties();

    static {
        try (InputStream envInput = new FileInputStream(".env")) {
            properties.load(envInput);
        } catch (Exception ignored) {
            // Local .env is optional; fall back to application.properties and system env.
        }

        try (InputStream input = SeleniumConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }
}
