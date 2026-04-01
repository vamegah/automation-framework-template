from src.enterprise.models import DraftPullRequest, GeneratedTestCase, Requirement


class EnterpriseGovernanceService:
    def generate_test_cases(self, requirements: list[Requirement]) -> list[GeneratedTestCase]:
        cases: list[GeneratedTestCase] = []
        for requirement in requirements:
            steps = [
                f"Open the target flow for {requirement.requirement_id}.",
                *[f"Validate acceptance criterion: {criterion}" for criterion in requirement.acceptance_criteria],
            ]
            expected = requirement.acceptance_criteria[-1] if requirement.acceptance_criteria else "Workflow completes"
            cases.append(
                GeneratedTestCase(
                    requirement_id=requirement.requirement_id,
                    name=f"{requirement.requirement_id} - {requirement.title}",
                    objective=f"Verify {requirement.title}",
                    steps=steps,
                    expected_result=expected,
                    criticality_score=self.calculate_criticality(requirement),
                    linked_requirements=requirement.linked_requirements,
                )
            )
        return cases

    def calculate_criticality(self, requirement: Requirement) -> int:
        impact_weight = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        impact = impact_weight.get(requirement.business_impact.lower(), 2)
        criteria_weight = min(len(requirement.acceptance_criteria), 4)
        score = impact * 20 + requirement.code_complexity * 8 + criteria_weight * 6
        return max(1, min(score, 100))

    def build_traceability_matrix(
        self, requirements: list[Requirement], test_cases: list[GeneratedTestCase]
    ) -> list[dict]:
        case_index = {case.requirement_id: case for case in test_cases}
        matrix = []
        for requirement in requirements:
            case = case_index[requirement.requirement_id]
            matrix.append(
                {
                    "requirementId": requirement.requirement_id,
                    "title": requirement.title,
                    "linkedRequirements": requirement.linked_requirements,
                    "generatedTestCase": case.name,
                    "criticalityScore": case.criticality_score,
                }
            )
        return matrix

    def plan_draft_pr(self, requirements: list[Requirement], qa_lead: str) -> DraftPullRequest:
        requirement_ids = ", ".join(requirement.requirement_id for requirement in requirements)
        body_lines = [
            "This draft PR contains AI-generated test assets for review.",
            "",
            f"Requirements: {requirement_ids}",
            "Controls:",
            "- Traceability matrix attached",
            "- Risk-based scores included",
            "- Human approval required before merge",
        ]
        return DraftPullRequest(
            title=f"draft: ai-generated coverage for {requirements[0].requirement_id}",
            body="\n".join(body_lines),
            reviewers=[qa_lead],
            labels=["ai-generated", "qa-review", "draft-pr"],
            branch_name=f"draft/{requirements[0].requirement_id.lower()}",
        )
