import json
from pathlib import Path

from src.agents.base_agent import BaseAgent
from src.enterprise.connectors import EnterpriseWebhookConnector
from src.enterprise.failure_analyzer import EnterpriseFailureAnalyzer
from src.enterprise.governance import EnterpriseGovernanceService
from src.enterprise.script_generator import EnterpriseScriptGenerator
from src.enterprise.test_data_generator import EnterpriseTestDataGenerator


class EnterpriseAgent(BaseAgent):
    def __init__(self):
        self.connector = EnterpriseWebhookConnector()
        self.governance = EnterpriseGovernanceService()
        self.failure_analyzer = EnterpriseFailureAnalyzer()
        self.data_generator = EnterpriseTestDataGenerator()

    def execute(self, task_definition_path: str):
        repo_root = Path(__file__).resolve().parents[2]
        map_path = (repo_root / task_definition_path).resolve()
        payload = self.connector.load_map(str(map_path))
        requirements = self.connector.parse_payload(payload["webhook"])

        script_generator = EnterpriseScriptGenerator(repo_root)
        test_cases = self.governance.generate_test_cases(requirements)
        traceability = self.governance.build_traceability_matrix(requirements, test_cases)
        draft_pr = self.governance.plan_draft_pr(requirements, payload["review"]["qaLead"])

        synthetic = self.data_generator.generate_synthetic_customer()
        masked = self.data_generator.mask_sensitive_fields(synthetic)
        seed_sql = self.data_generator.generate_seed_sql("customer_seed", [masked])

        python_script = script_generator.generate_python_script(test_cases[0])
        csharp_script = script_generator.generate_csharp_script(test_cases[0])
        review_comments = [
            comment.to_dict()
            for comment in script_generator.review_script(payload["review"].get("sampleScript", python_script))
        ]

        failure_analysis = self.failure_analyzer.analyze(
            test_name=payload["failureAnalysis"]["testName"],
            test_logs=payload["failureAnalysis"]["testLogs"],
            aut_logs=payload["failureAnalysis"]["autLogs"],
            run_history=payload["failureAnalysis"]["runHistory"],
            video_path=payload["failureAnalysis"]["videoPath"],
            repro_curl=payload["failureAnalysis"]["reproCurl"],
            log_queries=payload["failureAnalysis"].get("logQueries"),
            publish=payload["failureAnalysis"].get("publish"),
        )

        output_dir = repo_root / "docs" / "enterprise-output"
        output_dir.mkdir(parents=True, exist_ok=True)

        (output_dir / "traceability-matrix.json").write_text(json.dumps(traceability, indent=2), encoding="utf-8")
        (output_dir / "generated-test.py").write_text(python_script, encoding="utf-8")
        (output_dir / "generated-test.cs").write_text(csharp_script, encoding="utf-8")
        (output_dir / "draft-pr.json").write_text(json.dumps(draft_pr.to_dict(), indent=2), encoding="utf-8")
        (output_dir / "review-comments.json").write_text(json.dumps(review_comments, indent=2), encoding="utf-8")
        (output_dir / "masked-data.json").write_text(json.dumps(masked, indent=2), encoding="utf-8")
        (output_dir / "seed-data.sql").write_text(seed_sql, encoding="utf-8")
        (output_dir / "failure-analysis.json").write_text(
            json.dumps(failure_analysis.to_dict(), indent=2), encoding="utf-8"
        )

        summary = {
            "requirements": [requirement.to_dict() for requirement in requirements],
            "testCases": [case.to_dict() for case in test_cases],
            "pageObjects": script_generator.discover_page_objects(),
            "artifacts": sorted(path.name for path in output_dir.iterdir()),
        }
        (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
