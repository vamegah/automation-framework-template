import requests


def test_slingacademy_products_returns_valid_collection():
    response = requests.get(
        "https://api.slingacademy.com/v1/sample-data/products",
        headers={"Accept": "application/json"},
        timeout=20,
    )

    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")

    body = response.json()
    assert body["success"] is True
    assert body["total_products"] > 0
    assert isinstance(body["products"], list)
    assert body["products"]
    assert body["products"][0]["id"] > 0
    assert isinstance(body["products"][0]["name"], str)
    assert body["products"][0]["name"]
