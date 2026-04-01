# Selenium Agent Map Starter (Python)

A modular framework for AI-driven browser automation. Agents read declarative JSON agent maps and perform tasks using reusable Selenium skills and page objects.

## Setup

1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and adjust.
4. Run tests: `pytest tests/`
5. Build the accessibility index after accessibility runs: `python scripts/aggregate_accessibility.py`
5. Execute the baseline agent:
   `python -c "from src.agents.test_generator_agent import TestGeneratorAgent; TestGeneratorAgent().execute('agent_maps/sample_agent_map.json')"`
6. Verify the enterprise toolkit:
   `python scripts/verify_enterprise.py`

The starter can also resolve positive-path test credentials from AWS Secrets Manager or Vault, and the enterprise layer now includes live-capable Jira, Slack, Datadog, Splunk, and CloudWatch adapters.

The sample UI test targets Sauce Demo by default because it is stable for browser automation practice.

## Project Structure

- `src/agents/`: AI-style agents such as `TestGeneratorAgent` and `EnterpriseAgent`
- `src/pages/`: Page Object Model classes
- `src/enterprise/`: governance, script generation, data generation, and failure analysis services
- `src/config/`: WebDriver factory and settings
- `src/utils/`: environment and helper utilities
- `tests/`: Pytest test suite
- `agent_maps/`: JSON files defining agent tasks
- `docs/`: project documentation and generated enterprise review artifacts
- `test-results/`: generated accessibility artifacts and summary indexes

## Extending

- Add new agents in `src/agents/`.
- Add or reuse page objects in `src/pages/` before emitting inline locators.
- Keep generated tests readable so they can be promoted into the maintained suite.
- Enterprise review artifacts are written to `docs/enterprise-output/`.
- Live integrations are available through `src/config/settings.py` and `src/integrations/`.
