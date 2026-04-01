package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.LogEntry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class EnterpriseLiveIntegrations {
    private EnterpriseLiveIntegrations() {
    }

    @FunctionalInterface
    public interface RequestExecutor {
        String execute(String method, String url, Map<String, String> headers, String body) throws Exception;
    }

    @FunctionalInterface
    public interface CliRunner {
        String run(List<String> command) throws Exception;
    }

    public static class DefaultRequestExecutor implements RequestExecutor {
        private final HttpClient client = HttpClient.newHttpClient();

        @Override
        public String execute(String method, String url, Map<String, String> headers, String body) throws IOException, InterruptedException {
            HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(url));
            headers.forEach(builder::header);
            if ("POST".equalsIgnoreCase(method)) {
                builder.POST(HttpRequest.BodyPublishers.ofString(body == null ? "" : body));
            } else {
                builder.GET();
            }
            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IOException("HTTP " + response.statusCode());
            }
            return response.body();
        }
    }

    public static class JiraClient {
        private final String baseUrl;
        private final String email;
        private final String apiToken;
        private final RequestExecutor executor;
        private final ObjectMapper mapper = new ObjectMapper();

        public JiraClient(String baseUrl, String email, String apiToken, RequestExecutor executor) {
            this.baseUrl = baseUrl;
            this.email = email;
            this.apiToken = apiToken;
            this.executor = executor;
        }

        public JsonNode fetchIssue(String issueKey) throws Exception {
            return mapper.readTree(executor.execute("GET", baseUrl + "/rest/api/3/issue/" + issueKey, authHeaders(), null));
        }

        public JsonNode createIssue(Map<String, Object> fields) throws Exception {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("fields", fields);
            return mapper.readTree(executor.execute("POST", baseUrl + "/rest/api/3/issue", jsonHeaders(), mapper.writeValueAsString(payload)));
        }

        private Map<String, String> authHeaders() {
            Map<String, String> headers = new LinkedHashMap<>();
            headers.put("Authorization", "Basic " + Base64.getEncoder().encodeToString((email + ":" + apiToken).getBytes(StandardCharsets.UTF_8)));
            headers.put("Accept", "application/json");
            return headers;
        }

        private Map<String, String> jsonHeaders() {
            Map<String, String> headers = authHeaders();
            headers.put("Content-Type", "application/json");
            return headers;
        }
    }

    public static class SlackClient {
        private final String webhookUrl;
        private final RequestExecutor executor;
        private final ObjectMapper mapper = new ObjectMapper();

        public SlackClient(String webhookUrl, RequestExecutor executor) {
            this.webhookUrl = webhookUrl;
            this.executor = executor;
        }

        public String postMessage(Map<String, Object> payload) throws Exception {
            return executor.execute("POST", webhookUrl, Map.of("Content-Type", "application/json"), mapper.writeValueAsString(payload));
        }
    }

    public static class DatadogLogsClient {
        private final String apiKey;
        private final String appKey;
        private final String site;
        private final RequestExecutor executor;
        private final ObjectMapper mapper = new ObjectMapper();

        public DatadogLogsClient(String apiKey, String appKey, String site, RequestExecutor executor) {
            this.apiKey = apiKey;
            this.appKey = appKey;
            this.site = site;
            this.executor = executor;
        }

        public List<LogEntry> queryLogs(String query) throws Exception {
            Instant now = Instant.now();
            String body = mapper.writeValueAsString(Map.of(
                "filter", Map.of("query", query, "from", now.minusSeconds(900).toString(), "to", now.toString()),
                "sort", "timestamp",
                "page", Map.of("limit", 20)
            ));
            String raw = executor.execute("POST", "https://api." + site + "/api/v2/logs/events/search", Map.of(
                "Content-Type", "application/json",
                "DD-API-KEY", apiKey,
                "DD-APPLICATION-KEY", appKey
            ), body);
            JsonNode payload = mapper.readTree(raw).path("data");
            List<LogEntry> entries = new ArrayList<>();
            for (JsonNode item : payload) {
                JsonNode attributes = item.path("attributes");
                LogEntry entry = new LogEntry();
                entry.timestamp = attributes.path("timestamp").asText(Instant.now().toString());
                entry.source = "aut";
                entry.provider = "datadog";
                entry.level = attributes.path("status").asText("error");
                entry.message = attributes.path("message").asText("");
                entries.add(entry);
            }
            return entries;
        }
    }

    public static class SplunkClient {
        private final String baseUrl;
        private final String token;
        private final RequestExecutor executor;
        private final ObjectMapper mapper = new ObjectMapper();

        public SplunkClient(String baseUrl, String token, RequestExecutor executor) {
            this.baseUrl = baseUrl;
            this.token = token;
            this.executor = executor;
        }

        public List<LogEntry> search(String query) throws Exception {
            String body = "search=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&earliest_time=-15m&latest_time=now&output_mode=json";
            String raw = executor.execute("POST", baseUrl + "/services/search/jobs/export", Map.of(
                "Authorization", "Bearer " + token,
                "Content-Type", "application/x-www-form-urlencoded"
            ), body);
            List<LogEntry> entries = new ArrayList<>();
            for (String line : raw.split("\\R")) {
                if (line.isBlank()) {
                    continue;
                }
                JsonNode result = mapper.readTree(line).path("result");
                LogEntry entry = new LogEntry();
                entry.timestamp = result.path("timestamp").asText(Instant.now().toString());
                entry.source = "aut";
                entry.provider = "splunk";
                entry.level = result.path("level").asText("error");
                entry.message = result.path("message").asText("");
                entries.add(entry);
            }
            return entries;
        }
    }

    public static class CloudWatchClient {
        private final String region;
        private final CliRunner cliRunner;
        private final ObjectMapper mapper = new ObjectMapper();

        public CloudWatchClient(String region, CliRunner cliRunner) {
            this.region = region;
            this.cliRunner = cliRunner;
        }

        public List<LogEntry> filterLogEvents(String logGroupName, String filterPattern) throws Exception {
            List<String> command = new ArrayList<>(List.of("aws", "logs", "filter-log-events", "--region", region, "--log-group-name", logGroupName, "--output", "json"));
            if (filterPattern != null && !filterPattern.isBlank()) {
                command.add("--filter-pattern");
                command.add(filterPattern);
            }
            JsonNode events = mapper.readTree(cliRunner.run(command)).path("events");
            List<LogEntry> entries = new ArrayList<>();
            for (JsonNode event : events) {
                LogEntry entry = new LogEntry();
                entry.timestamp = Instant.ofEpochMilli(event.path("timestamp").asLong(System.currentTimeMillis())).toString();
                entry.source = "aut";
                entry.provider = "cloudwatch";
                entry.level = "error";
                entry.message = event.path("message").asText("");
                entries.add(entry);
            }
            return entries;
        }
    }

    public static class VaultClient {
        private final String baseUrl;
        private final String token;
        private final RequestExecutor executor;
        private final ObjectMapper mapper = new ObjectMapper();

        public VaultClient(String baseUrl, String token, RequestExecutor executor) {
            this.baseUrl = baseUrl;
            this.token = token;
            this.executor = executor;
        }

        public String resolveReference(String reference) throws Exception {
            if (!reference.startsWith("vault://")) {
                return reference;
            }
            String locator = reference.substring("vault://".length());
            String[] parts = locator.split("#", 2);
            String raw = executor.execute("GET", baseUrl + "/v1/" + parts[0], Map.of(
                "X-Vault-Token", token,
                "Accept", "application/json"
            ), null);
            JsonNode payload = mapper.readTree(raw).path("data");
            JsonNode data = payload.has("data") ? payload.path("data") : payload;
            if (parts.length == 1) {
                return data.toString();
            }
            JsonNode value = data.path(parts[1]);
            return value.isMissingNode() ? null : value.asText();
        }
    }
}
