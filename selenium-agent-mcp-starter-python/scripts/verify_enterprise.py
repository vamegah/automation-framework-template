import json
from pathlib import Path

from src.agents.enterprise_agent import EnterpriseAgent
from src.enterprise.accessibility_integration import EnterpriseAccessibilityAnalyzer
from src.enterprise.cicd_optimizer import EnterpriseCiCdOptimizer
from src.enterprise.contract_testing import EnterpriseContractTesting
from src.enterprise.models import AccessibilityFinding, FlakyTestDecision, LocatorCandidate, PipelineSuiteMetric, Requirement, SelfHealingRequest
from src.enterprise.security_generator import EnterpriseSecurityGenerator
from src.enterprise.self_healing import EnterpriseSelfHealing


def main():
    repo_root = Path(__file__).resolve().parents[1]
    EnterpriseAgent().execute("agent_maps/enterprise_sample.json")

    output_dir = repo_root / "docs" / "enterprise-output"
    traceability = json.loads((output_dir / "traceability-matrix.json").read_text(encoding="utf-8"))
    failure_analysis = json.loads((output_dir / "failure-analysis.json").read_text(encoding="utf-8"))
    review_comments = json.loads((output_dir / "review-comments.json").read_text(encoding="utf-8"))
    generated_python = (output_dir / "generated-test.py").read_text(encoding="utf-8")
    seed_sql = (output_dir / "seed-data.sql").read_text(encoding="utf-8")

    assert traceability[0]["requirementId"] == "JIRA-1234"
    assert traceability[0]["criticalityScore"] >= 1
    assert failure_analysis["quarantine"] is True
    assert "Datadog" in failure_analysis["root_cause"]
    assert any(comment["rule_id"] == "no-sleeps" for comment in review_comments)
    assert "resolve_secret('ENTERPRISE_USERNAME'" in generated_python
    assert "INSERT INTO customer_seed" in seed_sql

    self_healing = EnterpriseSelfHealing().suggest(
        SelfHealingRequest(
            failing_locator="driver.find_element(By.CSS_SELECTOR, '.submit-btn')",
            failure_message="strict mode violation: locator resolved to 2 elements",
            page_object_path="src/pages/login_page.py",
            page_object_source="return self.driver.find_element(By.CSS_SELECTOR, '.submit-btn')",
            candidates=[
                LocatorCandidate(
                    locator="driver.find_element(By.CSS_SELECTOR, \"button[data-test='login-button']\")",
                    strategy="testid",
                    attributes={"name": "Log In"},
                    visible=True,
                    stable=True,
                ),
                LocatorCandidate(locator=".submit-btn", strategy="css", visible=True, stable=False),
            ],
        )
    )
    assert self_healing.should_heal is True
    assert "login-button" in self_healing.healed_locator

    contract_testing = EnterpriseContractTesting()
    sample = {
        "success": True,
        "products": [{"id": 1, "name": "Sample Product", "price": 19.99}],
    }
    schema = contract_testing.infer_schema(sample)
    assert contract_testing.validate(sample, schema).valid is True
    invalid = contract_testing.validate({"success": True, "products": [{"id": "bad-id"}]}, schema)
    assert invalid.valid is False
    assert any("payload.products[0].id expected number" in error for error in invalid.errors)
    artifact = contract_testing.generate_artifact("Products API", schema)
    assert artifact.file_name == "products-api.contract.test.py"

    security_cases = EnterpriseSecurityGenerator().generate_owasp_cases(
        Requirement(
            provider="jira",
            requirement_id="JIRA-4321",
            title="User can log in",
            acceptance_criteria=["Valid credentials are accepted", "Invalid credentials are rejected"],
        ),
        "api",
    )
    assert len(security_cases) == 4
    assert any(case.category == "sql-injection" for case in security_cases)
    assert any(case.category == "xss" for case in security_cases)
    assert any(case.category == "auth-bypass" for case in security_cases)
    assert any(case.category == "input-validation" for case in security_cases)

    accessibility_artifact = EnterpriseAccessibilityAnalyzer().analyze(
        [
            AccessibilityFinding(
                id="a11y-1",
                impact="critical",
                rule="label",
                selector="#email",
                message="Form element must have labels",
            ),
            AccessibilityFinding(
                id="a11y-2",
                impact="serious",
                rule="image-alt",
                selector=".hero img",
                message="Images must have alternate text",
            ),
        ]
    )
    assert "2 accessibility finding(s)" in accessibility_artifact.summary
    assert any("aria-label" in assertion for assertion in accessibility_artifact.assertions)
    assert any("'alt'" in assertion or '"alt"' in assertion for assertion in accessibility_artifact.assertions)

    ci_plan = EnterpriseCiCdOptimizer().optimize(
        [
            PipelineSuiteMetric(name="ui-chrome", average_duration_seconds=420, failure_rate=0.08, requires_serial=False),
            PipelineSuiteMetric(name="stateful-saucedemo", average_duration_seconds=260, failure_rate=0.12, requires_serial=True),
        ],
        [
            FlakyTestDecision(
                test_name="sort inventory",
                failure_count_this_week=3,
                should_quarantine=True,
                quarantine_reason="Failed three times before passing on retry.",
            )
        ],
    )
    assert ci_plan.recommended_workers == 1
    assert "sort inventory" in ci_plan.quarantined_tests
    assert "pytest -q" in ci_plan.workflow_yaml

    print("Enterprise verification passed")


if __name__ == "__main__":
    main()
