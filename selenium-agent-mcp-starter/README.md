# Selenium Agent MCP Starter

Selenium WebDriver starter built with TypeScript, Mocha, Page Object Model, and a task-map driven AI generator.

## What Is Included

- Selenium WebDriver setup for Chrome
- Mocha-based UI test example
- Page objects in `pages/`
- Reusable utilities in `utils/`
- Agent-driven flow generation from `agent-map.json`
- Coverage report generation for discovered task maps
- Enterprise governance toolkit for traceability, draft PR packaging, compliance data generation, and RCA

## Quickstart

```bash
npm install
npm run build
npm test
```

## Run The Agent Generator

The generator reads `agent-map.json`, creates generated specs under `tests/generated/`, writes `docs/generated-coverage.md`, and can execute the mapped Selenium actions.

Adapt the sample map to match your application before using it against a real site.

## Run The Enterprise Toolkit

```bash
npm run enterprise:run
npm run test:enterprise
```

## Project Structure

```text
ai/agents/           # Agent implementations
ai/skills/           # Skill documentation and references
pages/               # Page objects
tests/               # Mocha specs
utils/               # Shared utilities
agent-map.json       # Sample task map
docs/                # Documentation
enterprise/          # Enterprise governance modules
scripts/             # Verification and enterprise-agent entrypoints
```
