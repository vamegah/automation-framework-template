# Skills Guide

This repository includes `src/main/java/com/example/skills/` as the extension point for reusable Selenium helpers.

## Current State

The skills package is scaffolded, but the concrete automation today is centered on:

- page objects in `src/main/java/com/example/pages/`
- driver/config classes in `src/main/java/com/example/config/`
- the task-map execution logic in `TestGeneratorAgent`

That means the skills layer is available for growth, but it is not yet the dominant abstraction in this starter.

## What Should Be A Skill

Good candidates:

- reusable wait helpers
- common interaction wrappers
- generic navigation utilities
- cross-page assertions

## What Should Stay Out Of Skills

Page-specific workflows should remain in page objects.

Examples:

- Good skill: wait for a modal to become clickable
- Good page object method: log in as a user

## Guidance For Adding Skills

- Keep skills framework-level, not page-level
- Use clear method names that reveal intent
- Update this document when new skills are added so agents and contributors know what exists
