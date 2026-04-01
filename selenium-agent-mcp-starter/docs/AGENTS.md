# AGENTS.md

Instructions for AI agents working in this Selenium TypeScript repository.

## Project Overview

This project is a Selenium WebDriver starter written in TypeScript.
It includes page objects, Mocha-based tests, and a simple AI-oriented generator that reads task maps and produces generated specs plus coverage notes.

## Tech Stack

- Test framework: Mocha
- Browser automation: Selenium WebDriver
- Language: TypeScript
- Package manager: npm

## Project Structure

```text
ai/agents/              # Agent implementations
ai/skills/              # Prompt-oriented skill scaffolding
pages/                  # Selenium page objects
tests/                  # Mocha specs
utils/                  # Shared helpers
agent-map.json          # Sample declarative journey map
docs/                   # Project documentation
```

## Primary Agent

`ai/agents/test-generator.ts` is the main generator implementation.

`ai/agents/enterprise-agent.ts` packages governed artifacts for enterprise review workflows.

It currently does four things:

1. Reads a task map
2. Generates a spec into `tests/generated/`
3. Writes a coverage report into `docs/generated-coverage.md`
4. Executes the task actions with Selenium

The enterprise agent additionally writes traceability artifacts, draft-PR plans, and governed script outputs into `docs/enterprise-output/`.

Supported action types:

- `login`
- `click`
- `type`
- `navigate`
- `assertText`
- `assertUrl`
- `screenshot`

## Test Conventions

- Keep selectors stable and readable
- Prefer page object methods for reusable workflows
- Avoid hard-coded sleeps; wait through Selenium conditions or page-object wrappers
- Keep specs small and focused on one user behavior

## Page Object Guidance

Use `pages/base.page.ts` as the low-level interaction layer and keep business flows in page-specific classes.

Good:

```ts
await loginPage.login('invalid', 'invalid');
```

Less good:

```ts
await driver.findElement(By.id('username')).sendKeys('invalid');
```

## Agent Map Guidance

The checked-in `agent-map.json` is both an example and a contract.
If you expand the supported task schema, update:

- the agent implementation
- the sample JSON
- this document

## Collaboration Rules For AI Agents

- Do not bypass existing page objects unless the action is intentionally generic
- Prefer generated tests that are maintainable by a human reviewer
- Keep docs and sample maps aligned with the code
