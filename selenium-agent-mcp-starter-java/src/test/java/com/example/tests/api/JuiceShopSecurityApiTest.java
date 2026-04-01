package com.example.tests.api;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JuiceShopSecurityApiTest {
    private final HttpClient client = HttpClient.newHttpClient();
    private final String[] loginPayloads = {
        "' or 1=1 --",
        "admin'--",
        "' UNION SELECT * FROM Users --"
    };
    private final String[] searchPayloads = {
        "<script>alert(1)</script>",
        "../../etc/passwd",
        "' OR 1=1 --"
    };

    private void assertSafeBody(String body) {
        assertFalse(body.contains("authentication\":{\"token\""));
        assertFalse(body.contains("Sequelize"));
        assertFalse(body.contains("SQLITE"));
        assertFalse(body.contains("java.lang."));
        assertFalse(body.contains("stack trace"));
    }

    @Test
    void maliciousJuiceShopLoginPayloadsNeverSucceed() throws Exception {
        for (String email : loginPayloads) {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://demo.owasp-juice.shop/rest/user/login"))
                .header("Accept", "application/json, text/html")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"" + email + "\",\"password\":\"test\"}"))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            assertNotEquals(200, response.statusCode());
            assertTrue(response.statusCode() == 400 || response.statusCode() == 401 || response.statusCode() == 429 || response.statusCode() == 503);
            assertSafeBody(response.body());
        }
    }

    @Test
    void juiceShopSearchPayloadsDoNotExposeBackendInternals() throws Exception {
        for (String payload : searchPayloads) {
            String encodedPayload = java.net.URLEncoder.encode(payload, java.nio.charset.StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://demo.owasp-juice.shop/rest/products/search?q=" + encodedPayload))
                .header("Accept", "application/json, text/html")
                .GET()
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            assertTrue(response.statusCode() == 200 || response.statusCode() == 400 || response.statusCode() == 404 || response.statusCode() == 429 || response.statusCode() == 503);
            assertSafeBody(response.body());
        }
    }
}
