package com.example.tests.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SlingAcademyProductsApiTest {
    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void productsEndpointReturnsValidCollection() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.slingacademy.com/v1/sample-data/products"))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode body = mapper.readTree(response.body());

        assertEquals(200, response.statusCode());
        assertTrue(response.headers().firstValue("content-type").orElse("").contains("application/json"));
        assertTrue(body.path("success").asBoolean());
        assertTrue(body.path("total_products").asInt() > 0);
        assertTrue(body.path("products").isArray());
        assertFalse(body.path("products").isEmpty());
        assertTrue(body.path("products").get(0).path("id").asInt() > 0);
        assertFalse(body.path("products").get(0).path("name").asText("").isBlank());
    }
}
