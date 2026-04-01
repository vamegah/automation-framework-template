# AGENTS.md

Instructions for AI agents working in this Cypress repository.

## Project Overview

This project is a Cypress + TypeScript starter for browser automation with a lightweight agent layer.
Agents read declarative task maps, generate Cypress specs, and can execute flows inside Cypress tests.

## Tech Stack

- Test framework: Cypress
- Language: TypeScript
- Package manager: npm
- Runtime helpers: `ts-node`, `dotenv`

## Project Structure

```text
cypress/e2e/                 # Cypress specs
cypress/support/agents/      # Agent contracts and implementations
cypress/support/pages/       # Page objects
cypress/support/skills/      # Custom Cypress commands
cypress/support/utils/       # Environment and JSON helpers
agent_maps/                  # Declarative task maps for the generator
docs/                        # Project documentation
scripts/                     # Local helper scripts, including agent runner
```

## Agent Responsibilities

The primary agent in this repo is `TestGeneratorAgent`.

An additional `EnterpriseAgent` now packages enterprise governance artifacts for review workflows.

It currently supports:

- Reading an agent map from `agent_maps/*.json`
- Executing flows in Cypress with `login`, `click`, `type`, `navigate`, `assertText`, `assertUrl`, and `screenshot`
- Generating Cypress specs into `cypress/e2e/generated/`
- Writing a lightweight coverage report to `docs/generated-coverage.md`
- Generating enterprise traceability artifacts, draft-PR plans, and governed script outputs into `docs/enterprise-output/`

## Authoring Guidance

### Selectors

Prefer selectors in this order:

1. Stable `data-*` hooks or explicit IDs
2. Semantic selectors that match real user-facing elements
3. Simple CSS selectors when there is no stronger contract

Avoid brittle selectors like chained descendant selectors or position-based selectors.

### Tests

- Keep tests independent
- Use `beforeEach` for navigation/setup when needed
- Do not rely on execution order
- Prefer assertions on visible behavior, URL changes, and expected text

### Page Objects

Use page objects in `cypress/support/pages/` for reusable flows:

```ts
const loginPage = new LoginPage();
loginPage.login('invalid', 'invalid');
loginPage.getErrorMessage().should('contain', 'Invalid username or password');
```

Avoid repeating raw selectors across multiple specs.

## Agent Map Conventions

Agent maps live in `agent_maps/` and describe tasks with ordered actions.

Supported action types:

- `login`
- `click`
- `type`
- `navigate`
- `assertText`
- `assertUrl`
- `screenshot`

Example:

```json
{
  "tasks": [
    {
      "name": "User Login",
      "url": "/login",
      "actions": [
        { "type": "login", "username": "invalid", "password": "invalid" },
        { "type": "assertText", "value": "Invalid username or password" }
      ]
    }
  ]
}
```

## Running Agents

Generate a spec from the sample map:

```bash
npm run agent:run
```

Generate from a different map:

```bash
npm run agent:run -- agent_maps/sample-agent-map.json
```

Run Cypress afterward:

```bash
npm test
```

## Collaboration Rules For AI Agents

- Prefer extending existing page objects and support commands over duplicating logic
- Keep generated tests readable enough for humans to maintain
- When changing the task schema, update `cypress/support/agents/base.agent.ts` and the docs together
- Do not silently change existing selectors unless the surrounding tests/pages are updated too
