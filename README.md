# Automation Framework Template

This repository is a multi-project automation workspace that collects five browser automation starters in one place:

- Cypress + TypeScript
- Playwright + TypeScript
- Selenium + TypeScript
- Selenium + Java
- Selenium + Python

It is designed as a practical template repo for QA automation, framework comparison, AI-assisted test generation, and enterprise-oriented testing workflows.

## Projects

| Project | Stack | Primary Focus |
|---|---|---|
| `cypress-agent-mcp-starter` | Cypress + TypeScript | UI, API, accessibility, enterprise agent workflows |
| `playwright-agent-startup` | Playwright + TypeScript | UI, API, controlled-target testing, enterprise workflows |
| `selenium-agent-mcp-starter` | Selenium WebDriver + TypeScript | UI, API, accessibility, enterprise workflows |
| `selenium-agent-mcp-starter-java` | Selenium WebDriver + Java | UI, API, widget/demo coverage, enterprise workflows |
| `selenium-agent-mcp-starter-python` | Selenium WebDriver + Python | UI, API, accessibility, enterprise workflows |

## Shared Capabilities

All starters in this repo include the same broad capability model:

- Generate test cases from requirements
- Generate automation script drafts
- Generate synthetic test data and seed artifacts
- Provide review-first self-healing recommendations
- Perform failure analysis and flaky-test quarantine recommendations
- Generate contract/schema validation artifacts
- Generate OWASP-style security cases
- Produce accessibility guidance and assertions
- Produce CI/CD optimization guidance
- Include live-capable adapter layers for Jira, Slack, Datadog, Splunk, CloudWatch, Vault, and AWS Secrets Manager

Important note:
- Live integrations are implemented as live-capable adapters, but they are not connected to real vendor accounts by default.
- Self-healing and CI/CD optimization are review-first by design. They recommend changes instead of silently mutating tests or pipelines.

## Test Coverage Included

Across the starters, the repo includes examples for:

- UI smoke and regression tests
- API tests
- Accessibility tests
- Security-focused tests
- Database/API workflow tests
- Enterprise-verification tests

External demo targets used in the repo include:

- `https://axibly.ai/demo`
- `https://demo.owasp-juice.shop`
- `https://services.odata.org/V2/Northwind/Northwind.svc`
- `https://api.slingacademy.com/v1/sample-data/products`

## Repo Structure

```text
.
|-- cypress-agent-mcp-starter/
|-- playwright-agent-startup/
|-- selenium-agent-mcp-starter/
|-- selenium-agent-mcp-starter-java/
|-- selenium-agent-mcp-starter-python/
`-- README.md
```

## Quick Start

### Cypress

```powershell
cd .\cypress-agent-mcp-starter
npm install
npm test
```

### Playwright

```powershell
cd .\playwright-agent-startup
npm install
npm test
```

### Selenium TypeScript

```powershell
cd .\selenium-agent-mcp-starter
npm install
npm test
```

### Selenium Java

```powershell
cd .\selenium-agent-mcp-starter-java
mvn test
```

### Selenium Python

```powershell
cd .\selenium-agent-mcp-starter-python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:PYTHONPATH='.'
pytest -q
```

## Accessibility Reports

The browser-first projects and Selenium starters include accessibility artifact generation and indexing.

Examples:

- Cypress: `npm run accessibility:index`
- Playwright: `npm run accessibility:index`
- Selenium TypeScript: `npm run accessibility:index`
- Selenium Python: `python scripts/aggregate_accessibility.py`

Generated accessibility reports are intentionally ignored from git so the repo stays source-only.

## Enterprise Verification

Each project includes an enterprise module set and a local verifier.

Examples:

- Cypress: `npm run test:enterprise`
- Playwright: `npm run test:enterprise`
- Selenium TypeScript: `npm run test:enterprise`
- Selenium Java: `mvn -Dtest=EnterpriseToolkitTest test`
- Selenium Python: `python scripts/verify_enterprise.py`

## Notes

- This repo is intentionally framework-diverse, so each project keeps its own local dependencies and conventions.
- Some tests target public demo systems and may vary if those third-party services change.
- Large local caches, reports, browser binaries, screenshots, and generated artifacts are excluded by git ignore rules at the repo root.

## License

See the project-level license files where present, especially in [playwright-agent-startup/LICENSE](/c:/Users/makvi/OneDrive/Desktop/boier%20plates/playwright-agent-startup/LICENSE).
