class CloudWatchLogsClient:
    def __init__(self, region_name: str, client=None):
        self.region_name = region_name
        self._client = client

    @classmethod
    def from_env(cls):
        import boto3

        from src.config.settings import get_env

        region_name = get_env("AWS_REGION", "us-east-1")
        return cls(region_name=region_name, client=boto3.client("logs", region_name=region_name))

    def filter_log_events(self, log_group_name: str, filter_pattern: str = "", limit: int = 20) -> list[dict]:
        response = self._get_client().filter_log_events(
            logGroupName=log_group_name,
            filterPattern=filter_pattern,
            limit=limit,
        )
        return response.get("events", [])

    def _get_client(self):
        return self._client
