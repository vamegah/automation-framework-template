import os
from dotenv import load_dotenv

load_dotenv()


def get_env(key: str, default: str = None) -> str:
    return os.getenv(key, default)


def get_bool_env(key: str, default: bool = False) -> bool:
    val = os.getenv(key, str(default)).lower()
    return val in ('true', '1', 'yes')


def resolve_secret(
    value_key: str,
    default: str = None,
    secret_ref_key: str = None,
    secret_id_key: str = None,
    secret_field_key: str = None,
) -> str:
    direct_value = get_env(value_key)
    if direct_value:
        return direct_value

    secret_ref = get_env(secret_ref_key or f"{value_key}_SECRET_REF")
    if secret_ref:
        if secret_ref.startswith("vault://"):
            if not get_bool_env("VAULT_SECRET_INTEGRATION_ENABLED", False):
                return default
            from src.integrations.vault import VaultClient

            client = VaultClient.from_env()
            resolved = client.resolve_reference(secret_ref)
            return str(resolved) if resolved is not None else default
        if secret_ref.startswith("aws-sm://"):
            if not get_bool_env("AWS_SECRET_INTEGRATION_ENABLED", False):
                return default
            from src.integrations.aws_secrets_manager import AwsSecretsManagerClient

            region_name = get_env("AWS_REGION", "us-east-1")
            client = AwsSecretsManagerClient(region_name=region_name)
            return client.resolve_reference(secret_ref, default)
        return secret_ref

    secret_id = get_env(secret_id_key or f"{value_key}_SECRET_ID")
    if not secret_id:
        return default

    secret_field = get_env(secret_field_key or f"{value_key}_SECRET_FIELD")
    if get_bool_env("VAULT_SECRET_INTEGRATION_ENABLED", False):
        from src.integrations.vault import VaultClient

        client = VaultClient.from_env()
        resolved = client.read_secret(path=secret_id, field_name=secret_field or None, mount_point=get_env("VAULT_MOUNT_POINT", "secret"))
        return str(resolved) if resolved is not None else default
    if get_bool_env("AWS_SECRET_INTEGRATION_ENABLED", False):
        from src.integrations.aws_secrets_manager import AwsSecretsManagerClient

        region_name = get_env("AWS_REGION", "us-east-1")
        client = AwsSecretsManagerClient(region_name=region_name)
        return client.get_secret_field(secret_id, secret_field, default)
    return default
