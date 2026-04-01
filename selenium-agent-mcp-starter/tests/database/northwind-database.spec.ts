import { expect } from 'chai';

describe('Northwind Database Coverage', function () {
  this.timeout(30000);

  it('verifies the Northwind products endpoint supports expanded category and supplier joins', async () => {
    const response = await fetch('https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$top=2&$expand=Category,Supplier', {
      headers: {
        Accept: 'application/json',
      },
    });

    const body = await response.json() as {
      d: Array<{
        ProductID: number;
        ProductName: string;
        Category: { CategoryID: number; CategoryName: string };
        Supplier: { SupplierID: number; CompanyName: string };
      }>;
    };

    expect(response.status).to.equal(200);
    expect(Array.isArray(body.d)).to.equal(true);
    expect(body.d.length).to.be.greaterThan(0);
    expect(body.d[0].ProductID).to.be.greaterThan(0);
    expect(body.d[0].ProductName).to.be.a('string').and.not.be.empty;
    expect(body.d[0].Category.CategoryID).to.be.greaterThan(0);
    expect(body.d[0].Category.CategoryName).to.be.a('string').and.not.be.empty;
    expect(body.d[0].Supplier.SupplierID).to.be.greaterThan(0);
    expect(body.d[0].Supplier.CompanyName).to.be.a('string').and.not.be.empty;
  });

  it('verifies Northwind category joins and filter queries return consistent product data', async () => {
    const categoriesResponse = await fetch('https://services.odata.org/V2/Northwind/Northwind.svc/Categories(1)?$format=json&$expand=Products');
    const categoriesBody = await categoriesResponse.json() as {
      d: {
        CategoryID: number;
        CategoryName: string;
        Products: { results: Array<{ ProductID: number; CategoryID: number }> };
      };
    };

    expect(categoriesResponse.status).to.equal(200);
    expect(categoriesBody.d.CategoryName).to.be.a('string').and.not.be.empty;
    expect(categoriesBody.d.Products.results).to.have.length.greaterThan(0);
    expect(categoriesBody.d.Products.results[0].CategoryID).to.equal(categoriesBody.d.CategoryID);

    const filteredResponse = await fetch('https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$filter=Discontinued%20eq%20false&$top=3');
    const filteredBody = await filteredResponse.json() as {
      d: Array<{ Discontinued: boolean; ProductName: string }>;
    };

    expect(filteredResponse.status).to.equal(200);
    expect(filteredBody.d.length).to.be.greaterThan(0);
    filteredBody.d.forEach((product) => {
      expect(product.Discontinued).to.equal(false);
      expect(product.ProductName).to.be.a('string').and.not.be.empty;
    });
  });
});
