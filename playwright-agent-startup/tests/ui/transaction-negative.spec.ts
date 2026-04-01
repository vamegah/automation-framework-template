import { test, expect } from '../fixtures/base.fixture';
import { BillPayPage } from '../../pages/bill-pay.page';
import { RequestLoanPage } from '../../pages/request-loan.page';
import { FindTransactionsPage } from '../../pages/find-transactions.page';
import { AccountActivityPage } from '../../pages/account-activity.page';
import { TestData } from '../../utils';

test.describe('ParaBank Negative Transaction Coverage @ui @unstable', () => {
  test('bill pay shows required-field validation when submitted empty', async ({ page }) => {
    const billPayPage = new BillPayPage(page);

    await billPayPage.navigate();
    await billPayPage.submitEmpty();

    await expect(billPayPage.payeeNameError).toHaveText('Payee name is required.');
    await expect(billPayPage.addressError).toHaveText('Address is required.');
    await expect(billPayPage.cityError).toHaveText('City is required.');
    await expect(billPayPage.stateError).toHaveText('State is required.');
    await expect(billPayPage.zipCodeError).toHaveText('Zip Code is required.');
    await expect(billPayPage.phoneNumberError).toHaveText('Phone number is required.');
    await expect(billPayPage.accountEmptyError).toHaveText('Account number is required.');
    await expect(billPayPage.amountEmptyError).toHaveText('The amount cannot be empty.');
  });

  test('bill pay blocks mismatched account confirmation', async ({ page }) => {
    const billPayPage = new BillPayPage(page);
    const payment = TestData.billPay();

    await billPayPage.navigate();
    await billPayPage.submitWithMismatchedAccounts(payment);
    await expect(billPayPage.verifyAccountMismatchError).toHaveText('The account numbers do not match.');
  });

  test('loan request shows a denial when the amount exceeds available funds', async ({ page }) => {
    const requestLoanPage = new RequestLoanPage(page);

    await requestLoanPage.navigate();
    await requestLoanPage.requestLoanAndExpectDenial('1000000', '1', /cannot grant a loan in that amount with your available funds/i);
  });

  test('find transactions can return a valid no-results state @unstable', async ({ page }) => {
    const findTransactionsPage = new FindTransactionsPage(page);

    await findTransactionsPage.navigate();
    const accountId = await findTransactionsPage.accountSelect.inputValue();
    await findTransactionsPage.findByAmountAndExpectNoResults(accountId, '999999');
  });

  test('account activity shows details and supports a no-results filter state', async ({ page }) => {
    const accountActivityPage = new AccountActivityPage(page);

    await accountActivityPage.navigateToFirstAccount();
    await accountActivityPage.expectDetailsLoaded();
    await accountActivityPage.filter('January', 'Debit');
    await expect(accountActivityPage.noTransactionsMessage).toContainText('No transactions found.');
  });
});
