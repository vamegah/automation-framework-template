import { test, expect } from '../fixtures/base.fixture';

test.describe('Controlled Target Deep Branch Coverage @ui @controlled', () => {
  test('find transactions drill into a deterministic transaction detail page', async ({ page }) => {
    await page.goto('findtrans.htm');
    await page.locator('#accountId').selectOption('1001');
    await page.locator('#amount').fill('45');
    await page.locator('#findByAmount').click();

    await expect(page.getByRole('heading', { name: 'Transaction Results' })).toBeVisible();
    await page.locator('#transactionTable tbody tr a').first().click();

    await expect(page).toHaveURL(/transaction\.htm\?id=90001/);
    await expect(page.getByRole('heading', { name: 'Transaction Details' })).toBeVisible();
    await expect(page.getByText('Transfer to account 1002')).toBeVisible();
    await expect(page.getByText('$45.00')).toBeVisible();
  });

  test('account activity opens a stable transaction details page', async ({ page }) => {
    await page.goto('activity.htm?id=1001');

    await expect(page.getByRole('heading', { name: 'Account Details' })).toBeVisible();
    await expect(page.locator('#accountId')).toHaveText('1001');
    await page.locator('#transactionTable tbody tr a').first().click();

    await expect(page).toHaveURL(/transaction\.htm\?id=90001/);
    await expect(page.getByRole('heading', { name: 'Transaction Details' })).toBeVisible();
    await expect(page.getByText('Debit')).toBeVisible();
  });

  test('bill pay exposes the backend error branch deterministically', async ({ page }) => {
    await page.goto('billpay.htm?fromAccountId=999999');

    await expect(page.getByRole('heading', { name: 'Error!' })).toBeVisible();
    await expect(page.getByText('An internal error has occurred and has been logged.')).toBeVisible();
  });

  test('request loan exposes the insufficient down payment denial variant deterministically', async ({ page }) => {
    await page.goto('requestloan.htm?denial=insufficient-down-payment');

    await expect(page.getByRole('heading', { name: 'Loan Request Processed' })).toBeVisible();
    await expect(page.locator('#loanStatus')).toHaveText('Denied');
    await expect(page.locator('#loanRequestDenied')).toContainText(/sufficient funds for the given down payment/i);
  });

  test('request loan exposes the amount too high denial variant deterministically', async ({ page }) => {
    await page.goto('requestloan.htm?denial=amount-too-high');

    await expect(page.getByRole('heading', { name: 'Loan Request Processed' })).toBeVisible();
    await expect(page.locator('#loanStatus')).toHaveText('Denied');
    await expect(page.locator('#loanRequestDenied')).toContainText(/cannot grant a loan in that amount/i);
  });
});
