# Skills Guide

This repository includes a `src/skills/` package as the home for reusable Selenium interaction helpers.

## Current State

The skills layer is scaffolded, but most concrete behavior today lives in:

- page objects in `src/pages/`
- driver configuration in `src/config/`
- the task execution logic in `src/agents/test_generator_agent.py`

That means `src/skills/` is the extension point, not yet the primary abstraction layer.

## What Belongs In A Skill

Skills should contain reusable, low-level interaction patterns such as:

- navigation helpers
- wait wrappers
- element interaction helpers
- common assertions that are too generic for a page object

## What Does Not Belong In A Skill

Do not put page-specific business flows in a generic skill.
Those belong in page objects.

Examples:

- Good skill: wait until element is clickable
- Good page object method: submit the login form

## Recommended Pattern

1. Keep low-level, reusable behavior in `src/skills/`
2. Compose those helpers inside page objects
3. Let the agent call page objects or simple task actions

## Guidance For Future Additions

When you add a real skill module:

- keep the API narrow and reusable
- document expected arguments and return values
- update this file with examples
