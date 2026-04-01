# MCP Setup

This Cypress starter does not currently ship a committed framework-specific MCP configuration file.
That is intentional: the project can be used with Claude Code or other agent tools through local file access, terminal commands, and optional browser-automation MCP servers that you configure for your own environment.

## What MCP Is Useful For Here

In this repository, MCP is most helpful for:

- Exploring the running application in a browser
- Inspecting the DOM to improve selectors
- Reproducing a failing Cypress flow manually
- Running local commands that generate or execute tests

## Recommended Workflow

1. Start the application under test.
2. Configure your preferred browser automation MCP server in your local tool.
3. Use MCP to inspect the app and discover selectors or flows.
4. Convert the discovered flow into:
   - a page object in `cypress/support/pages/`
   - a task map in `agent_maps/`
   - or a Cypress spec in `cypress/e2e/`

## Suggested Local Commands

Once your environment is ready, these are the main commands to run:

```bash
npm install
npm run cy:open
npm run cy:run
npm run agent:run
```

## Practical MCP Prompts

Examples you can use with Claude Code or a similar tool:

```text
Open the login page in the browser, inspect the form controls, and suggest the most stable selectors for Cypress.
```

```text
Navigate through the primary user flow and summarize the actions as a task map I can put in agent_maps/sample-agent-map.json.
```

```text
Reproduce the failing Cypress login flow in the browser, then tell me whether the failure is a selector issue, a timing issue, or an app bug.
```

## Mapping MCP Discoveries Back Into The Repo

Use the repo like this:

- New reusable commands go in `cypress/support/skills/`
- Repeated page behavior goes in `cypress/support/pages/`
- Declarative journeys go in `agent_maps/`
- Generated or hand-written specs live in `cypress/e2e/`

## Security Notes

- Keep any local MCP config uncommitted
- Do not place secrets in checked-in examples
- Prefer environment variables for base URLs and credentials

## Current Limitation

This project does not include a first-party Cypress MCP server definition in the repo itself.
If you want a shared team setup later, the next step would be adding a documented `.mcp.json.example` with safe placeholders only.
