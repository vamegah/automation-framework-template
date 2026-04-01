from collections import Counter

from src.config.settings import get_bool_env, get_env
from src.integrations.cloudwatch import CloudWatchLogsClient
from src.integrations.datadog import DatadogLogsClient
from src.integrations.jira import JiraClient
from src.integrations.slack import SlackClient
from src.integrations.splunk import SplunkClient
from src.enterprise.models import FailureAnalysis


class EnterpriseFailureAnalyzer:
    def analyze(
        self,
        test_name: str,
        test_logs: list[dict],
        aut_logs: list[dict],
        run_history: list[dict],
        video_path: str,
        repro_curl: str,
        log_queries: dict | None = None,
        publish: dict | None = None,
    ) -> FailureAnalysis:
        aut_logs = list(aut_logs) + self._collect_live_logs(log_queries or {})
        root_cause = self._correlate_logs(test_logs, aut_logs)
        quarantine = self._is_flaky(test_name, run_history)
        jira_payload = {
            "summary": f"Failure analysis for {test_name}",
            "description": root_cause,
            "labels": ["ai-rca", "quarantine" if quarantine else "needs-triage"],
            "attachments": [video_path],
            "repro": repro_curl,
        }
        slack_payload = {
            "channel": "#qa-alerts",
            "text": f"{test_name} failed: {root_cause}",
            "attachments": [{"video": video_path, "curl": repro_curl}],
        }
        self._publish(jira_payload=jira_payload, slack_payload=slack_payload, publish=publish or {})
        return FailureAnalysis(
            test_name=test_name,
            root_cause=root_cause,
            correlated_log_source=self._pick_log_source(aut_logs),
            jira_payload=jira_payload,
            slack_payload=slack_payload,
            quarantine=quarantine,
            evidence={"video": video_path, "curl": repro_curl, "history": run_history},
        )

    def _correlate_logs(self, test_logs: list[dict], aut_logs: list[dict]) -> str:
        aut_errors = [entry for entry in aut_logs if entry.get("level") == "error"]
        if aut_errors:
            source = aut_errors[0].get("source", "aut")
            message = aut_errors[0].get("message", "Unknown server-side error")
            return f"Correlated {source} error with UI failure: {message}"
        if test_logs:
            return f"UI failure without server signal: {test_logs[0].get('message', 'Unknown test failure')}"
        return "Insufficient data to determine root cause"

    def _pick_log_source(self, aut_logs: list[dict]) -> str:
        sources = [entry.get("source", "aut") for entry in aut_logs]
        return Counter(sources).most_common(1)[0][0] if sources else "aut"

    def _is_flaky(self, test_name: str, run_history: list[dict]) -> bool:
        failures_with_retry_pass = 0
        for run in run_history:
            if run.get("testName") != test_name:
                continue
            if run.get("result") == "failed" and run.get("passedOnRetry"):
                failures_with_retry_pass += 1
        return failures_with_retry_pass >= 3

    def _collect_live_logs(self, log_queries: dict) -> list[dict]:
        logs: list[dict] = []
        if get_bool_env("DATADOG_LIVE_INTEGRATION_ENABLED", False) and log_queries.get("datadog"):
            for entry in DatadogLogsClient.from_env().query_logs(log_queries["datadog"]):
                logs.append(
                    {
                        "level": entry.get("status", "error"),
                        "source": "Datadog",
                        "message": entry.get("message", ""),
                    }
                )
        if get_bool_env("SPLUNK_LIVE_INTEGRATION_ENABLED", False) and log_queries.get("splunk"):
            for entry in SplunkClient.from_env().search(log_queries["splunk"]):
                logs.append(
                    {
                        "level": entry.get("level", "error"),
                        "source": "Splunk",
                        "message": entry.get("message", ""),
                    }
                )
        if get_bool_env("CLOUDWATCH_LIVE_INTEGRATION_ENABLED", False) and log_queries.get("cloudwatchLogGroup"):
            pattern = log_queries.get("cloudwatchFilter", "")
            entries = CloudWatchLogsClient.from_env().filter_log_events(
                log_group_name=log_queries["cloudwatchLogGroup"],
                filter_pattern=pattern,
            )
            for entry in entries:
                logs.append(
                    {
                        "level": "error",
                        "source": "CloudWatch",
                        "message": entry.get("message", ""),
                    }
                )
        return logs

    def _publish(self, jira_payload: dict, slack_payload: dict, publish: dict):
        if get_bool_env("SLACK_LIVE_INTEGRATION_ENABLED", False) and publish.get("slack", True):
            SlackClient.from_env().post_message(slack_payload)
        if get_bool_env("JIRA_LIVE_INTEGRATION_ENABLED", False) and publish.get("jiraProjectKey"):
            issue_fields = {
                "project": {"key": publish["jiraProjectKey"]},
                "summary": jira_payload["summary"],
                "description": jira_payload["description"],
                "issuetype": {"name": publish.get("jiraIssueType", "Bug")},
                "labels": jira_payload["labels"],
            }
            if get_env("JIRA_ACCOUNT_ID"):
                issue_fields["assignee"] = {"id": get_env("JIRA_ACCOUNT_ID")}
            JiraClient.from_env().create_issue(issue_fields)
