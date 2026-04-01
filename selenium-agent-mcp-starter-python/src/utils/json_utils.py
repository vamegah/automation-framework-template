import json
from typing import Any, Dict


def load_json(filepath: str) -> Dict[str, Any]:
    with open(filepath, "r") as f:
        return json.load(f)
