from datetime import datetime, timezone


class DatadogLogsClient:
    def __init__(self, api_key: str, app_key: str, site: str, session):
        self.api_key = api_key
        self.app_key = app_key
        self.site = site
        self.session = session

    @classmethod
    def from_env(cls):
        import requests

        from src.config.settings import get_env

        return cls(
            api_key=get_env("DATADOG_API_KEY", ""),
            app_key=get_env("DATADOG_APP_KEY", ""),
            site=get_env("DATADOG_SITE", "datadoghq.com"),
            session=requests.Session(),
        )

    def query_logs(self, query: str, minutes: int = 15) -> list[dict]:
        now = datetime.now(timezone.utc)
        start = now.timestamp() - minutes * 60
        response = self.session.post(
            f"https://api.{self.site}/api/v2/logs/events/search",
            headers={
                "DD-API-KEY": self.api_key,
                "DD-APPLICATION-KEY": self.app_key,
                "Content-Type": "application/json",
            },
            json={
                "filter": {
                    "query": query,
                    "from": datetime.fromtimestamp(start, timezone.utc).isoformat(),
                    "to": now.isoformat(),
                },
                "sort": "timestamp",
                "page": {"limit": 20},
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        return [item.get("attributes", {}) for item in data]
