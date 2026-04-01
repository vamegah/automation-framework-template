describe('Sling Academy Products API', () => {
  it('returns a valid product collection payload', () => {
    cy.request('https://api.slingacademy.com/v1/sample-data/products').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers['content-type']).to.include('application/json');
      expect(response.body.success).to.eq(true);
      expect(response.body.total_products).to.be.a('number').and.greaterThan(0);
      expect(response.body.products).to.be.an('array').and.have.length.greaterThan(0);
      expect(response.body.products[0]).to.include.keys('id', 'name', 'price', 'category', 'photo_url');
      expect(response.body.products[0].name).to.be.a('string').and.not.be.empty;
    });
  });
});
