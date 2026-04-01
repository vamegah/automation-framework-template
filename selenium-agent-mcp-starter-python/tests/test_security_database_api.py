import requests

LOGIN_PAYLOADS = [
    "' or 1=1 --",
    "admin'--",
    "' UNION SELECT * FROM Users --",
]

SEARCH_PAYLOADS = [
    "<script>alert(1)</script>",
    "../../etc/passwd",
    "' OR 1=1 --",
]


def _assert_safe_body(body_text: str) -> None:
    assert 'authentication":{"token"' not in body_text
    assert "Sequelize" not in body_text
    assert "SQLITE" not in body_text
    assert "java.lang." not in body_text
    assert "stack trace" not in body_text


def test_juice_shop_rejects_multiple_owasp_style_login_injection_payloads():
    for email in LOGIN_PAYLOADS:
        try:
            response = requests.post(
                "https://demo.owasp-juice.shop/rest/user/login",
                json={"email": email, "password": "test"},
                headers={"Accept": "application/json, text/html"},
                timeout=(5, 10),
            )
        except requests.RequestException as exc:
            assert exc.__class__.__name__ in {"ReadTimeout", "ConnectionError"}
            continue

        assert response.status_code != 200
        assert response.status_code in {400, 401, 429, 503}
        _assert_safe_body(response.text)


def test_juice_shop_handles_search_attack_payloads_without_exposing_backend_internals():
    for payload in SEARCH_PAYLOADS:
        try:
            response = requests.get(
                "https://demo.owasp-juice.shop/rest/products/search",
                params={"q": payload},
                headers={"Accept": "application/json, text/html"},
                timeout=(5, 10),
            )
        except requests.RequestException as exc:
            assert exc.__class__.__name__ in {"ReadTimeout", "ConnectionError"}
            continue

        assert response.status_code in {200, 400, 404, 429, 503}
        _assert_safe_body(response.text)
