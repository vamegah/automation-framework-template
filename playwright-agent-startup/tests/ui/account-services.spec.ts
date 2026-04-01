import { test, expect } from '../fixtures/base.fixture';
import { AccountsPage } from '../../pages/accounts.page';
import { UpdateProfilePage } from '../../pages/update-profile.page';
import { TestData } from '../../utils';

test.describe('ParaBank Account Services Coverage @ui @unstable', () => {
  test('authenticated users can see the main account services navigation', async ({ page }) => {
    const accountsPage = new AccountsPage(page);

    await accountsPage.navigateToOverview();
    await accountsPage.expectAuthenticatedShell();
    await expect(accountsPage.pageTitle).toBeVisible();
    await expect(accountsPage.accountsTable).toBeVisible();
    await expect(accountsPage.transferFundsLink).toBeVisible();
    await expect(accountsPage.billPayLink).toBeVisible();
    await expect(accountsPage.findTransactionsLink).toBeVisible();
    await expect(accountsPage.updateContactInfoLink).toBeVisible();
    await expect(accountsPage.requestLoanLink).toBeVisible();
  });

  test('authenticated users can update their contact information', async ({ page }) => {
    const updateProfilePage = new UpdateProfilePage(page);
    const address = TestData.address();
    const phoneNumber = `555${Date.now().toString().slice(-7)}`;

    await updateProfilePage.navigate();
    await updateProfilePage.updateProfile({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zip,
      phoneNumber,
    });
    await expect(updateProfilePage.successHeading).toBeVisible();
  });
});
