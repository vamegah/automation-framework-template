import requests


def test_northwind_products_endpoint_supports_expanded_category_and_supplier_joins():
    response = requests.get(
        "https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$top=2&$expand=Category,Supplier",
        headers={"Accept": "application/json"},
        timeout=20,
    )

    body = response.json()
    assert response.status_code == 200
    assert isinstance(body["d"], list)
    assert body["d"]
    assert body["d"][0]["ProductID"] > 0
    assert body["d"][0]["ProductName"]
    assert body["d"][0]["Category"]["CategoryID"] > 0
    assert body["d"][0]["Category"]["CategoryName"]
    assert body["d"][0]["Supplier"]["SupplierID"] > 0
    assert body["d"][0]["Supplier"]["CompanyName"]


def test_northwind_category_joins_and_filter_queries_return_consistent_product_data():
    categories_response = requests.get(
        "https://services.odata.org/V2/Northwind/Northwind.svc/Categories(1)?$format=json&$expand=Products",
        headers={"Accept": "application/json"},
        timeout=20,
    )
    categories_body = categories_response.json()

    assert categories_response.status_code == 200
    assert categories_body["d"]["CategoryName"]
    assert categories_body["d"]["Products"]["results"]
    assert categories_body["d"]["Products"]["results"][0]["CategoryID"] == categories_body["d"]["CategoryID"]

    filtered_response = requests.get(
        "https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$filter=Discontinued%20eq%20false&$top=3",
        headers={"Accept": "application/json"},
        timeout=20,
    )
    filtered_body = filtered_response.json()

    assert filtered_response.status_code == 200
    assert filtered_body["d"]
    for product in filtered_body["d"]:
        assert product["Discontinued"] is False
        assert product["ProductName"]
