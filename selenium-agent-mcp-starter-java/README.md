# Selenium Agent MCP Starter (Java)

Java Selenium starter with JUnit 5, page objects, JSON task maps, and an AI-oriented test generator.

## What Is Included

- Selenium WebDriver setup for Chrome and Firefox
- JUnit 5 UI test example
- Page Object Model support
- JSON task maps under `src/main/resources/agent-maps/`
- Generated JUnit coverage from the test generator agent
- Enterprise governance toolkit for traceability, draft PR packaging, compliance data generation, and RCA

## Quickstart

```bash
mvn test
```

## Agent Flow

`TestGeneratorAgent` reads a task map, generates tests in `src/test/java/com/example/tests/generated/`, writes a coverage report, and can execute the mapped Selenium actions.

## Enterprise Toolkit

```bash
mvn test
mvn -q -Dexec.mainClass=com.example.enterprise.EnterpriseAgentMain exec:java
```
