# MCP Setup

This Python Selenium starter does not include a committed MCP config in the repo, but it works well with local MCP/browser tooling during test design and debugging.

## Best Use Cases

Use MCP here to:

- inspect the app before writing Selenium selectors
- walk a user journey and turn it into `agent_maps/*.json`
- debug whether a failure is in the application or in the automation

## Typical Workflow

1. Start the application under test.
2. Configure your preferred browser automation MCP server locally.
3. Explore the flow with MCP.
4. Encode the final automation in:
   - `src/pages/`
   - `tests/`
   - `agent_maps/`

## Project Commands

```bash
pip install -r requirements.txt
pytest tests/
python -c "from src.agents.test_generator_agent import TestGeneratorAgent; TestGeneratorAgent().execute('agent_maps/sample_agent_map.json')"
```

## Good Prompts

```text
Open the login page, inspect the fields and button selectors, and suggest the most stable Selenium locators for a page object.
```

```text
Walk the primary user journey and convert it into a JSON task map for this Python Selenium starter.
```

```text
Use the browser to reproduce a failing path, then summarize whether the fix belongs in a locator, a wait condition, or the app itself.
```

## Security Notes

- Keep local MCP settings uncommitted
- Do not store real credentials in task maps
- Prefer local environment variables for per-machine config
