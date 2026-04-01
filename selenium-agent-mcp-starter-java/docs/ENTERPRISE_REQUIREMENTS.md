# Enterprise Requirements Review

This document tracks how the Selenium Java starter implements the enterprise requirements requested for AI-assisted QA workflows.

## Status

Before this pass, the repository had a task-map generator and Selenium page objects, but it did not implement the full enterprise governance toolkit.

The implementation now lives under [`src/main/java/com/example/enterprise`](../src/main/java/com/example/enterprise) and is packaged through [`EnterpriseAgent`](../src/main/java/com/example/enterprise/EnterpriseAgent.java). Verification lives in [`EnterpriseToolkitTest.java`](../src/test/java/com/example/tests/enterprise/EnterpriseToolkitTest.java).

## Requirement Mapping

### 2.1 AI Test Case Generator

- Webhook ingestion for Jira, Azure DevOps, and Linear:
  - [`WebhookRequirementParser.java`](../src/main/java/com/example/enterprise/WebhookRequirementParser.java)
- Traceability matrix generation, risk scoring, and draft-PR planning:
  - [`EnterpriseGovernanceService.java`](../src/main/java/com/example/enterprise/EnterpriseGovernanceService.java)

### 2.2 AI Test Script Generator

- Framework support:
  - TypeScript Selenium and C# renderers in [`EnterpriseScriptGenerator.java`](../src/main/java/com/example/enterprise/EnterpriseScriptGenerator.java)
  - Python and Java remain supported targets conceptually until project-specific renderers are added
- Page object reuse:
  - Script generation scans [`src/main/java/com/example/pages`](../src/main/java/com/example/pages)
- Secrets management placeholders and review-bot checks:
  - [`EnterpriseScriptGenerator.java`](../src/main/java/com/example/enterprise/EnterpriseScriptGenerator.java)

### 2.3 AI Test Data Generator

- Synthetic data generation, masking, and SQL seed output:
  - [`EnterpriseDataGenerator.java`](../src/main/java/com/example/enterprise/EnterpriseDataGenerator.java)

### 2.4 AI Failure Analyzer

- AUT log correlation, Slack/Jira payload generation, and flaky-test quarantine decisions:
  - [`EnterpriseFailureAnalyzer.java`](../src/main/java/com/example/enterprise/EnterpriseFailureAnalyzer.java)

## Additional Capability Coverage

- Self-healing locator recommendations with confidence scoring and patch guidance:
  - [`EnterpriseSelfHealing.java`](../src/main/java/com/example/enterprise/EnterpriseSelfHealing.java)
- Contract/schema inference, validation, and contract test artifact generation:
  - [`EnterpriseContractTesting.java`](../src/main/java/com/example/enterprise/EnterpriseContractTesting.java)
- OWASP-oriented security case generation:
  - [`EnterpriseSecurityGenerator.java`](../src/main/java/com/example/enterprise/EnterpriseSecurityGenerator.java)
- Accessibility finding analysis with fix recommendations and generated Selenium assertions:
  - [`EnterpriseAccessibilityAnalyzer.java`](../src/main/java/com/example/enterprise/EnterpriseAccessibilityAnalyzer.java)
- CI/CD optimization with sharding and quarantine-aware workflow generation:
  - [`EnterpriseCiCdOptimizer.java`](../src/main/java/com/example/enterprise/EnterpriseCiCdOptimizer.java)

## Running It

```bash
mvn test
mvn -q -Dexec.mainClass=com.example.enterprise.EnterpriseAgentMain exec:java
```

## Live-Capable Integrations

- Jira issue fetch and issue creation
- Slack webhook alerts
- Datadog log queries
- Splunk log export queries
- CloudWatch log lookups through the AWS CLI
- Vault secret resolution

These adapters live in [`EnterpriseLiveIntegrations.java`](../src/main/java/com/example/enterprise/EnterpriseLiveIntegrations.java). The automated test suite uses injected doubles so the project stays safe to verify without your production credentials.

The self-healing and pipeline layers are intentionally review-first. They generate locator patch guidance, assertions, and workflow YAML for human approval rather than silently mutating source or CI state.
