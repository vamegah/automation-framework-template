import { test, expect } from '../fixtures/base.fixture';

test.describe('Sling Academy Products API @api', () => {
  test('returns a valid product collection payload', async ({ apiContext }) => {
    const response = await apiContext.get('https://api.slingacademy.com/v1/sample-data/products');

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type'] ?? '').toContain('application/json');

    const body = await response.json() as {
      success: boolean;
      total_products: number;
      products: Array<{ id: number; name: string; price: number; category: string; photo_url: string }>;
    };

    expect(body.success).toBeTruthy();
    expect(body.total_products).toBeGreaterThan(0);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products[0].id).toBeGreaterThan(0);
    expect(body.products[0].name.length).toBeGreaterThan(0);
    expect(typeof body.products[0].category).toBe('string');
  });
});
