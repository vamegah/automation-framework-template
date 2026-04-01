package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.RequirementReference;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

public class WebhookRequirementParser {
    public RequirementReference parse(String source, JsonNode payload) {
        switch (source) {
            case "jira":
                return parseJira(payload);
            case "azure-devops":
                return parseAzure(payload);
            default:
                return parseLinear(payload);
        }
    }

    private RequirementReference parseJira(JsonNode payload) {
        JsonNode issue = payload.path("issue");
        JsonNode fields = issue.path("fields");
        List<String> labels = readStringArray(fields.path("labels"));

        RequirementReference requirement = new RequirementReference();
        requirement.id = issue.path("key").asText("");
        requirement.title = fields.path("summary").asText("Untitled Jira Story");
        requirement.description = fields.path("description").asText("");
        requirement.acceptanceCriteria = ensureCriteria(fields.path("acceptanceCriteria"));
        requirement.linkedRequirements = readStringArray(fields.path("linkedRequirements"));
        requirement.source = "jira";
        requirement.url = payload.path("url").asText(null);
        requirement.labels = labels;
        requirement.businessImpact = parseBusinessImpact(labels, fields.path("businessImpact").asText(""));
        return requirement;
    }

    private RequirementReference parseAzure(JsonNode payload) {
        JsonNode resource = payload.path("resource");
        JsonNode fields = resource.path("fields");
        List<String> labels = splitTags(fields.path("System.Tags").asText(""));

        RequirementReference requirement = new RequirementReference();
        requirement.id = resource.path("id").asText("");
        requirement.title = fields.path("System.Title").asText("Untitled Azure Work Item");
        requirement.description = fields.path("System.Description").asText("");
        requirement.acceptanceCriteria = ensureCriteria(fields.path("Microsoft.VSTS.Common.AcceptanceCriteria"));
        requirement.linkedRequirements = readStringArray(resource.path("relations"));
        requirement.source = "azure-devops";
        requirement.url = resource.path("url").asText(null);
        requirement.labels = labels;
        requirement.businessImpact = parseBusinessImpact(labels, fields.path("Custom.BusinessImpact").asText(""));
        return requirement;
    }

    private RequirementReference parseLinear(JsonNode payload) {
        JsonNode issue = payload.path("data").path("issue");
        List<String> labels = new ArrayList<>();
        issue.path("labels").forEach(label -> labels.add(label.path("name").asText("")));

        RequirementReference requirement = new RequirementReference();
        requirement.id = issue.path("identifier").asText(issue.path("id").asText(""));
        requirement.title = issue.path("title").asText("Untitled Linear Issue");
        requirement.description = issue.path("description").asText("");
        requirement.acceptanceCriteria = ensureCriteria(issue.path("acceptanceCriteria"));
        requirement.linkedRequirements = readStringArray(issue.path("relatedIssueIds"));
        requirement.source = "linear";
        requirement.url = issue.path("url").asText(null);
        requirement.labels = labels;
        requirement.businessImpact = parseBusinessImpact(labels, issue.path("priorityLabel").asText(""));
        return requirement;
    }

    private List<String> ensureCriteria(JsonNode node) {
        List<String> values = readStringArray(node);
        if (!values.isEmpty()) {
            return values;
        }
        if (node.isTextual()) {
            List<String> criteria = new ArrayList<>();
            for (String item : node.asText("").split("\\r?\\n|;")) {
                String trimmed = item.trim();
                if (!trimmed.isEmpty()) {
                    criteria.add(trimmed);
                }
            }
            return criteria;
        }
        return new ArrayList<>();
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node == null || node.isMissingNode()) {
            return values;
        }
        node.forEach(item -> {
            String value = item.asText("").trim();
            if (!value.isEmpty()) {
                values.add(value);
            }
        });
        return values;
    }

    private List<String> splitTags(String rawTags) {
        List<String> values = new ArrayList<>();
        for (String item : rawTags.split(";")) {
            String trimmed = item.trim();
            if (!trimmed.isEmpty()) {
                values.add(trimmed);
            }
        }
        return values;
    }

    private String parseBusinessImpact(List<String> labels, String fallback) {
        List<String> signals = new ArrayList<>(labels);
        if (fallback != null && !fallback.isBlank()) {
            signals.add(fallback);
        }

        for (String signal : signals) {
            String normalized = signal.toLowerCase();
            if (normalized.contains("critical")) {
                return "critical";
            }
            if (normalized.contains("high")) {
                return "high";
            }
            if (normalized.contains("medium")) {
                return "medium";
            }
        }
        return "low";
    }
}
