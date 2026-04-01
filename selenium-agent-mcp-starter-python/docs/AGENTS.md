# AGENTS.md

Instructions for AI agents working in this Selenium Python repository.

## Project Overview

This repository is a Python Selenium starter that combines:

- page objects
- Pytest fixtures
- utility modules
- JSON task maps for AI-oriented execution and generation
- enterprise governance and analysis services

The main automation entry points are `src/agents/test_generator_agent.py` and `src/agents/enterprise_agent.py`.

## Tech Stack

- Browser automation: Selenium
- Test framework: Pytest
- Language: Python
- Driver management: centralized in `src/config/driver_factory.py`

## Project Structure

```text
src/agents/            # Agent implementations
src/enterprise/        # Enterprise governance and analysis services
src/pages/             # Page objects
src/skills/            # Skill layer scaffold
src/config/            # Environment and driver setup
src/utils/             # Helpers and utility modules
tests/                 # Pytest suite
agent_maps/            # Declarative task maps
docs/                  # Documentation
```

## Agent Responsibilities

The test generator agent currently:

1. Reads an agent map JSON file
2. Generates Pytest coverage into `tests/generated/test_ai_generated.py`
3. Writes a coverage report to `docs/generated-coverage.md`
4. Executes the described browser actions with Selenium

Supported baseline actions:

- `login`
- `click`
- `type`
- `navigate`
- `assertText`
- `assertUrl`
- `screenshot`

The enterprise agent additionally:

1. Parses Jira, Azure DevOps, and Linear webhook payloads
2. Builds a traceability matrix tied to requirement IDs
3. Scores generated cases by criticality
4. Plans a draft PR for QA approval
5. Generates Selenium Python and C# starter scripts with secret placeholders
6. Produces masked seed data and SQL inserts
7. Correlates test failures with AUT logs and flags flaky tests

## Testing Guidance

- Prefer page object methods for reusable workflows
- Keep tests deterministic and independent
- Favor explicit Selenium waits over timing hacks
- Use task maps for repeatable generated flows, not for every single assertion in the suite

## Collaboration Rules For AI Agents

- Reuse `LoginPage` and other page objects before introducing raw Selenium calls
- If you add new action types to the task map, update the sample JSON and docs
- Keep generated tests human-readable so they can be promoted into hand-maintained coverage later
- Keep enterprise outputs deterministic so they can be reviewed like normal source artifacts
