package com.example.enterprise;

import com.example.enterprise.EnterpriseModels.RequirementReference;
import com.example.enterprise.EnterpriseModels.SecurityTestCase;

import java.util.List;

public class EnterpriseSecurityGenerator {
    public List<SecurityTestCase> generateOwaspCases(RequirementReference requirement, String surface) {
        String prefix = requirement.id.replaceAll("[^A-Za-z0-9]+", "-");
        String loginTarget = "api".equalsIgnoreCase(surface) ? "login API" : "login form";

        return List.of(
            buildCase(prefix + "-SEC-1", requirement.id + " rejects SQL injection in the " + loginTarget, "sql-injection", "critical",
                List.of("Submit the " + loginTarget + " with username \"' OR '1'='1\" and a dummy password.", "Observe the authentication response and any backend error handling."),
                List.of("Authentication is rejected with a safe validation or authorization error.", "No SQL error details are exposed to the user.")),
            buildCase(prefix + "-SEC-2", requirement.id + " neutralizes reflected XSS payloads", "xss", "high",
                List.of("Submit a payload like <script>alert(1)</script> into a user-controlled field.", "Navigate to the confirmation or error view that re-renders the value."),
                List.of("Payload is encoded or rejected.", "No script execution occurs in the browser.")),
            buildCase(prefix + "-SEC-3", requirement.id + " prevents authentication bypass with missing or tampered tokens", "auth-bypass", "critical",
                List.of("Replay the protected request without the expected auth token or session cookie.", "Repeat with a tampered token value."),
                List.of("Access is denied consistently.", "The system does not treat malformed tokens as authenticated.")),
            buildCase(prefix + "-SEC-4", requirement.id + " validates oversized and special-character input safely", "input-validation", "high",
                List.of("Submit extremely long strings, Unicode control characters, and special characters in user inputs.", "Observe validation and server responses."),
                List.of("Validation remains stable and user-friendly.", "The application does not return a 500-level error."))
        );
    }

    private SecurityTestCase buildCase(String id, String title, String category, String severity, List<String> steps, List<String> expectedResults) {
        SecurityTestCase testCase = new SecurityTestCase();
        testCase.id = id;
        testCase.title = title;
        testCase.category = category;
        testCase.severity = severity;
        testCase.preconditions = List.of("Target endpoint or page is reachable in a non-production environment.");
        testCase.steps = steps;
        testCase.expectedResults = expectedResults;
        return testCase;
    }
}
