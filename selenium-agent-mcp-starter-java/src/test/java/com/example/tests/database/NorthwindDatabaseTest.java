package com.example.tests.database;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NorthwindDatabaseTest {
    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void northwindProductsEndpointSupportsExpandedCategoryAndSupplierJoins() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$top=2&$expand=Category,Supplier"))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode body = mapper.readTree(response.body());

        assertTrue(response.statusCode() == 200);
        assertTrue(body.path("d").isArray());
        assertTrue(body.path("d").size() > 0);
        assertTrue(body.path("d").get(0).path("ProductID").asInt() > 0);
        assertFalse(body.path("d").get(0).path("ProductName").asText("").isBlank());
        assertTrue(body.path("d").get(0).path("Category").path("CategoryID").asInt() > 0);
        assertFalse(body.path("d").get(0).path("Category").path("CategoryName").asText("").isBlank());
        assertTrue(body.path("d").get(0).path("Supplier").path("SupplierID").asInt() > 0);
        assertFalse(body.path("d").get(0).path("Supplier").path("CompanyName").asText("").isBlank());
    }

    @Test
    void northwindCategoryJoinsAndFilterQueriesReturnConsistentProductData() throws Exception {
        HttpRequest categoriesRequest = HttpRequest.newBuilder()
            .uri(URI.create("https://services.odata.org/V2/Northwind/Northwind.svc/Categories(1)?$format=json&$expand=Products"))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> categoriesResponse = client.send(categoriesRequest, HttpResponse.BodyHandlers.ofString());
        JsonNode categoriesBody = mapper.readTree(categoriesResponse.body());

        assertTrue(categoriesResponse.statusCode() == 200);
        assertFalse(categoriesBody.path("d").path("CategoryName").asText("").isBlank());
        assertTrue(categoriesBody.path("d").path("Products").path("results").size() > 0);
        assertTrue(categoriesBody.path("d").path("Products").path("results").get(0).path("CategoryID").asInt() ==
            categoriesBody.path("d").path("CategoryID").asInt());

        HttpRequest filteredRequest = HttpRequest.newBuilder()
            .uri(URI.create("https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$filter=Discontinued%20eq%20false&$top=3"))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> filteredResponse = client.send(filteredRequest, HttpResponse.BodyHandlers.ofString());
        JsonNode filteredBody = mapper.readTree(filteredResponse.body());

        assertTrue(filteredResponse.statusCode() == 200);
        assertTrue(filteredBody.path("d").size() > 0);
        for (JsonNode product : filteredBody.path("d")) {
            assertFalse(product.path("Discontinued").asBoolean(true));
            assertFalse(product.path("ProductName").asText("").isBlank());
        }
    }
}
