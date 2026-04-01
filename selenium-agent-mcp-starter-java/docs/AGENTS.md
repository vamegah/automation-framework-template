# AGENTS.md

Instructions for AI agents working in this Selenium Java repository.

## Project Overview

This project is a Selenium + JUnit starter with:

- page objects in Java
- driver/config utilities
- JSON task maps
- an agent implementation that can generate tests and execute mapped flows

The main generator agent lives in `src/main/java/com/example/agents/TestGeneratorAgent.java`.

Enterprise governance packaging now lives in `src/main/java/com/example/enterprise/EnterpriseAgent.java`.

## Tech Stack

- Browser automation: Selenium Java
- Test framework: JUnit 5
- Build tool: Maven
- JSON parsing: Jackson

## Project Structure

```text
src/main/java/com/example/agents/     # Agent implementations
src/main/java/com/example/pages/      # Page objects
src/main/java/com/example/skills/     # Skill scaffolding
src/main/java/com/example/config/     # Driver and settings
src/main/resources/agent-maps/        # Declarative task maps
src/test/java/com/example/tests/      # Test suite
docs/                                 # Project documentation
```

## Agent Responsibilities

The current test generator agent:

1. Reads a JSON task map
2. Generates JUnit coverage into `src/test/java/com/example/tests/generated/`
3. Writes a coverage report into `docs/generated-coverage.md`
4. Executes the mapped browser actions with Selenium

The enterprise agent additionally writes traceability artifacts, draft-PR plans, and governed script outputs into `docs/enterprise-output/`.

Supported actions:

- `login`
- `click`
- `type`
- `navigate`
- `assertText`
- `assertUrl`
- `screenshot`

## Authoring Guidance

- Keep common workflows in page objects
- Keep locators readable and stable
- Avoid hiding test behavior behind overly abstract helpers
- Prefer assertions on visible behavior, text, and URL outcomes

## Collaboration Rules For AI Agents

- When task-map support changes, update the agent, sample JSON, and docs together
- Prefer maintainable generated tests over overly dynamic codegen
- Keep Java 11 compatibility in mind when editing support code
