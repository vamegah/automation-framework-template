const loginPayloads = [
  "' or 1=1 --",
  "admin'--",
  "' UNION SELECT * FROM Users --",
];

const searchPayloads = [
  '<script>alert(1)</script>',
  '../../etc/passwd',
  "' OR 1=1 --",
];

const expectSafeResponse = (bodyText: string) => {
  expect(bodyText).to.not.include('authentication":{"token"');
  expect(bodyText).to.not.include('Sequelize');
  expect(bodyText).to.not.include('SQLITE');
  expect(bodyText).to.not.include('java.lang.');
  expect(bodyText).to.not.include('stack trace');
};

describe('External Security And Database Coverage', () => {
  it('rejects multiple OWASP-style login injection payloads', () => {
    cy.wrap(loginPayloads).each((email) => {
      cy.request({
        method: 'POST',
        url: 'https://demo.owasp-juice.shop/rest/user/login',
        failOnStatusCode: false,
        headers: {
          Accept: 'application/json, text/html',
          'Content-Type': 'application/json',
        },
        body: { email, password: 'test' },
      }).then((response) => {
        expect(response.status).to.not.equal(200);
        expect([400, 401, 429, 503]).to.include(response.status);
        expectSafeResponse(typeof response.body === 'string' ? response.body : JSON.stringify(response.body));
      });
    });
  });

  it('handles OWASP-style search payloads without exposing backend internals', () => {
    cy.wrap(searchPayloads).each((payload) => {
      cy.request({
        method: 'GET',
        url: `https://demo.owasp-juice.shop/rest/products/search?q=${encodeURIComponent(payload)}`,
        failOnStatusCode: false,
        headers: {
          Accept: 'application/json, text/html',
        },
      }).then((response) => {
        expect([200, 400, 404, 429, 503]).to.include(response.status);
        expectSafeResponse(typeof response.body === 'string' ? response.body : JSON.stringify(response.body));
      });
    });
  });
});
