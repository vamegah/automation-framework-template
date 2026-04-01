class JiraClient:
    def __init__(self, base_url: str, email: str, api_token: str, session):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.api_token = api_token
        self.session = session

    @classmethod
    def from_env(cls):
        import requests

        from src.config.settings import get_env

        return cls(
            base_url=get_env("JIRA_BASE_URL", ""),
            email=get_env("JIRA_EMAIL", ""),
            api_token=get_env("JIRA_API_TOKEN", ""),
            session=requests.Session(),
        )

    def fetch_issue(self, issue_key: str) -> dict:
        response = self.session.get(
            f"{self.base_url}/rest/api/3/issue/{issue_key}",
            auth=(self.email, self.api_token),
            headers={"Accept": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def create_issue(self, payload: dict) -> dict:
        response = self.session.post(
            f"{self.base_url}/rest/api/3/issue",
            auth=(self.email, self.api_token),
            json={"fields": payload},
            headers={"Accept": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
