import { strict as assert } from 'node:assert';

describe('Sling Academy Products API', function () {
  this.timeout(30000);

  it('returns a valid product collection payload', async () => {
    const response = await fetch('https://api.slingacademy.com/v1/sample-data/products', {
      headers: {
        Accept: 'application/json',
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.ok, true);

    const body = await response.json() as {
      success: boolean;
      total_products: number;
      products: Array<{ id: number; name: string; price: number; category: string; photo_url: string }>;
    };
    assert.equal(body.success, true);
    assert.equal(body.total_products > 0, true);
    assert.equal(body.products.length > 0, true);
    assert.equal(body.products[0].id > 0, true);
    assert.equal(typeof body.products[0].name, 'string');
    assert.equal(body.products[0].name.length > 0, true);
  });
});
