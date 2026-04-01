from types import SimpleNamespace

from src.config.settings import resolve_secret
from src.integrations.aws_secrets_manager import AwsSecretsManagerClient


class FakeSecretsManager:
    def __init__(self, payload):
        self.payload = payload
        self.requests = []

    def get_secret_value(self, SecretId):
        self.requests.append(SecretId)
        return self.payload


class FakeSession:
    def __init__(self, payload):
        self.payload = payload

    def client(self, service_name, region_name=None):
        assert service_name == "secretsmanager"
        return FakeSecretsManager(self.payload)


def test_client_reads_json_secret_field():
    client = AwsSecretsManagerClient(
        region_name="us-east-1",
        session=FakeSession({"SecretString": '{"username":"live_user","password":"live_password"}'}),
    )

    assert client.get_secret_field("demo/secret", "username") == "live_user"


def test_client_resolves_aws_reference():
    client = AwsSecretsManagerClient(
        region_name="us-east-1",
        session=FakeSession({"SecretString": '{"username":"live_user"}'}),
    )

    assert client.resolve_reference("aws-sm://demo/secret#username") == "live_user"


def test_resolve_secret_prefers_direct_env(monkeypatch):
    monkeypatch.setenv("AWS_SECRET_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("SAUCEDEMO_STANDARD_USERNAME", "env_user")

    assert resolve_secret("SAUCEDEMO_STANDARD_USERNAME", default="fallback") == "env_user"


def test_resolve_secret_uses_aws_client(monkeypatch):
    monkeypatch.delenv("SAUCEDEMO_STANDARD_USERNAME", raising=False)
    monkeypatch.setenv("AWS_SECRET_INTEGRATION_ENABLED", "true")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("SAUCEDEMO_STANDARD_USERNAME_SECRET_REF", "aws-sm://demo/secret#username")

    fake_module = SimpleNamespace(
        AwsSecretsManagerClient=lambda region_name: AwsSecretsManagerClient(
            region_name=region_name,
            session=FakeSession({"SecretString": '{"username":"live_user"}'}),
        )
    )

    monkeypatch.setitem(__import__("sys").modules, "src.integrations.aws_secrets_manager", fake_module)

    assert resolve_secret("SAUCEDEMO_STANDARD_USERNAME", default="fallback") == "live_user"
