from src.enterprise.models import Requirement, SecurityTestCase


class EnterpriseSecurityGenerator:
    def generate_owasp_cases(self, requirement: Requirement, surface: str) -> list[SecurityTestCase]:
        prefix = requirement.requirement_id.replace(" ", "-")
        login_target = "login API" if surface == "api" else "login form"
        return [
            self._build_case(
                f"{prefix}-SEC-1",
                f"{requirement.requirement_id} rejects SQL injection in the {login_target}",
                "sql-injection",
                "critical",
                [
                    f"Submit the {login_target} with username \"' OR '1'='1\" and a dummy password.",
                    "Observe the authentication response and any backend error handling.",
                ],
                [
                    "Authentication is rejected with a safe validation or authorization error.",
                    "No SQL error details are exposed to the user.",
                ],
            ),
            self._build_case(
                f"{prefix}-SEC-2",
                f"{requirement.requirement_id} neutralizes reflected XSS payloads",
                "xss",
                "high",
                [
                    "Submit a payload like <script>alert(1)</script> into a user-controlled field.",
                    "Navigate to the confirmation or error view that re-renders the value.",
                ],
                [
                    "Payload is encoded or rejected.",
                    "No script execution occurs in the browser.",
                ],
            ),
            self._build_case(
                f"{prefix}-SEC-3",
                f"{requirement.requirement_id} prevents authentication bypass with missing or tampered tokens",
                "auth-bypass",
                "critical",
                [
                    "Replay the protected request without the expected auth token or session cookie.",
                    "Repeat with a tampered token value.",
                ],
                [
                    "Access is denied consistently.",
                    "The system does not treat malformed tokens as authenticated.",
                ],
            ),
            self._build_case(
                f"{prefix}-SEC-4",
                f"{requirement.requirement_id} validates oversized and special-character input safely",
                "input-validation",
                "high",
                [
                    "Submit extremely long strings, Unicode control characters, and special characters in user inputs.",
                    "Observe validation and server responses.",
                ],
                [
                    "Validation remains stable and user-friendly.",
                    "The application does not return a 500-level error.",
                ],
            ),
        ]

    def _build_case(self, case_id: str, title: str, category: str, severity: str, steps: list[str], expected_results: list[str]) -> SecurityTestCase:
        return SecurityTestCase(
            id=case_id,
            title=title,
            category=category,
            severity=severity,
            preconditions=["Target endpoint or page is reachable in a non-production environment."],
            steps=steps,
            expected_results=expected_results,
        )
