# Enterprise Requirements Review

This document tracks how the Selenium TypeScript starter implements the enterprise requirements requested for AI-assisted QA workflows.

## Status

Before this pass, the repository had a task-map generator and Selenium page objects, but it did not implement the enterprise governance workflows themselves.

The implementation now lives under [`enterprise/`](../enterprise) and is packaged through [`EnterpriseAgent`](../ai/agents/enterprise-agent.ts). Verification lives in [`scripts/verify-enterprise.ts`](../scripts/verify-enterprise.ts).

## Requirement Mapping

### 2.1 AI Test Case Generator

- Webhook ingestion for Jira, Azure DevOps, and Linear:
  - [`enterprise/connectors.ts`](../enterprise/connectors.ts)
- Traceability matrix generation:
  - [`enterprise/test-case-generator.ts`](../enterprise/test-case-generator.ts)
- Risk-based scoring from code complexity and business impact:
  - [`enterprise/test-case-generator.ts`](../enterprise/test-case-generator.ts)
- Draft-PR review workflow instead of auto-commit:
  - [`enterprise/test-case-generator.ts`](../enterprise/test-case-generator.ts)

### 2.2 AI Test Script Generator

- Framework support:
  - TypeScript Selenium and C# renderers in [`enterprise/script-generator.ts`](../enterprise/script-generator.ts)
  - Python and Java are represented as supported targets with a stub path for project-specific renderers
- Page object reuse:
  - Script generation scans [`pages/`](../pages) and reuses matching page object classes and methods
- Secrets management placeholders:
  - Vault and AWS Secrets Manager placeholder generation in [`enterprise/script-generator.ts`](../enterprise/script-generator.ts)
- Code review bot rules:
  - Hard-wait and hard-coded-secret detection in [`enterprise/script-generator.ts`](../enterprise/script-generator.ts)

### 2.3 AI Test Data Generator

- Synthetic data generation:
  - [`enterprise/test-data-generator.ts`](../enterprise/test-data-generator.ts)
- SQL seed script output:
  - [`enterprise/test-data-generator.ts`](../enterprise/test-data-generator.ts)
- Sensitive-field masking:
  - [`enterprise/test-data-generator.ts`](../enterprise/test-data-generator.ts)

### 2.4 AI Failure Analyzer

- AUT log correlation across Datadog, Splunk, CloudWatch, and Selenium-style evidence:
  - [`enterprise/failure-analyzer.ts`](../enterprise/failure-analyzer.ts)
- Slack and Jira alert payload generation:
  - [`enterprise/failure-analyzer.ts`](../enterprise/failure-analyzer.ts)
- Flaky-test detection and quarantine decisions:
  - [`enterprise/failure-analyzer.ts`](../enterprise/failure-analyzer.ts)

## Additional Capability Coverage

- Self-healing locator recommendations with confidence scoring and patch guidance:
  - [`enterprise/self-healing.ts`](../enterprise/self-healing.ts)
- Contract/schema inference, validation, and contract test artifact generation:
  - [`enterprise/contract-testing.ts`](../enterprise/contract-testing.ts)
- OWASP-oriented security case generation:
  - [`enterprise/security-generator.ts`](../enterprise/security-generator.ts)
- Accessibility finding analysis with fix recommendations and generated Selenium assertions:
  - [`enterprise/accessibility-integration.ts`](../enterprise/accessibility-integration.ts)
- CI/CD optimization with sharding and quarantine-aware workflow generation:
  - [`enterprise/cicd-optimizer.ts`](../enterprise/cicd-optimizer.ts)

## Running It

```bash
npm run enterprise:run
npm run test:enterprise
```

## Live-Capable Integrations

- Jira issue fetch and issue creation
- Slack webhook alerts
- Datadog log queries
- Splunk log export queries
- CloudWatch log lookups through the AWS CLI
- Vault secret resolution

These adapters are implemented in [`enterprise/live-integrations.ts`](../enterprise/live-integrations.ts) and are enabled through the environment variables documented in [`.env.example`](../.env.example).

## Current Boundary

The automated verification in this repo still uses deterministic test doubles instead of your real enterprise endpoints, so the suite stays safe and reviewable until you provide live credentials and URLs.

The self-healing and pipeline layers are intentionally review-first. They generate locator patch guidance, assertions, and workflow YAML for human approval rather than silently mutating source or CI state.
