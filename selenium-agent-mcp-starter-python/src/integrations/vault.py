class VaultClient:
    def __init__(self, url: str, token: str | None = None, client=None):
        self.url = url
        self.token = token
        self._client = client

    @classmethod
    def from_env(cls):
        import hvac

        from src.config.settings import get_env

        url = get_env("VAULT_ADDR", "")
        token = get_env("VAULT_TOKEN")
        client = hvac.Client(url=url, token=token)
        return cls(url=url, token=token, client=client)

    def read_secret(self, path: str, field_name: str | None = None, mount_point: str = "secret"):
        response = self._get_client().secrets.kv.v2.read_secret_version(path=path, mount_point=mount_point)
        data = response.get("data", {}).get("data", {})
        if field_name is None:
            return data
        return data.get(field_name)

    def resolve_reference(self, reference: str):
        if not reference.startswith("vault://"):
            return reference
        locator = reference.removeprefix("vault://")
        mount_and_path, _, field_name = locator.partition("#")
        parts = mount_and_path.split("/", 1)
        mount_point = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        return self.read_secret(path=path, field_name=field_name or None, mount_point=mount_point)

    def _get_client(self):
        return self._client
