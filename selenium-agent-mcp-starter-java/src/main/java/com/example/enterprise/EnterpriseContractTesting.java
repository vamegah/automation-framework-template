package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.ContractTestArtifact;
import com.example.enterprise.EnterpriseModels.ContractValidationResult;
import com.example.enterprise.EnterpriseModels.JsonContractSchema;
import com.example.enterprise.EnterpriseModels.JsonSchemaProperty;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EnterpriseContractTesting {
    public JsonContractSchema inferSchema(Object sample) {
        JsonContractSchema schema = new JsonContractSchema();
        if (sample instanceof List<?>) {
            List<?> list = (List<?>) sample;
            schema.type = "array";
            schema.items = list.isEmpty() ? nullType() : inferProperty(list.get(0));
            return schema;
        }

        schema.type = "object";
        Map<String, Object> record = castMap(sample);
        for (Map.Entry<String, Object> entry : record.entrySet()) {
            schema.properties.put(entry.getKey(), inferProperty(entry.getValue()));
            schema.required.add(entry.getKey());
        }
        return schema;
    }

    public ContractValidationResult validate(Object payload, JsonContractSchema schema) {
        ContractValidationResult result = new ContractValidationResult();
        List<String> errors = result.errors;

        if ("array".equals(schema.type)) {
            if (!(payload instanceof List<?>)) {
                errors.add("payload expected array");
            } else {
                List<?> list = (List<?>) payload;
                if (schema.items != null && !list.isEmpty()) {
                    validateProperty("payload[0]", schema.items, list.get(0), errors);
                }
            }
            result.valid = errors.isEmpty();
            return result;
        }

        if (!(payload instanceof Map<?, ?>)) {
            errors.add("payload expected object");
            result.valid = false;
            return result;
        }

        Map<String, Object> record = castMap(payload);
        for (String key : schema.required) {
            if (!record.containsKey(key)) {
                errors.add("payload." + key + " is required");
            }
        }

        for (Map.Entry<String, JsonSchemaProperty> entry : schema.properties.entrySet()) {
            validateProperty("payload." + entry.getKey(), entry.getValue(), record.get(entry.getKey()), errors);
        }

        result.valid = errors.isEmpty();
        return result;
    }

    public ContractTestArtifact generateArtifact(String endpointName, JsonContractSchema schema) {
        ContractTestArtifact artifact = new ContractTestArtifact();
        artifact.fileName = endpointName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "") + ".contract.spec.java.txt";
        artifact.content = String.join("\n",
            "// Contract test artifact for " + endpointName,
            "// Validate response payloads against the inferred schema before merging.",
            "schema.required = " + schema.required,
            "schema.type = " + schema.type
        );
        return artifact;
    }

    private JsonSchemaProperty inferProperty(Object value) {
        JsonSchemaProperty property = new JsonSchemaProperty();
        if (value instanceof List<?>) {
            List<?> list = (List<?>) value;
            property.type = "array";
            property.items = list.isEmpty() ? nullType() : inferProperty(list.get(0));
            return property;
        }
        if (value == null) {
            return nullType();
        }
        if (value instanceof String) {
            property.type = "string";
            return property;
        }
        if (value instanceof Number) {
            property.type = "number";
            return property;
        }
        if (value instanceof Boolean) {
            property.type = "boolean";
            return property;
        }
        property.type = "object";
        for (Map.Entry<String, Object> entry : castMap(value).entrySet()) {
            property.properties.put(entry.getKey(), inferProperty(entry.getValue()));
        }
        return property;
    }

    private void validateProperty(String path, JsonSchemaProperty schema, Object value, List<String> errors) {
        if ("null".equals(schema.type)) {
            if (value != null) {
                errors.add(path + " expected null");
            }
            return;
        }
        if ("array".equals(schema.type)) {
            if (!(value instanceof List<?>)) {
                errors.add(path + " expected array");
                return;
            }
            List<?> list = (List<?>) value;
            if (schema.items != null && !list.isEmpty()) {
                validateProperty(path + "[0]", schema.items, list.get(0), errors);
            }
            return;
        }
        if ("object".equals(schema.type)) {
            if (!(value instanceof Map<?, ?>)) {
                errors.add(path + " expected object");
                return;
            }
            Map<String, Object> record = castMap(value);
            for (Map.Entry<String, JsonSchemaProperty> entry : schema.properties.entrySet()) {
                validateProperty(path + "." + entry.getKey(), entry.getValue(), record.get(entry.getKey()), errors);
            }
            return;
        }

        if (value == null) {
            errors.add(path + " expected " + schema.type);
            return;
        }
        boolean typeMatches;
        if ("string".equals(schema.type)) {
            typeMatches = value instanceof String;
        } else if ("number".equals(schema.type)) {
            typeMatches = value instanceof Number;
        } else if ("boolean".equals(schema.type)) {
            typeMatches = value instanceof Boolean;
        } else {
            typeMatches = false;
        }
        if (!typeMatches) {
            errors.add(path + " expected " + schema.type);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        if (value instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) value;
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, item) -> result.put(String.valueOf(key), item));
            return result;
        }
        return new LinkedHashMap<>();
    }

    private JsonSchemaProperty nullType() {
        JsonSchemaProperty property = new JsonSchemaProperty();
        property.type = "null";
        return property;
    }
}
