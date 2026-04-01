from src.enterprise.models import ContractTestArtifact, ContractValidationResult, JsonContractSchema, JsonSchemaProperty


class EnterpriseContractTesting:
    def infer_schema(self, sample):
        if isinstance(sample, list):
            return JsonContractSchema(type="array", items=self._infer_property(sample[0]) if sample else JsonSchemaProperty(type="null"))

        properties = {key: self._infer_property(value) for key, value in (sample or {}).items()}
        return JsonContractSchema(type="object", properties=properties, required=list(properties.keys()))

    def validate(self, payload, schema: JsonContractSchema) -> ContractValidationResult:
        errors: list[str] = []

        if schema.type == "array":
            if not isinstance(payload, list):
                errors.append("payload expected array")
            elif schema.items and payload:
                self._validate_property("payload[0]", schema.items, payload[0], errors)
            return ContractValidationResult(valid=not errors, errors=errors)

        if not isinstance(payload, dict):
            return ContractValidationResult(valid=False, errors=["payload expected object"])

        for key in schema.required:
            if key not in payload:
                errors.append(f"payload.{key} is required")

        for key, prop in schema.properties.items():
            self._validate_property(f"payload.{key}", prop, payload.get(key), errors)

        return ContractValidationResult(valid=not errors, errors=errors)

    def generate_artifact(self, endpoint_name: str, schema: JsonContractSchema) -> ContractTestArtifact:
        slug = "-".join(part for part in "".join(ch.lower() if ch.isalnum() else " " for ch in endpoint_name).split())
        return ContractTestArtifact(
            file_name=f"{slug}.contract.test.py",
            content="\n".join(
                [
                    "from src.enterprise.contract_testing import EnterpriseContractTesting",
                    "",
                    f"# Contract test artifact for {endpoint_name}",
                    "contract_testing = EnterpriseContractTesting()",
                    f"schema = {schema.to_dict()}",
                    "",
                ]
            ),
        )

    def _infer_property(self, value):
        if isinstance(value, list):
            return JsonSchemaProperty(type="array", items=self._infer_property(value[0]) if value else JsonSchemaProperty(type="null"))
        if value is None:
            return JsonSchemaProperty(type="null")
        if isinstance(value, bool):
            return JsonSchemaProperty(type="boolean")
        if isinstance(value, (int, float)):
            return JsonSchemaProperty(type="number")
        if isinstance(value, str):
            return JsonSchemaProperty(type="string")
        properties = {key: self._infer_property(item) for key, item in value.items()}
        return JsonSchemaProperty(type="object", properties=properties)

    def _validate_property(self, path: str, prop: JsonSchemaProperty, value, errors: list[str]):
        if prop.type == "null":
            if value is not None:
                errors.append(f"{path} expected null")
            return
        if prop.type == "array":
            if not isinstance(value, list):
                errors.append(f"{path} expected array")
                return
            if prop.items and value:
                self._validate_property(f"{path}[0]", prop.items, value[0], errors)
            return
        if prop.type == "object":
            if not isinstance(value, dict):
                errors.append(f"{path} expected object")
                return
            for nested_key, nested_prop in prop.properties.items():
                self._validate_property(f"{path}.{nested_key}", nested_prop, value.get(nested_key), errors)
            return

        expected_type = {
            "string": str,
            "number": (int, float),
            "boolean": bool,
        }[prop.type]
        if not isinstance(value, expected_type):
            errors.append(f"{path} expected {prop.type}")
