from src.config.settings import resolve_secret
from src.enterprise.connectors import EnterpriseWebhookConnector
from src.enterprise.failure_analyzer import EnterpriseFailureAnalyzer
from src.integrations.jira import JiraClient
from src.integrations.slack import SlackClient
from src.integrations.vault import VaultClient


class FakeResponse:
    def __init__(self, payload=None, text="ok"):
        self._payload = payload or {}
        self.text = text

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


class FakeSession:
    def __init__(self):
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append(("get", url, kwargs))
        return FakeResponse(
            {
                "key": "JIRA-900",
                "fields": {
                    "summary": "Live fetched story",
                    "acceptanceCriteria": ["User can check out", "Failure creates a triage record"],
                },
            }
        )

    def post(self, url, **kwargs):
        self.calls.append(("post", url, kwargs))
        return FakeResponse({"id": "10001", "key": "JIRA-10001"}, text="ok")


class FakeVaultInnerClient:
    class Secrets:
        class KV:
            class V2:
                def read_secret_version(self, path, mount_point):
                    return {"data": {"data": {"username": "vault_user", "password": "vault_password"}}}

            v2 = V2()

        kv = KV()

    secrets = Secrets()


def test_jira_connector_live_fetch(monkeypatch):
    monkeypatch.setenv("JIRA_LIVE_INTEGRATION_ENABLED", "true")
    fake_session = FakeSession()
    fake_client = JiraClient("https://jira.example.com", "qa@example.com", "token", fake_session)
    monkeypatch.setattr("src.enterprise.connectors.JiraClient.from_env", lambda: fake_client)

    requirements = EnterpriseWebhookConnector().parse_payload(
        {
            "provider": "jira",
            "liveFetch": True,
            "issueKey": "JIRA-900",
            "linkedRequirements": ["AUTH-10"],
            "businessImpact": "high",
            "codeComplexity": 4,
        }
    )

    assert requirements[0].requirement_id == "JIRA-900"
    assert requirements[0].title == "Live fetched story"
    assert any(call[0] == "get" for call in fake_session.calls)


def test_resolve_secret_supports_vault_reference(monkeypatch):
    monkeypatch.setenv("VAULT_SECRET_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("ENTERPRISE_USERNAME_SECRET_REF", "vault://secret/app#username")
    monkeypatch.setattr("src.config.settings.get_env", lambda key, default=None: {
        "VAULT_SECRET_INTEGRATION_ENABLED": "true",
        "ENTERPRISE_USERNAME_SECRET_REF": "vault://secret/app#username",
        "VAULT_ADDR": "https://vault.example.com",
        "VAULT_TOKEN": "token",
    }.get(key, default))
    monkeypatch.setattr("src.integrations.vault.VaultClient.from_env", lambda: VaultClient("https://vault.example.com", "token", FakeVaultInnerClient()))

    assert resolve_secret("ENTERPRISE_USERNAME", default="fallback") == "vault_user"


def test_failure_analyzer_collects_live_logs_and_publishes(monkeypatch):
    posted = {"slack": 0, "jira": 0}

    monkeypatch.setenv("DATADOG_LIVE_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("SPLUNK_LIVE_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("CLOUDWATCH_LIVE_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("SLACK_LIVE_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("JIRA_LIVE_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("JIRA_ACCOUNT_ID", "acct-1")

    class FakeDatadog:
        def query_logs(self, query):
            return [{"status": "error", "message": f"datadog hit for {query}"}]

    class FakeSplunk:
        def search(self, query):
            return [{"level": "error", "message": f"splunk hit for {query}"}]

    class FakeCloudWatch:
        def filter_log_events(self, log_group_name, filter_pattern="", limit=20):
            return [{"message": f"cloudwatch hit for {log_group_name}:{filter_pattern}"}]

    class FakeSlack:
        def post_message(self, payload):
            posted["slack"] += 1
            return {"ok": True, "payload": payload}

    class FakeJira:
        def create_issue(self, payload):
            posted["jira"] += 1
            return {"key": "JIRA-10001", "payload": payload}

    monkeypatch.setattr("src.enterprise.failure_analyzer.DatadogLogsClient.from_env", lambda: FakeDatadog())
    monkeypatch.setattr("src.enterprise.failure_analyzer.SplunkClient.from_env", lambda: FakeSplunk())
    monkeypatch.setattr("src.enterprise.failure_analyzer.CloudWatchLogsClient.from_env", lambda: FakeCloudWatch())
    monkeypatch.setattr("src.enterprise.failure_analyzer.SlackClient.from_env", lambda: FakeSlack())
    monkeypatch.setattr("src.enterprise.failure_analyzer.JiraClient.from_env", lambda: FakeJira())

    analysis = EnterpriseFailureAnalyzer().analyze(
        test_name="test_checkout_happy_path",
        test_logs=[{"level": "error", "message": "ui timeout"}],
        aut_logs=[],
        run_history=[
            {"testName": "test_checkout_happy_path", "result": "failed", "passedOnRetry": True},
            {"testName": "test_checkout_happy_path", "result": "failed", "passedOnRetry": True},
            {"testName": "test_checkout_happy_path", "result": "failed", "passedOnRetry": True},
        ],
        video_path="video.mp4",
        repro_curl="curl https://demo.app",
        log_queries={
            "datadog": "service:checkout",
            "splunk": "search error checkout",
            "cloudwatchLogGroup": "/aws/app/demo",
            "cloudwatchFilter": "ERROR",
        },
        publish={"jiraProjectKey": "QA"},
    )

    assert analysis.correlated_log_source in {"Datadog", "Splunk", "CloudWatch"}
    assert analysis.quarantine is True
    assert posted["slack"] == 1
    assert posted["jira"] == 1


def test_slack_and_jira_clients_make_requests():
    fake_session = FakeSession()
    slack = SlackClient("https://hooks.slack.test", fake_session)
    jira = JiraClient("https://jira.example.com", "qa@example.com", "token", fake_session)

    slack.post_message({"text": "hello"})
    jira.create_issue({"summary": "Bug"})

    assert any(call[0] == "post" and "hooks.slack.test" in call[1] for call in fake_session.calls)
    assert any(call[0] == "post" and "/rest/api/3/issue" in call[1] for call in fake_session.calls)
