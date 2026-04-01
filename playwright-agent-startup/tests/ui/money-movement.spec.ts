import { test, expect } from '../fixtures/base.fixture';
import { AccountsPage } from '../../pages/accounts.page';
import { TransferFundsPage } from '../../pages/transfer-funds.page';
import { FindTransactionsPage } from '../../pages/find-transactions.page';
import { BillPayPage } from '../../pages/bill-pay.page';
import { RequestLoanPage } from '../../pages/request-loan.page';
import { TestData } from '../../utils';

test.describe('ParaBank Transactional Coverage @ui @unstable', () => {
  test('authenticated users can transfer funds and find the transaction by amount', async ({ page }) => {
    const accountsPage = new AccountsPage(page);
    const transferFundsPage = new TransferFundsPage(page);
    const findTransactionsPage = new FindTransactionsPage(page);
    const accountIds = await accountsPage.ensureMultipleAccounts();
    const [fromAccountId, toAccountId] = accountIds;
    const amount = `${(Date.now() % 90) + 10}`;

    await transferFundsPage.navigate();
    await transferFundsPage.transfer(amount, fromAccountId, toAccountId);

    await findTransactionsPage.navigate();
    await findTransactionsPage.findByAmount(fromAccountId, amount);
    await expect(findTransactionsPage.resultsTable).toBeVisible();
    await expect(findTransactionsPage.page.getByText(`$${amount}.00`)).toBeVisible();
  });

  test('authenticated users can send a bill payment', async ({ page }) => {
    const billPayPage = new BillPayPage(page);
    const payment = TestData.billPay();

    await billPayPage.navigate();
    await billPayPage.submitPayment(payment);
    await expect(billPayPage.page.locator('#amount')).toHaveText(`$${payment.amount}.00`);
  });

  test('authenticated users can request a loan', async ({ page }) => {
    const requestLoanPage = new RequestLoanPage(page);
    const amount = `${(Date.now() % 400) + 100}`;
    const downPayment = `${Math.max(10, Math.floor(Number(amount) / 5))}`;

    await requestLoanPage.navigate();
    await requestLoanPage.requestLoan(amount, downPayment);
    await expect(requestLoanPage.page.getByText(/Loan Request Processed/i)).toBeVisible();
  });
});
