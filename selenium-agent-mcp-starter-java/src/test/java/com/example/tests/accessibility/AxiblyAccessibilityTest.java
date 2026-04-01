package com.example.tests.accessibility;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AxiblyAccessibilityTest {
    private final HttpClient client = HttpClient.newHttpClient();

    private int countMatches(String html, String regex) {
        Matcher matcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(html);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    @Test
    void accessibleDemoPassesStrongerAxeStyleAccessibilityHeuristics() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://axibly.ai/demo/accessible"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String html = response.body();

        assertEquals(200, response.statusCode());
        assertTrue(html.contains("Accessible Demo Page"));
        assertEquals(1, countMatches(html, "<h1\\b"));
        assertTrue(countMatches(html, "<label\\b") > 1);
        assertTrue(countMatches(html, "<label[^>]+for=") > 1);
        assertTrue(countMatches(html, "<img[^>]+alt=\"[^\"\\s][^\"]*\"") > 0);
        assertEquals(0, countMatches(html, ">\\s*click here\\s*<"));
        assertEquals(0, countMatches(html, "<img(?![^>]*alt=)|<img[^>]*alt=\"\""));
    }

    @Test
    void inaccessibleDemoExposesMultipleAxeStyleAccessibilityAntipatterns() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://axibly.ai/demo/inaccessible"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String html = response.body();

        assertEquals(200, response.statusCode());
        assertTrue(html.contains("Inaccessible Demo Page"));
        assertTrue(html.contains("Div used as button"));
        assertTrue(countMatches(html, "<label\\b") < 2);
        assertTrue(countMatches(html, ">\\s*click here\\s*<") > 0);
        assertTrue(countMatches(html, "<img(?![^>]*alt=)|<img[^>]*alt=\"\"") > 0);
        assertTrue(html.contains("Missing alt attribute") || html.contains("Empty alt on informative image"));
    }
}
