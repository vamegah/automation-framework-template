import { test, expect } from '../fixtures/base.fixture';
import { runAxeAudit, writeAccessibilityArtifact } from '../fixtures/axe.fixture';

const getHighImpactViolations = async (
  page: Parameters<typeof runAxeAudit>[0],
  testInfo: Parameters<typeof writeAccessibilityArtifact>[0],
  input: { suiteName: string; testName: string; pageName: string },
) => {
  const results = await runAxeAudit(page);
  const highImpactViolations = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );
  await writeAccessibilityArtifact(testInfo, {
    ...input,
    url: page.url(),
    violations: highImpactViolations,
  });
  return highImpactViolations;
};

test.describe('ParaBank Internal Accessibility @ui', () => {
  test('home page surfaces representative serious and critical axe findings', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect
      .poll(async () => {
        const hasLoggedOutShell = await page.getByRole('heading', { name: 'Customer Login' }).isVisible().catch(() => false);
        const hasLoggedInShell = await page.getByRole('heading', { name: 'Account Services' }).isVisible().catch(() => false);
        return hasLoggedOutShell || hasLoggedInShell;
      })
      .toBe(true);

    const highImpactViolations = await getHighImpactViolations(page, testInfo, {
      suiteName: 'ParaBank Internal Accessibility',
      testName: 'home page surfaces representative serious and critical axe findings',
      pageName: 'home',
    });
    expect(highImpactViolations.length, JSON.stringify(highImpactViolations, null, 2)).toBeGreaterThan(0);
    const violationIds = highImpactViolations.map((violation) => violation.id);
    expect(violationIds).toEqual(expect.arrayContaining(['html-has-lang', 'image-alt', 'link-name']));
    expect(violationIds.some((violationId) => violationId === 'label' || violationId === 'color-contrast')).toBe(true);
  });

  test('about page surfaces representative serious and critical axe findings', async ({ page }, testInfo) => {
    await page.goto('about.htm');
    await expect(page.getByRole('heading', { name: 'ParaSoft Demo Website' })).toBeVisible();

    const highImpactViolations = await getHighImpactViolations(page, testInfo, {
      suiteName: 'ParaBank Internal Accessibility',
      testName: 'about page surfaces representative serious and critical axe findings',
      pageName: 'about',
    });
    expect(highImpactViolations.length, JSON.stringify(highImpactViolations, null, 2)).toBeGreaterThan(0);
    const violationIds = highImpactViolations.map((violation) => violation.id);
    expect(violationIds).toEqual(expect.arrayContaining(['color-contrast', 'html-has-lang']));
  });
});
