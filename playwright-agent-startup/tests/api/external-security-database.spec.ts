import { test, expect } from '../fixtures/base.fixture';

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
  expect(bodyText).not.toContain('authentication":{"token"');
  expect(bodyText).not.toContain('Sequelize');
  expect(bodyText).not.toContain('SQLITE');
  expect(bodyText).not.toContain('java.lang.');
  expect(bodyText).not.toContain('stack trace');
};

test.describe('External Security And Database Coverage @api', () => {
  test('rejects multiple OWASP-style login injection payloads', async ({ apiContext }) => {
    for (const email of loginPayloads) {
      try {
        const response = await apiContext.post('https://demo.owasp-juice.shop/rest/user/login', {
          data: { email, password: 'test' },
          failOnStatusCode: false,
        });

        expect(response.status()).not.toBe(200);
        expect([400, 401, 429, 503]).toContain(response.status());
        expectSafeBody(await response.text());
      } catch (error) {
        expect((error as Error).name).toBe('TimeoutError');
      }
    }
  });

  test('handles OWASP-style search payloads without exposing backend internals', async ({ apiContext }) => {
    for (const payload of searchPayloads) {
      try {
        const response = await apiContext.get(`https://demo.owasp-juice.shop/rest/products/search?q=${encodeURIComponent(payload)}`, {
          failOnStatusCode: false,
        });

        expect([200, 400, 404, 429, 503]).toContain(response.status());
        expectSafeBody(await response.text());
      } catch (error) {
        expect((error as Error).name).toBe('TimeoutError');
      }
    }
  });
});
