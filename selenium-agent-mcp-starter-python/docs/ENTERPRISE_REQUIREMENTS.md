# Enterprise Requirements

This repository includes a deterministic enterprise automation layer for governance-heavy AI workflows, plus live-capable integrations for AWS Secrets Manager, Vault, Jira, Slack, Datadog, Splunk, and CloudWatch.

## Implemented Capabilities

- Webhook ingestion for Jira, Azure DevOps, and Linear requirement payloads
- Optional live Jira issue fetch for requirement intake
- Traceability matrix generation that links each generated test case back to the source requirement ID
- Risk-based criticality scoring using acceptance-criteria breadth, business impact, and code-complexity inputs
- Draft pull request planning that keeps generated coverage in review until the QA lead approves it
- Script generation for Selenium Python and C# with page-object discovery from `src/pages`
- Secret placeholder insertion and live secret resolution through AWS Secrets Manager or Vault
- Review-bot checks for sleeps, hard-coded credentials, and inline locator usage
- Synthetic data generation, masking for SSN and credit-card-like fields, and SQL seed generation
- Failure analysis that correlates UI failures with live AUT log providers and can publish Slack alerts or Jira triage issues
- Flaky-test quarantine decisions after repeated retry-pass failures
- Self-healing locator recommendations with confidence scoring and reviewable patch guidance
- Contract/schema inference, validation, and contract-test artifact generation
- OWASP-style security case generation
- Accessibility finding analysis with remediation guidance and generated assertions
- CI/CD optimization with sharding and quarantine-aware workflow generation

## Running It

```powershell
$env:PYTHONPATH='.'
python scripts/verify_enterprise.py
python scripts/run_enterprise_agent.py
pytest -q tests/test_enterprise_live_integrations.py
```

Artifacts are written to `docs/enterprise-output/`.

## Live Setup

Secrets:
- `AWS_SECRET_INTEGRATION_ENABLED=true` with `AWS_REGION` and either `*_SECRET_REF` or `*_SECRET_ID`/`*_SECRET_FIELD`
- `VAULT_SECRET_INTEGRATION_ENABLED=true` with `VAULT_ADDR`, `VAULT_TOKEN`, and `vault://...` references or secret path fields

Delivery and governance:
- `JIRA_LIVE_INTEGRATION_ENABLED=true` with `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- `SLACK_LIVE_INTEGRATION_ENABLED=true` with `SLACK_WEBHOOK_URL`

Observability:
- `DATADOG_LIVE_INTEGRATION_ENABLED=true` with `DATADOG_API_KEY`, `DATADOG_APP_KEY`, `DATADOG_SITE`
- `SPLUNK_LIVE_INTEGRATION_ENABLED=true` with `SPLUNK_BASE_URL`, `SPLUNK_HEC_TOKEN`
- `CLOUDWATCH_LIVE_INTEGRATION_ENABLED=true` with valid AWS credentials and `AWS_REGION`

## Important Boundary

The repository now contains live-capable client implementations for these providers, but the automated verification in this repo still uses deterministic test doubles rather than hitting your real enterprise systems. That keeps the suite reviewable and safe until you provide real endpoints and credentials.

The self-healing and pipeline layers are intentionally review-first. They generate locator patch guidance, assertions, and workflow YAML for human approval rather than silently mutating source or CI state.
