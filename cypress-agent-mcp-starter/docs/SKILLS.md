# Skills Guide

In this repository, "skills" are reusable Cypress commands and helpers that let tests and agents interact with the app in a consistent way.

## Where Skills Live

```text
cypress/support/skills/
```

They are registered through:

```text
cypress/support/index.ts
```

## Current Skills

### Navigation

File: `cypress/support/skills/navigation.skill.ts`

Registered command:

- `cy.navigateTo(url)`

Use it when you want a named navigation action instead of calling `cy.visit()` directly everywhere.

### Element Interaction

File: `cypress/support/skills/element-interaction.skill.ts`

Registered commands:

- `cy.safeClick(selector)`
- `cy.fillInput(selector, text)`

Use them for small wrappers around common visible-and-click or clear-and-type patterns.

## When To Add A Skill

Add a new skill when:

- the same command pattern appears in multiple specs
- an interaction needs a standard wait/assertion pattern
- you want agents to have a clearer vocabulary than raw Cypress commands

Do not add a skill for one-off behavior that belongs in a single spec or page object.

## Skills Vs Page Objects

Use a skill when the behavior is generic:

- clicking safely
- filling a field
- navigating to a route

Use a page object when the behavior is page-specific:

- logging in
- opening the profile editor
- submitting a checkout form

## Example

```ts
cy.navigateTo('/login');
cy.fillInput('#username', 'invalid');
cy.fillInput('#password', 'invalid');
cy.safeClick('button[type="submit"]');
cy.contains('Invalid username or password').should('be.visible');
```

## Guidance For AI Agents

- Prefer existing skills before inventing new custom commands
- If you add a skill, register it in `cypress/support/skills/index.ts`
- Keep command names short, explicit, and test-oriented
- Update this file when new skills are added
