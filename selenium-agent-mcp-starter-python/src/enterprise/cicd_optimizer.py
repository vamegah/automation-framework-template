from src.enterprise.models import FlakyTestDecision, PipelineOptimizationPlan, PipelineSuiteMetric


class EnterpriseCiCdOptimizer:
    def optimize(self, metrics: list[PipelineSuiteMetric], flaky_decisions: list[FlakyTestDecision]) -> PipelineOptimizationPlan:
        recommended_workers = self._recommend_workers(metrics)
        quarantined = [decision.test_name for decision in flaky_decisions if decision.should_quarantine]
        return PipelineOptimizationPlan(
            recommended_workers=recommended_workers,
            shard_count=max(1, recommended_workers),
            quarantined_tests=quarantined,
            rationale=[
                f"{sum(1 for metric in metrics if metric.requires_serial)} suite(s) require serial execution.",
                f"{len(quarantined)} flaky test(s) should be excluded from the blocking lane until reviewed.",
                f"Recommended worker count is {recommended_workers} based on current suite duration and statefulness.",
            ],
            workflow_yaml="\n".join(
                [
                    "name: selenium-python-optimized",
                    "on: [push, pull_request]",
                    "jobs:",
                    "  test:",
                    "    runs-on: ubuntu-latest",
                    "    steps:",
                    "      - uses: actions/checkout@v4",
                    "      - uses: actions/setup-python@v5",
                    "        with:",
                    "          python-version: '3.12'",
                    "      - run: pip install -r requirements.txt",
                    "      - run: pytest -q",
                ]
            ),
        )

    def _recommend_workers(self, metrics: list[PipelineSuiteMetric]) -> int:
        if any(metric.requires_serial for metric in metrics):
            return 1
        total_duration = sum(metric.average_duration_seconds for metric in metrics)
        if total_duration > 900:
            return 4
        if total_duration > 300:
            return 2
        return 1
