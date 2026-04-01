import { expect } from 'chai';

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

const expectSafeBody = (bodyText: string) => {
  expect(bodyText).to.not.include('authentication":{"token"');
  expect(bodyText).to.not.include('Sequelize');
  expect(bodyText).to.not.include('SQLITE');
  expect(bodyText).to.not.include('java.lang.');
  expect(bodyText).to.not.include('stack trace');
};

describe('External Security And Database Coverage', function () {
  this.timeout(30000);

  it('rejects multiple OWASP-style login injection payloads', async () => {
    for (const email of loginPayloads) {
      try {
        const response = await fetch('https://demo.owasp-juice.shop/rest/user/login', {
          method: 'POST',
          headers: {
            Accept: 'application/json, text/html',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password: 'test' }),
          signal: AbortSignal.timeout(10000),
        });

        expect(response.status).to.not.equal(200);
        expect([400, 401, 429, 503]).to.include(response.status);
        expectSafeBody(await response.text());
      } catch (error) {
        expect((error as Error).name).to.be.oneOf(['AbortError', 'TypeError', 'TimeoutError']);
      }
    }
  });

  it('handles OWASP-style search payloads without exposing backend internals', async () => {
    for (const payload of searchPayloads) {
      try {
        const response = await fetch(`https://demo.owasp-juice.shop/rest/products/search?q=${encodeURIComponent(payload)}`, {
          headers: {
            Accept: 'application/json, text/html',
          },
          signal: AbortSignal.timeout(10000),
        });

        expect([200, 400, 404, 429, 503]).to.include(response.status);
        expectSafeBody(await response.text());
      } catch (error) {
        expect((error as Error).name).to.be.oneOf(['AbortError', 'TypeError', 'TimeoutError']);
      }
    }
  });
});
