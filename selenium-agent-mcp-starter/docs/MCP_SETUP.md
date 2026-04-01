# MCP Setup

This Selenium TypeScript starter does not currently include a committed MCP configuration file.
The intended setup is local and optional.

## What MCP Helps With In This Repo

MCP is useful here for:

- exploring a live application in a browser
- discovering selectors before encoding them into page objects
- reproducing Selenium failures interactively
- helping author `agent-map.json` task definitions

## Practical Workflow

1. Start the application under test.
2. Configure your preferred browser automation MCP server locally.
3. Use MCP to walk the flow you want to automate.
4. Capture that flow in:
   - `pages/*.page.ts`
   - `tests/*.spec.ts`
   - or `agent-map.json`

## Local Commands

```bash
npm install
npm run build
npm test
```

## Suggested Agent Prompts

```text
Explore the login flow in the browser and summarize it as Selenium-friendly selectors and steps.
```

```text
Navigate the application and tell me which flows should become page object methods versus generated task-map actions.
```

```text
Use the browser to reproduce a failing Selenium path, then tell me whether the issue is selector stability, timing, or application behavior.
```

## Security Notes

- Keep local MCP config files out of version control
- Put credentials in environment or local config, not in checked-in test maps
- Avoid storing internal URLs in committed examples
