class SplunkClient:
    def __init__(self, base_url: str, token: str, session):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.session = session

    @classmethod
    def from_env(cls):
        import requests

        from src.config.settings import get_env

        return cls(
            base_url=get_env("SPLUNK_BASE_URL", ""),
            token=get_env("SPLUNK_HEC_TOKEN", ""),
            session=requests.Session(),
        )

    def search(self, query: str, earliest: str = "-15m", latest: str = "now") -> list[dict]:
        response = self.session.post(
            f"{self.base_url}/services/search/jobs/export",
            data={"search": query, "earliest_time": earliest, "latest_time": latest, "output_mode": "json"},
            headers={"Authorization": f"Bearer {self.token}"},
            timeout=30,
        )
        response.raise_for_status()
        results = []
        for line in response.text.splitlines():
            line = line.strip()
            if not line:
                continue
            import json

            results.append(json.loads(line).get("result", {}))
        return results
