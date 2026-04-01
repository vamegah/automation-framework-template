describe('Northwind Database Coverage', () => {
  it('verifies the Northwind products endpoint supports expanded category and supplier joins', () => {
    cy.request({
      url: 'https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$top=2&$expand=Category,Supplier',
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      const body = response.body as {
        d: Array<{
          ProductID: number;
          ProductName: string;
          Category: { CategoryID: number; CategoryName: string };
          Supplier: { SupplierID: number; CompanyName: string };
        }>;
      };

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
      expect(body.d).to.have.length.greaterThan(0);
      expect(body.d[0].ProductID).to.be.greaterThan(0);
      expect(body.d[0].ProductName).to.be.a('string').and.not.be.empty;
      expect(body.d[0].Category.CategoryID).to.be.greaterThan(0);
      expect(body.d[0].Category.CategoryName).to.be.a('string').and.not.be.empty;
      expect(body.d[0].Supplier.SupplierID).to.be.greaterThan(0);
      expect(body.d[0].Supplier.CompanyName).to.be.a('string').and.not.be.empty;
    });
  });

  it('verifies Northwind category joins and filter queries return consistent product data', () => {
    cy.request('https://services.odata.org/V2/Northwind/Northwind.svc/Categories(1)?$format=json&$expand=Products')
      .then((response) => {
        const body = response.body as {
          d: {
            CategoryID: number;
            CategoryName: string;
            Products: { results: Array<{ ProductID: number; CategoryID: number }> };
          };
        };

        expect(response.status).to.equal(200);
        expect(body.d.CategoryName).to.be.a('string').and.not.be.empty;
        expect(body.d.Products.results).to.have.length.greaterThan(0);
        expect(body.d.Products.results[0].CategoryID).to.equal(body.d.CategoryID);
      });

    cy.request('https://services.odata.org/V2/Northwind/Northwind.svc/Products?$format=json&$filter=Discontinued%20eq%20false&$top=3')
      .then((response) => {
        const body = response.body as {
          d: Array<{ Discontinued: boolean; ProductName: string }>;
        };

        expect(response.status).to.equal(200);
        expect(body.d).to.have.length.greaterThan(0);
        body.d.forEach((product) => {
          expect(product.Discontinued).to.equal(false);
          expect(product.ProductName).to.be.a('string').and.not.be.empty;
        });
      });
  });
});
