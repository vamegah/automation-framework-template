import json

from src.config.settings import get_bool_env
from src.integrations.jira import JiraClient
from src.enterprise.models import Requirement


class EnterpriseWebhookConnector:
    def parse_payload(self, payload: dict) -> list[Requirement]:
        provider = str(payload.get("provider", "")).lower()
        if payload.get("liveFetch") and provider == "jira":
            payload = self._fetch_live_jira_payload(payload)
        if provider == "jira":
            return self._parse_jira(payload)
        if provider == "azure-devops":
            return self._parse_azure_devops(payload)
        if provider == "linear":
            return self._parse_linear(payload)
        raise ValueError(f"Unsupported provider: {provider}")

    def _fetch_live_jira_payload(self, payload: dict) -> dict:
        if not get_bool_env("JIRA_LIVE_INTEGRATION_ENABLED", False):
            return payload
        issue_key = payload.get("issueKey") or payload.get("issue", {}).get("key")
        if not issue_key:
            return payload
        issue = JiraClient.from_env().fetch_issue(issue_key)
        return {
            **payload,
            "issue": issue,
        }

    def load_map(self, path: str) -> dict:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)

    def _parse_jira(self, payload: dict) -> list[Requirement]:
        issue = payload["issue"]
        fields = issue.get("fields", {})
        acceptance = self._normalize_criteria(fields.get("acceptanceCriteria", []))
        return [
            Requirement(
                provider="jira",
                requirement_id=issue["key"],
                title=fields.get("summary", issue["key"]),
                acceptance_criteria=acceptance,
                linked_requirements=payload.get("linkedRequirements", []),
                business_impact=payload.get("businessImpact", "high"),
                code_complexity=int(payload.get("codeComplexity", 3)),
                target_url=payload.get("targetUrl", ""),
                notes=payload.get("notes", ""),
            )
        ]

    def _parse_azure_devops(self, payload: dict) -> list[Requirement]:
        resource = payload["resource"]
        fields = resource.get("fields", {})
        acceptance = self._normalize_criteria(fields.get("Microsoft.VSTS.Common.AcceptanceCriteria", ""))
        return [
            Requirement(
                provider="azure-devops",
                requirement_id=str(resource["id"]),
                title=fields.get("System.Title", f"Work Item {resource['id']}"),
                acceptance_criteria=acceptance,
                linked_requirements=payload.get("linkedRequirements", []),
                business_impact=payload.get("businessImpact", "medium"),
                code_complexity=int(payload.get("codeComplexity", 3)),
                target_url=payload.get("targetUrl", ""),
                notes=payload.get("notes", ""),
            )
        ]

    def _parse_linear(self, payload: dict) -> list[Requirement]:
        data = payload["data"]
        acceptance = self._normalize_criteria(data.get("acceptanceCriteria", []))
        return [
            Requirement(
                provider="linear",
                requirement_id=data["identifier"],
                title=data.get("title", data["identifier"]),
                acceptance_criteria=acceptance,
                linked_requirements=payload.get("linkedRequirements", []),
                business_impact=payload.get("businessImpact", "medium"),
                code_complexity=int(payload.get("codeComplexity", 3)),
                target_url=payload.get("targetUrl", ""),
                notes=payload.get("notes", ""),
            )
        ]

    def _normalize_criteria(self, raw_criteria) -> list[str]:
        if isinstance(raw_criteria, list):
            return [str(item).strip() for item in raw_criteria if str(item).strip()]
        if isinstance(raw_criteria, str):
            return [line.strip(" -*") for line in raw_criteria.splitlines() if line.strip()]
        return []
