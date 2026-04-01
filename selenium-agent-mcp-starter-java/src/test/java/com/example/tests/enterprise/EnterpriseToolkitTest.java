package com.example.tests.enterprise;

import com.example.enterprise.EnterpriseAgent;
import com.example.enterprise.EnterpriseAccessibilityAnalyzer;
import com.example.enterprise.EnterpriseCiCdOptimizer;
import com.example.enterprise.EnterpriseContractTesting;
import com.example.enterprise.EnterpriseDataGenerator;
import com.example.enterprise.EnterpriseFailureAnalyzer;
import com.example.enterprise.EnterpriseGovernanceService;
import com.example.enterprise.EnterpriseLiveIntegrations;
import com.example.enterprise.EnterpriseSecurityGenerator;
import com.example.enterprise.EnterpriseSelfHealing;
import com.example.enterprise.EnterpriseModels.AccessibilityFinding;
import com.example.enterprise.EnterpriseModels.CodeSignal;
import com.example.enterprise.EnterpriseModels.EnterpriseGenerationRequest;
import com.example.enterprise.EnterpriseModels.FlakyTestDecision;
import com.example.enterprise.EnterpriseModels.GeneratedScriptArtifact;
import com.example.enterprise.EnterpriseModels.LocatorCandidate;
import com.example.enterprise.EnterpriseModels.LogEntry;
import com.example.enterprise.EnterpriseModels.PipelineSuiteMetric;
import com.example.enterprise.EnterpriseModels.RequirementReference;
import com.example.enterprise.EnterpriseModels.ScriptGenerationRequest;
import com.example.enterprise.EnterpriseModels.SelfHealingRequest;
import com.example.enterprise.EnterpriseModels.SyntheticProfile;
import com.example.enterprise.EnterpriseModels.TestFailureEvidence;
import com.example.enterprise.EnterpriseModels.TestRunHistoryEntry;
import com.example.enterprise.EnterpriseScriptGenerator;
import com.example.enterprise.WebhookRequirementParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Paths;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EnterpriseToolkitTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void ingestsWebhookWorkItemsAndBuildsTraceability() throws Exception {
        WebhookRequirementParser parser = new WebhookRequirementParser();
        RequirementReference requirement = parser.parse("jira", mapper.readTree("{\n" +
            "  \"issue\": {\n" +
            "    \"key\": \"JIRA-1234\",\n" +
            "    \"fields\": {\n" +
            "      \"summary\": \"Customer can transfer funds\",\n" +
            "      \"description\": \"As a customer, I can transfer funds between internal accounts.\",\n" +
            "      \"acceptanceCriteria\": [\"Transfer succeeds for valid accounts\", \"Validation appears for insufficient funds\"],\n" +
            "      \"labels\": [\"payments\", \"critical\"],\n" +
            "      \"linkedRequirements\": [\"REQ-88\"]\n" +
            "    }\n" +
            "  },\n" +
            "  \"url\": \"https://jira.example.com/browse/JIRA-1234\"\n" +
            "}"));

        EnterpriseGovernanceService governanceService = new EnterpriseGovernanceService();
        CodeSignal signal = new CodeSignal();
        signal.filePath = "src/transfer.ts";
        signal.cyclomaticComplexity = 18;
        signal.churn = 6;
        signal.touchedDomains.add("payments");
        signal.touchedDomains.add("ledger");
        signal.touchedDomains.add("notifications");

        var generated = governanceService.generateGovernedTestCases(List.of(requirement), Map.of(requirement.id, List.of(signal)));
        var draftPlan = governanceService.planDraftPullRequest(generated.testCases, "qa-lead");

        assertEquals("JIRA-1234", requirement.id);
        assertEquals(1, generated.testCases.size());
        assertEquals("draft", generated.testCases.get(0).reviewState);
        assertEquals("JIRA-1234", generated.matrix.rows.get(0).requirementId);
        assertTrue(generated.matrix.rows.get(0).riskScore >= 65);
        assertTrue(draftPlan.isDraft);
        assertTrue(draftPlan.reviewers.contains("qa-lead"));
    }

    @Test
    void generatesScriptsThatReusePageObjectsAndKeepSecretsOutOfSource() throws Exception {
        EnterpriseScriptGenerator generator = new EnterpriseScriptGenerator();

        ScriptGenerationRequest tsRequest = new ScriptGenerationRequest();
        tsRequest.framework = "typescript-selenium";
        tsRequest.testName = "Transfer Funds Enterprise Flow";
        tsRequest.pageObjectHint = "login";
        tsRequest.scenario = List.of("navigate to login page", "submit credentials through page object");
        tsRequest.assertions = List.of("inventory is visible after login");
        tsRequest.secretKeys = List.of("API_KEY");
        tsRequest.secretProvider = "vault";

        ScriptGenerationRequest csRequest = new ScriptGenerationRequest();
        csRequest.framework = "csharp-dotnet";
        csRequest.testName = "Transfer Funds Enterprise Flow";
        csRequest.pageObjectHint = "login";
        csRequest.scenario = List.of("navigate to login page", "submit credentials through page object");
        csRequest.assertions = List.of("inventory is visible after login");
        csRequest.secretKeys = List.of("API_KEY");
        csRequest.secretProvider = "aws-secrets-manager";

        GeneratedScriptArtifact tsArtifact = generator.generate(Paths.get("").toAbsolutePath().toString(), tsRequest);
        GeneratedScriptArtifact csArtifact = generator.generate(Paths.get("").toAbsolutePath().toString(), csRequest);
        var findings = generator.reviewGeneratedCode("Thread.sleep(3000);\nString password = \"super-secret\";");

        assertFalse(tsArtifact.reusedPageObjects.isEmpty());
        assertTrue(tsArtifact.content.contains("LoginPage"));
        assertTrue(tsArtifact.content.contains("getVaultSecret(\"API_KEY\")"));
        assertTrue(csArtifact.content.contains("getAwsSecret(\"API_KEY\")"));
        assertEquals("getVaultSecret(\"API_KEY\")", tsArtifact.secretPlaceholders.get(0));
        assertEquals("getAwsSecret(\"API_KEY\")", csArtifact.secretPlaceholders.get(0));
        assertEquals(2, findings.size());
    }

    @Test
    void createsSyntheticDataMasksSensitiveFieldsAndEmitsSql() {
        EnterpriseDataGenerator generator = new EnterpriseDataGenerator();
        SyntheticProfile profile = new SyntheticProfile();
        profile.locale = "en-US";
        profile.firstNamePool = List.of("Amina", "Luis", "Robin");
        profile.lastNamePool = List.of("Stone", "Patel", "Kim");
        profile.emailDomain = "synthetic.example.test";
        profile.cities = List.of("Austin", "Dallas", "Chicago");
        profile.cardPrefixes = List.of("411111", "545454", "378282");

        List<Map<String, Object>> records = generator.generateSyntheticRecords(profile, 2);
        var maskingResult = generator.maskSensitiveFields(records.get(0));
        var seedScript = generator.buildSeedScript("customers", records.stream()
            .map(record -> generator.maskSensitiveFields(record).maskedRecord)
            .collect(Collectors.toList()));

        assertTrue(String.valueOf(records.get(0).get("email")).contains("synthetic.example.test"));
        assertTrue(maskingResult.maskedFields.contains("credit_card"));
        assertTrue(maskingResult.maskedFields.contains("ssn"));
        assertTrue(String.valueOf(maskingResult.maskedRecord.get("credit_card")).matches("\\*{4,}\\d{4}$"));
        assertTrue(seedScript.sql.contains("INSERT INTO customers"));
        assertTrue(seedScript.sql.contains("***-**-"));
    }

    @Test
    void correlatesLogsAndFlagsFlakyTests() {
        EnterpriseFailureAnalyzer analyzer = new EnterpriseFailureAnalyzer();

        TestFailureEvidence evidence = new TestFailureEvidence();
        evidence.testName = "checkout shows backend error";
        evidence.testError = "Expected order confirmation, saw 500 banner";
        evidence.videoPath = "artifacts/checkout.mp4";
        evidence.curlCommand = "curl -X POST https://shop.example.test/checkout -d '{\"amount\":125}'";
        evidence.service = "checkout-service";
        evidence.endpoint = "/checkout";
        evidence.requestId = "req-77";

        LogEntry testLog = new LogEntry();
        testLog.timestamp = "2026-03-24T10:00:00.000Z";
        testLog.source = "test";
        testLog.provider = "selenium";
        testLog.level = "error";
        testLog.message = "UI observed HTTP 500 from checkout-service";
        testLog.requestId = "req-77";
        testLog.endpoint = "/checkout";
        testLog.statusCode = 500;

        LogEntry autLog = new LogEntry();
        autLog.timestamp = "2026-03-24T10:00:00.500Z";
        autLog.source = "aut";
        autLog.provider = "datadog";
        autLog.level = "error";
        autLog.message = "checkout-service null pointer while persisting order";
        autLog.requestId = "req-77";
        autLog.endpoint = "/checkout";
        autLog.statusCode = 500;

        var report = analyzer.analyzeFailure(evidence, List.of(testLog, autLog));

        TestRunHistoryEntry first = new TestRunHistoryEntry();
        first.testName = "sort inventory";
        first.executedAt = "2026-03-21T10:00:00.000Z";
        first.failedInitially = true;
        first.passedOnRetry = true;

        TestRunHistoryEntry second = new TestRunHistoryEntry();
        second.testName = "sort inventory";
        second.executedAt = "2026-03-22T10:00:00.000Z";
        second.failedInitially = true;
        second.passedOnRetry = true;

        TestRunHistoryEntry third = new TestRunHistoryEntry();
        third.testName = "sort inventory";
        third.executedAt = "2026-03-24T10:00:00.000Z";
        third.failedInitially = true;
        third.passedOnRetry = true;

        var decisions = analyzer.detectFlakyTests(List.of(first, second, third), Instant.parse("2026-03-26T12:00:00.000Z"));

        assertTrue(report.likelyRootCause.contains("Server-side datadog error"));
        assertEquals(2, report.alertPayloads.size());
        assertTrue(report.alertPayloads.get(0).body.contains("curl -X POST"));
        assertTrue(decisions.get(0).shouldQuarantine);
        assertTrue(decisions.get(0).quarantineReason.contains("three times"));
    }

    @Test
    void enterpriseAgentWritesGovernedArtifacts() throws Exception {
        EnterpriseAgent agent = new EnterpriseAgent();
        EnterpriseGenerationRequest request = new EnterpriseGenerationRequest();

        RequirementReference requirement = new RequirementReference();
        requirement.id = "JIRA-1234";
        requirement.title = "Customer can transfer funds";
        requirement.description = "As a customer, I can transfer funds between internal accounts.";
        requirement.acceptanceCriteria = List.of("Transfer succeeds for valid accounts");
        requirement.linkedRequirements = List.of("REQ-88");
        requirement.source = "jira";
        requirement.labels = List.of("payments", "critical");
        requirement.businessImpact = "critical";
        request.requirements = List.of(requirement);

        CodeSignal signal = new CodeSignal();
        signal.filePath = "src/transfer.ts";
        signal.cyclomaticComplexity = 18;
        signal.churn = 6;
        signal.touchedDomains = List.of("payments", "ledger", "notifications");
        request.codeSignalsByRequirement = new LinkedHashMap<>();
        request.codeSignalsByRequirement.put("JIRA-1234", List.of(signal));
        request.reviewer = "qa-lead";

        ScriptGenerationRequest scriptRequest = new ScriptGenerationRequest();
        scriptRequest.framework = "typescript-selenium";
        scriptRequest.testName = "Transfer Funds Enterprise Flow";
        scriptRequest.pageObjectHint = "login";
        scriptRequest.scenario = List.of("navigate to login page", "submit credentials through page object");
        scriptRequest.assertions = List.of("inventory is visible after login");
        scriptRequest.secretKeys = List.of("API_KEY");
        scriptRequest.secretProvider = "vault";
        request.scriptRequest = scriptRequest;

        var result = agent.generate(request, Paths.get("").toAbsolutePath());

        assertTrue(result.draftPlan.isDraft);
        assertTrue(result.scriptArtifact.content.contains("Transfer Funds Enterprise Flow"));
    }

    @Test
    void liveIntegrationsSupportJiraSlackDatadogSplunkCloudWatchAndVault() throws Exception {
        EnterpriseLiveIntegrations.RequestExecutor executor = (method, url, headers, body) -> {
            if (url.contains("/rest/api/3/issue/JIRA-900")) {
                return "{\"key\":\"JIRA-900\"}";
            }
            if (url.contains("datadoghq")) {
                return "{\"data\":[{\"attributes\":{\"timestamp\":\"2026-04-01T00:00:00Z\",\"status\":\"error\",\"message\":\"dd error\"}}]}";
            }
            if (url.contains("/services/search/jobs/export")) {
                return "{\"result\":{\"timestamp\":\"2026-04-01T00:00:01Z\",\"level\":\"error\",\"message\":\"splunk error\"}}";
            }
            if (url.contains("/v1/secret/app")) {
                return "{\"data\":{\"data\":{\"password\":\"vault-secret\"}}}";
            }
            return "{\"ok\":true}";
        };
        EnterpriseLiveIntegrations.CliRunner cliRunner = command -> "{\"events\":[{\"timestamp\":1711929600000,\"message\":\"cloudwatch error\"}]}";

        var jira = new EnterpriseLiveIntegrations.JiraClient("https://jira.example.com", "qa@example.com", "token", executor);
        var slack = new EnterpriseLiveIntegrations.SlackClient("https://hooks.slack.example", executor);
        var datadog = new EnterpriseLiveIntegrations.DatadogLogsClient("api", "app", "datadoghq.com", executor);
        var splunk = new EnterpriseLiveIntegrations.SplunkClient("https://splunk.example.com", "token", executor);
        var cloudWatch = new EnterpriseLiveIntegrations.CloudWatchClient("us-east-1", cliRunner);
        var vault = new EnterpriseLiveIntegrations.VaultClient("https://vault.example.com", "token", executor);

        assertEquals("JIRA-900", jira.fetchIssue("JIRA-900").path("key").asText());
        assertFalse(slack.postMessage(Map.of("text", "hello")).isBlank());
        assertEquals("vault-secret", vault.resolveReference("vault://secret/app#password"));
        assertEquals(1, datadog.queryLogs("service:payments").size());
        assertEquals(1, splunk.search("search error").size());
        assertEquals(1, cloudWatch.filterLogEvents("/aws/app/demo", "ERROR").size());
    }

    @Test
    void suggestsStableSelfHealingLocatorPatches() {
        EnterpriseSelfHealing healing = new EnterpriseSelfHealing();
        SelfHealingRequest request = new SelfHealingRequest();
        request.failingLocator = "By.css(\".submit-btn\")";
        request.failureMessage = "strict mode violation: locator resolved to 2 elements";
        request.pageObjectPath = "src/main/java/com/example/pages/LoginPage.java";
        request.pageObjectSource = "return By.css(\".submit-btn\");";

        LocatorCandidate best = new LocatorCandidate();
        best.locator = "By.css(\"button[data-test='login-button']\")";
        best.strategy = "testid";
        best.attributes.put("name", "Log In");
        best.visible = true;
        best.stable = true;

        LocatorCandidate fallback = new LocatorCandidate();
        fallback.locator = ".submit-btn";
        fallback.strategy = "css";
        fallback.visible = true;
        fallback.stable = false;

        request.candidates = List.of(best, fallback);

        var result = healing.suggest(request);

        assertTrue(result.shouldHeal);
        assertTrue(result.healedLocator.contains("login-button"));
        assertTrue(result.confidence >= 70);
        assertTrue(result.patch.get(0).contains("LoginPage.java"));
    }

    @Test
    void infersSchemasValidatesPayloadsAndGeneratesContractArtifacts() {
        EnterpriseContractTesting contractTesting = new EnterpriseContractTesting();
        Map<String, Object> sample = new LinkedHashMap<>();
        sample.put("success", true);
        sample.put("products", List.of(new LinkedHashMap<>(Map.of(
            "id", 1,
            "name", "Sample Product",
            "price", 19.99
        ))));

        var schema = contractTesting.inferSchema(sample);
        var validResult = contractTesting.validate(sample, schema);
        var invalidResult = contractTesting.validate(
            new LinkedHashMap<>(Map.of("success", true, "products", List.of(new LinkedHashMap<>(Map.of("id", "bad-id"))))),
            schema
        );
        var artifact = contractTesting.generateArtifact("Products API", schema);

        assertEquals("object", schema.type);
        assertTrue(validResult.valid);
        assertFalse(invalidResult.valid);
        assertTrue(invalidResult.errors.stream().anyMatch(error -> error.contains("payload.products[0].id expected number")));
        assertEquals("products-api.contract.spec.java.txt", artifact.fileName);
    }

    @Test
    void generatesOwaspSecurityCases() throws Exception {
        RequirementReference requirement = new WebhookRequirementParser().parse("jira", mapper.readTree("{\n" +
            "  \"issue\": {\n" +
            "    \"key\": \"JIRA-4321\",\n" +
            "    \"fields\": {\n" +
            "      \"summary\": \"User can log in\",\n" +
            "      \"description\": \"As a user, I can log in with email and password.\",\n" +
            "      \"acceptanceCriteria\": [\"Valid credentials are accepted\", \"Invalid credentials are rejected\"],\n" +
            "      \"labels\": [\"auth\", \"critical\"],\n" +
            "      \"linkedRequirements\": []\n" +
            "    }\n" +
            "  }\n" +
            "}"));

        var cases = new EnterpriseSecurityGenerator().generateOwaspCases(requirement, "api");

        assertEquals(4, cases.size());
        assertTrue(cases.stream().anyMatch(testCase -> "sql-injection".equals(testCase.category)));
        assertTrue(cases.stream().anyMatch(testCase -> "xss".equals(testCase.category)));
        assertTrue(cases.stream().anyMatch(testCase -> "auth-bypass".equals(testCase.category)));
        assertTrue(cases.stream().anyMatch(testCase -> "input-validation".equals(testCase.category)));
    }

    @Test
    void turnsAccessibilityFindingsIntoGuidanceAndAssertions() {
        AccessibilityFinding label = new AccessibilityFinding();
        label.id = "a11y-1";
        label.impact = "critical";
        label.rule = "label";
        label.selector = "#email";
        label.message = "Form element must have labels";

        AccessibilityFinding imageAlt = new AccessibilityFinding();
        imageAlt.id = "a11y-2";
        imageAlt.impact = "serious";
        imageAlt.rule = "image-alt";
        imageAlt.selector = ".hero img";
        imageAlt.message = "Images must have alternate text";

        var artifact = new EnterpriseAccessibilityAnalyzer().analyze(List.of(label, imageAlt));

        assertTrue(artifact.summary.contains("2 accessibility finding(s)"));
        assertEquals(2, artifact.recommendations.size());
        assertTrue(artifact.assertions.stream().anyMatch(assertion -> assertion.contains("aria-label")));
        assertTrue(artifact.assertions.stream().anyMatch(assertion -> assertion.contains("\"alt\"")));
    }

    @Test
    void optimizesCiCdPlan() {
        PipelineSuiteMetric suiteOne = new PipelineSuiteMetric();
        suiteOne.name = "ui-chrome";
        suiteOne.averageDurationSeconds = 420;
        suiteOne.failureRate = 0.08;
        suiteOne.requiresSerial = false;

        PipelineSuiteMetric suiteTwo = new PipelineSuiteMetric();
        suiteTwo.name = "stateful-telerik";
        suiteTwo.averageDurationSeconds = 260;
        suiteTwo.failureRate = 0.12;
        suiteTwo.requiresSerial = true;

        FlakyTestDecision flaky = new FlakyTestDecision();
        flaky.testName = "grid selection";
        flaky.failureCountThisWeek = 3;
        flaky.shouldQuarantine = true;
        flaky.quarantineReason = "Failed three times before passing on retry.";

        var plan = new EnterpriseCiCdOptimizer().optimize(List.of(suiteOne, suiteTwo), List.of(flaky));

        assertEquals(1, plan.recommendedWorkers);
        assertEquals(1, plan.shardCount);
        assertTrue(plan.quarantinedTests.contains("grid selection"));
        assertTrue(plan.workflowYaml.contains("mvn test"));
    }
}
