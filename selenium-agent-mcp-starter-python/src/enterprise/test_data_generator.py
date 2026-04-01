import random
import re
from typing import Any


class EnterpriseTestDataGenerator:
    def generate_synthetic_customer(self, seed: int = 17) -> dict[str, Any]:
        random.seed(seed)
        suffix = random.randint(1000, 9999)
        return {
            "customer_id": f"CUST-{suffix}",
            "full_name": f"Test Customer {suffix}",
            "email": f"customer{suffix}@example.test",
            "address": f"{suffix} Test Avenue",
            "ssn": "123-45-6789",
            "credit_card": "4111111111111111",
        }

    def mask_sensitive_fields(self, record: dict[str, Any]) -> dict[str, Any]:
        masked: dict[str, Any] = {}
        for key, value in record.items():
            text = str(value)
            if self._looks_sensitive(key, text):
                masked[key] = self._mask_value(text)
            else:
                masked[key] = value
        return masked

    def generate_seed_sql(self, table_name: str, rows: list[dict[str, Any]]) -> str:
        statements = []
        for row in rows:
            columns = ", ".join(row.keys())
            values = ", ".join(self._format_sql_value(value) for value in row.values())
            statements.append(f"INSERT INTO {table_name} ({columns}) VALUES ({values});")
        return "\n".join(statements)

    def _looks_sensitive(self, key: str, value: str) -> bool:
        lowered = key.lower()
        patterns = [
            lowered in {"ssn", "social_security_number", "credit_card", "card_number"},
            re.fullmatch(r"\d{3}-\d{2}-\d{4}", value) is not None,
            re.fullmatch(r"\d{16}", value) is not None,
        ]
        return any(patterns)

    def _mask_value(self, value: str) -> str:
        if len(value) <= 4:
            return "*" * len(value)
        return "*" * (len(value) - 4) + value[-4:]

    def _format_sql_value(self, value: Any) -> str:
        escaped = str(value).replace("'", "''")
        return f"'{escaped}'"
