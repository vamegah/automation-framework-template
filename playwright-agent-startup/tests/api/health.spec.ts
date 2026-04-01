import { test, expect } from '../fixtures/base.fixture';

/**
 * API Health Check Tests - @api
 *
 * These tests verify basic API testing patterns using httpbin.org,
 * a freely available HTTP testing service. They serve as:
 *   1. Proof that the framework works out of the box
 *   2. Examples of common API test patterns to adapt to your own API
 *
 * When you're ready to test your own API:
 *   1. Set API_BASE_URL in your .env file
 *   2. Replace the httpbin.org endpoints below with your real endpoints
 *
 * @see https://playwright.dev/docs/api-testing
 * @see https://httpbin.org — public HTTP testing service
 */

test.describe('API Health Check Tests @api', () => {

  test('GET request returns 200 @smoke', async ({ apiContext }) => {
    // Send a GET request and verify a successful response.
    // httpbin.org/get echoes back the request details.
    //
    // Adapt: Replace with your health check endpoint, e.g. '/api/health'
    const response = await apiContext.get('/get');

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
  });

  test('GET /status/:code returns expected status', async ({ apiContext }) => {
    // Negative test: verify that the framework correctly captures
    // non-200 status codes.
    //
    // Adapt: Replace with a known 404 route on your API, e.g. '/api/nonexistent'
    const response = await apiContext.get('/status/404');

    expect(response.status()).toBe(404);
    expect(response.ok()).toBeFalsy();
  });

  test('response has valid JSON structure', async ({ apiContext }) => {
    // Verify that the API returns well-formed JSON with the correct
    // Content-Type header. This is a baseline contract test.
    //
    // Adapt: Replace with your actual JSON endpoint
    const response = await apiContext.get('/get');

    // Check Content-Type header includes 'application/json'
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // Parse the response body — this will throw if not valid JSON
    const body = await response.json();

    // Assert the body is a non-null object
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();

    // httpbin.org/get returns { url, headers, origin, args }
    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('headers');
  });

  test('API responds within acceptable time', async ({ apiContext }) => {
    // Performance baseline: verify the endpoint responds quickly.
    // Adjust the threshold based on your SLA requirements.
    //
    // Adapt: Replace with your health check or critical endpoint
    const startTime = Date.now();

    const response = await apiContext.get('/get');

    const duration = Date.now() - startTime;

    // Assert response was received within 5 seconds (generous for a public API)
    // Tighten this threshold for your own API (e.g., 500ms for a health check)
    expect(duration).toBeLessThan(5000);
    expect(response.ok()).toBeTruthy();
  });

  test('POST with JSON body returns expected data', async ({ apiContext }) => {
    // Verify that the framework can send JSON payloads and parse responses.
    // httpbin.org/post echoes back whatever you send.
    //
    // Adapt: Replace with a real POST endpoint from your API
    const payload = { name: 'test-user', email: 'test@example.com' };

    const response = await apiContext.post('/post', {
      data: payload,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('json');
    expect(body.json).toEqual(payload);
  });
});
