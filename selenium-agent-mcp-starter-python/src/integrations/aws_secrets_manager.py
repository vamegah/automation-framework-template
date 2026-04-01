import base64
import json


class AwsSecretsManagerError(RuntimeError):
    pass


class AwsSecretsManagerClient:
    def __init__(self, region_name: str, session=None):
        self.region_name = region_name
        self._session = session
        self._client = None

    def get_secret(self, secret_id: str):
        response = self._get_client().get_secret_value(SecretId=secret_id)
        if "SecretString" in response:
            return self._parse_secret_string(response["SecretString"])
        if "SecretBinary" in response:
            decoded = base64.b64decode(response["SecretBinary"]).decode("utf-8")
            return self._parse_secret_string(decoded)
        raise AwsSecretsManagerError(f"Secret '{secret_id}' did not contain a readable payload")

    def get_secret_field(self, secret_id: str, field_name: str | None = None, default: str | None = None) -> str | None:
        secret = self.get_secret(secret_id)
        if field_name is None:
            if isinstance(secret, dict):
                raise AwsSecretsManagerError(
                    f"Secret '{secret_id}' contains structured data. A field name is required."
                )
            return str(secret)
        if not isinstance(secret, dict):
            return str(secret)
        return str(secret.get(field_name, default)) if secret.get(field_name, default) is not None else default

    def resolve_reference(self, reference: str, default: str | None = None) -> str | None:
        if not reference.startswith("aws-sm://"):
            return reference or default
        secret_locator = reference.removeprefix("aws-sm://")
        secret_id, _, field_name = secret_locator.partition("#")
        if not secret_id:
            raise AwsSecretsManagerError("AWS Secrets Manager reference must include a secret id")
        return self.get_secret_field(secret_id, field_name or None, default)

    def _get_client(self):
        if self._client is None:
            if self._session is None:
                import boto3

                self._session = boto3.session.Session(region_name=self.region_name)
            self._client = self._session.client("secretsmanager", region_name=self.region_name)
        return self._client

    def _parse_secret_string(self, secret_value: str):
        try:
            return json.loads(secret_value)
        except json.JSONDecodeError:
            return secret_value
