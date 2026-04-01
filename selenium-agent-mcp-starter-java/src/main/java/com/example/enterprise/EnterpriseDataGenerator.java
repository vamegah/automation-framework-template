package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.MaskingResult;
import com.example.enterprise.EnterpriseModels.SeedScript;
import com.example.enterprise.EnterpriseModels.SyntheticProfile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class EnterpriseDataGenerator {
    public List<Map<String, Object>> generateSyntheticRecords(SyntheticProfile profile, int count) {
        List<Map<String, Object>> records = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            Map<String, Object> record = new LinkedHashMap<>();
            String firstName = pick(profile.firstNamePool, index);
            String lastName = pick(profile.lastNamePool, index + 1);
            String city = pick(profile.cities, index + 2);
            String cardPrefix = pick(profile.cardPrefixes, index);
            int accountId = 10000 + index;

            record.put("customer_id", accountId);
            record.put("first_name", firstName);
            record.put("last_name", lastName);
            record.put("email", (firstName + "." + lastName + "." + accountId + "@" + profile.emailDomain).toLowerCase());
            record.put("city", city);
            record.put("credit_card", (cardPrefix + String.format("%012d", 100000000000L + index)).substring(0, 16));
            record.put("ssn", "999-55-" + String.format("%04d", 1000 + index).substring(0, 4));
            record.put("marketing_opt_in", index % 2 == 0);
            record.put("locale", profile.locale);
            records.add(record);
        }
        return records;
    }

    public MaskingResult maskSensitiveFields(Map<String, Object> record) {
        MaskingResult result = new MaskingResult();

        for (Map.Entry<String, Object> entry : record.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value instanceof String) {
                String stringValue = (String) value;
                if (stringValue.matches(".*\\b\\d{3}-\\d{2}-\\d{4}\\b.*") || key.toLowerCase().contains("ssn")) {
                    result.maskedRecord.put(key, "***-**-" + stringValue.substring(stringValue.length() - 4));
                    result.maskedFields.add(key);
                    continue;
                }

                String digits = stringValue.replaceAll("\\D", "");
                if ((key.toLowerCase().contains("credit") || key.toLowerCase().contains("card") || digits.matches("\\d{15,16}")) && digits.length() >= 12) {
                    result.maskedRecord.put(key, "*".repeat(Math.max(0, digits.length() - 4)) + digits.substring(digits.length() - 4));
                    result.maskedFields.add(key);
                    continue;
                }
            }
            result.maskedRecord.put(key, value);
        }

        return result;
    }

    public SeedScript buildSeedScript(String tableName, List<Map<String, Object>> records) {
        SeedScript seedScript = new SeedScript();
        seedScript.tableName = tableName;
        if (records.isEmpty()) {
            seedScript.sql = "";
            return seedScript;
        }

        List<String> columns = new ArrayList<>(records.get(0).keySet());
        List<String> values = new ArrayList<>();
        for (Map<String, Object> record : records) {
            List<String> rowValues = new ArrayList<>();
            for (String column : columns) {
                rowValues.add(sqlValue(record.get(column)));
            }
            values.add("(" + String.join(", ", rowValues) + ")");
        }

        seedScript.sql = "INSERT INTO " + tableName + " (" + String.join(", ", columns) + ")\nVALUES\n" + String.join(",\n", values) + ";";
        return seedScript;
    }

    private String pick(List<String> values, int index) {
        return values.get(index % values.size());
    }

    private String sqlValue(Object value) {
        if (value == null) {
            return "NULL";
        }
        if (value instanceof Boolean) {
            return Boolean.TRUE.equals(value) ? "TRUE" : "FALSE";
        }
        if (value instanceof Number) {
            return String.valueOf(value);
        }
        return "'" + String.valueOf(value).replace("'", "''") + "'";
    }
}
