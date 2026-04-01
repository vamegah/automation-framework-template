# MCP Setup

This Selenium Java starter does not include a committed MCP config file, but MCP is still useful during design and debugging.

## Good MCP Use Cases

Use MCP to:

- inspect a live application before writing Java locators
- walk an end-to-end flow and turn it into an agent map
- reproduce browser failures outside the JUnit test loop

## Recommended Workflow

1. Run the application under test.
2. Configure a local browser-automation MCP server in your preferred tool.
3. Explore the app and capture the selectors/steps.
4. Encode them in:
   - `src/main/java/com/example/pages/`
   - `src/main/resources/agent-maps/`
   - or `src/test/java/com/example/tests/`

## Local Commands

```bash
mvn test
```

If you are using JVM properties for config, you can also run with overrides such as browser or headless settings through Maven or your IDE run configuration.

## Example Prompts

```text
Inspect the login page in the browser and suggest the most stable Selenium locators for a Java page object.
```

```text
Walk the user journey and convert it into the JSON structure used by src/main/resources/agent-maps/sample-agent-map.json.
```

```text
Reproduce the failing UI path in the browser and tell me whether the problem is timing, selector stability, or an application defect.
```

## Security Notes

- Keep local MCP config out of source control
- Do not commit credentials or internal endpoints into shared examples
- Prefer local system properties or local-only config for sensitive values
