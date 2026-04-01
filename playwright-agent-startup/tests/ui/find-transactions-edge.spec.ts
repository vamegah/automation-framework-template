import { test, expect } from '../fixtures/base.fixture';
import { FindTransactionsPage } from '../../pages/find-transactions.page';

test.describe('ParaBank Transaction Search Edge Cases @ui', () => {
  test('find transactions validates non-numeric transaction ids', async ({ page }) => {
    const findTransactionsPage = new FindTransactionsPage(page);

    await findTransactionsPage.navigate();
    await findTransactionsPage.submitInvalidTransactionId('abc');
    await expect(findTransactionsPage.transactionIdError).toHaveText('Invalid transaction ID');
  });

  test('find transactions validates non-numeric amounts', async ({ page }) => {
    const findTransactionsPage = new FindTransactionsPage(page);

    await findTransactionsPage.navigate();
    await findTransactionsPage.submitInvalidAmount('abc');
    await expect(findTransactionsPage.amountError).toHaveText('Invalid amount');
  });

  test('find transactions validates malformed dates', async ({ page }) => {
    const findTransactionsPage = new FindTransactionsPage(page);

    await findTransactionsPage.navigate();
    await findTransactionsPage.submitInvalidDate('bad-date');
    await expect(findTransactionsPage.transactionDateError).toHaveText('Invalid date format');
  });

  test('find transactions validates malformed date ranges', async ({ page }) => {
    const findTransactionsPage = new FindTransactionsPage(page);

    await findTransactionsPage.navigate();
    await findTransactionsPage.submitInvalidDateRange('bad-date', 'still-bad');
    await expect(findTransactionsPage.dateRangeError).toHaveText('Invalid date format');
  });
});
