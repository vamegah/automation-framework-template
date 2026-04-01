class SlackClient:
    def __init__(self, webhook_url: str, session):
        self.webhook_url = webhook_url
        self.session = session

    @classmethod
    def from_env(cls):
        import requests

        from src.config.settings import get_env

        return cls(webhook_url=get_env("SLACK_WEBHOOK_URL", ""), session=requests.Session())

    def post_message(self, payload: dict) -> dict:
        response = self.session.post(self.webhook_url, json=payload, timeout=30)
        response.raise_for_status()
        try:
            return response.json()
        except Exception:
            return {"status": "ok", "text": getattr(response, "text", "")}
