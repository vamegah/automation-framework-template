from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class Requirement:
    provider: str
    requirement_id: str
    title: str
    acceptance_criteria: list[str]
    linked_requirements: list[str] = field(default_factory=list)
    business_impact: str = "medium"
    code_complexity: int = 3
    target_url: str = ""
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class GeneratedTestCase:
    requirement_id: str
    name: str
    objective: str
    steps: list[str]
    expected_result: str
    criticality_score: int
    linked_requirements: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DraftPullRequest:
    title: str
    body: str
    reviewers: list[str]
    labels: list[str]
    branch_name: str
    is_draft: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ReviewComment:
    rule_id: str
    severity: str
    message: str
    line_hint: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class FailureAnalysis:
    test_name: str
    root_cause: str
    correlated_log_source: str
    jira_payload: dict[str, Any]
    slack_payload: dict[str, Any]
    quarantine: bool
    evidence: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LocatorCandidate:
    locator: str
    strategy: str
    attributes: dict[str, str] = field(default_factory=dict)
    visible: bool = False
    stable: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SelfHealingRequest:
    failing_locator: str
    failure_message: str
    page_object_path: str
    page_object_source: str
    candidates: list[LocatorCandidate] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SelfHealingResult:
    should_heal: bool
    confidence: int
    reason: str
    healed_locator: str = ""
    patch: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class JsonSchemaProperty:
    type: str
    properties: dict[str, "JsonSchemaProperty"] = field(default_factory=dict)
    items: "JsonSchemaProperty | None" = None

    def to_dict(self) -> dict[str, Any]:
        data = {"type": self.type}
        if self.properties:
            data["properties"] = {key: value.to_dict() for key, value in self.properties.items()}
        if self.items is not None:
            data["items"] = self.items.to_dict()
        return data


@dataclass
class JsonContractSchema:
    type: str
    properties: dict[str, JsonSchemaProperty] = field(default_factory=dict)
    required: list[str] = field(default_factory=list)
    items: JsonSchemaProperty | None = None

    def to_dict(self) -> dict[str, Any]:
        data = {"type": self.type, "required": self.required}
        if self.properties:
            data["properties"] = {key: value.to_dict() for key, value in self.properties.items()}
        if self.items is not None:
            data["items"] = self.items.to_dict()
        return data


@dataclass
class ContractValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ContractTestArtifact:
    file_name: str
    content: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SecurityTestCase:
    id: str
    title: str
    category: str
    severity: str
    preconditions: list[str]
    steps: list[str]
    expected_results: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AccessibilityFinding:
    id: str
    impact: str
    rule: str
    selector: str
    message: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AccessibilityRecommendation:
    finding_id: str
    fix: str
    assertion: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AccessibilityCoverageArtifact:
    summary: str
    recommendations: list[AccessibilityRecommendation]
    assertions: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": self.summary,
            "recommendations": [recommendation.to_dict() for recommendation in self.recommendations],
            "assertions": self.assertions,
        }


@dataclass
class PipelineSuiteMetric:
    name: str
    average_duration_seconds: int
    failure_rate: float
    requires_serial: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class FlakyTestDecision:
    test_name: str
    failure_count_this_week: int
    should_quarantine: bool
    quarantine_reason: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PipelineOptimizationPlan:
    recommended_workers: int
    shard_count: int
    quarantined_tests: list[str]
    workflow_yaml: str
    rationale: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
