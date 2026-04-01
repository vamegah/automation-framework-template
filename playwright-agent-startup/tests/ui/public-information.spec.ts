import { test, expect } from '../fixtures/base.fixture';

test.describe('ParaBank Public Information Coverage @ui', () => {
  test('about page shows the demo website overview', async ({ page }) => {
    await page.goto('about.htm');

    await expect(page).toHaveTitle(/About Us/i);
    await expect(page.getByRole('heading', { name: 'ParaSoft Demo Website' })).toBeVisible();
    await expect(page.getByText(/ParaBank is a demo site/i)).toBeVisible();
  });

  test('services page exposes the service documentation links', async ({ page }) => {
    await page.goto('services.htm');

    await expect(page).toHaveTitle(/Services/i);
    await expect(page.locator('a[href*="api-docs"]')).toBeVisible();
    await expect(page.locator('a[href*="?wsdl"]').first()).toBeVisible();
    await expect(page.locator('a[href*="_wadl"]').first()).toBeVisible();
  });

  test('news page lists the latest ParaBank announcements', async ({ page }) => {
    await page.goto('news.htm');

    await expect(page).toHaveTitle(/News/i);
    await expect(page.getByRole('heading', { name: 'ParaBank News' })).toBeVisible();
    await expect(page.getByText('ParaBank Is Now Re-Opened')).toBeVisible();
    await expect(page.getByText('New! Online Bill Pay')).toBeVisible();
  });

  test('site map lists both public and account-service routes', async ({ page }) => {
    await page.goto('sitemap.htm');

    await expect(page).toHaveTitle(/Site Map/i);
    await expect(page.locator('a[href="openaccount.htm"]').first()).toBeVisible();
    await expect(page.locator('a[href="findtrans.htm"]').first()).toBeVisible();
    await expect(page.locator('a[href="requestloan.htm"]').first()).toBeVisible();
  });

  test('admin page exposes the read-only administration sections', async ({ page }) => {
    await page.goto('admin.htm');

    await expect(page).toHaveTitle(/Administration/i);
    await expect(page.getByRole('heading', { name: /Administration/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Database/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Application Settings/i })).toBeVisible();
    await expect(page.locator('#initialBalance')).toHaveValue(/\d+(\.\d+)?/);
    await expect(page.locator('#minimumBalance')).toHaveValue(/\d+(\.\d+)?/);
  });
});
