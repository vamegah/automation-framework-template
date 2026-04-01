import { test, expect } from '../fixtures/base.fixture';

test.describe('Northwind Database Coverage @api', () => {
  test('verifies the Northwind products endpoint supports expanded category and supplier joins', async ({ apiContext }) => {
    const response = await apiContext.get('https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$top=2&$expand=Category,Supplier');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toContain('application/json');

    const body = await response.json() as {
      d: Array<{
        ProductID: number;
        ProductName: string;
        Category: { CategoryID: number; CategoryName: string };
        Supplier: { SupplierID: number; CompanyName: string };
      }>;
    };

    expect(body.d.length).toBeGreaterThan(0);
    expect(body.d[0].ProductID).toBeGreaterThan(0);
    expect(body.d[0].ProductName.length).toBeGreaterThan(0);
    expect(body.d[0].Category.CategoryID).toBeGreaterThan(0);
    expect(body.d[0].Category.CategoryName.length).toBeGreaterThan(0);
    expect(body.d[0].Supplier.SupplierID).toBeGreaterThan(0);
    expect(body.d[0].Supplier.CompanyName.length).toBeGreaterThan(0);
  });

  test('verifies Northwind category joins and filter queries return consistent product data', async ({ apiContext }) => {
    const categoriesResponse = await apiContext.get('https://services.odata.org/V2/Northwind/Northwind.svc/Categories(1)?$format=json&$expand=Products');
    expect(categoriesResponse.status()).toBe(200);

    const categoriesBody = await categoriesResponse.json() as {
      d: {
        CategoryID: number;
        CategoryName: string;
        Products: { results: Array<{ ProductID: number; CategoryID: number }> };
      };
    };

    expect(categoriesBody.d.CategoryName.length).toBeGreaterThan(0);
    expect(categoriesBody.d.Products.results.length).toBeGreaterThan(0);
    expect(categoriesBody.d.Products.results[0].CategoryID).toBe(categoriesBody.d.CategoryID);

    const filteredResponse = await apiContext.get('https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$filter=Discontinued%20eq%20false&$top=3');
    expect(filteredResponse.status()).toBe(200);

    const filteredBody = await filteredResponse.json() as {
      d: Array<{ Discontinued: boolean; ProductName: string }>;
    };

    expect(filteredBody.d.length).toBeGreaterThan(0);
    for (const product of filteredBody.d) {
      expect(product.Discontinued).toBe(false);
      expect(product.ProductName.length).toBeGreaterThan(0);
    }
  });
});
