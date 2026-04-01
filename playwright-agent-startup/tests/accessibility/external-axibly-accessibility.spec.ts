import { test, expect } from '../fixtures/base.fixture';
import { runAxeAudit, writeAccessibilityArtifact } from '../fixtures/axe.fixture';

test.describe('Axibly Accessibility Demo @ui', () => {
  test('verifies the accessible demo passes real axe-core assertions and stronger heuristics', async ({ page }, testInfo) => {
    await page.goto('https://axibly.ai/demo/accessible');

    await expect(page.getByRole('heading', { level: 1, name: 'Accessible Demo Page' })).toBeVisible();
    await expect(page.locator('#name-input')).toBeVisible();
    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.getByRole('button', { name: /click me/i })).toBeVisible();

    const axeResults = await runAxeAudit(page);
    await writeAccessibilityArtifact(testInfo, {
      suiteName: 'Axibly Accessibility Demo',
      testName: 'verifies the accessible demo passes real axe-core assertions and stronger heuristics',
      pageName: 'accessible',
      url: page.url(),
      violations: axeResults.violations,
    });
    expect(axeResults.violations).toHaveLength(0);

    const audit = await page.evaluate(() => {
      const getAccessibleName = (element: Element) =>
        (element.getAttribute('aria-label')
          || element.getAttribute('title')
          || element.textContent
          || '')
          .trim();
      const controls = Array.from(document.querySelectorAll('input, select, textarea'));
      const labelledControls = controls.filter((control) => {
        const id = control.getAttribute('id');
        const hasLabel = !!(id && document.querySelector(`label[for="${id}"]`));
        return hasLabel || !!control.getAttribute('aria-label') || !!control.getAttribute('aria-labelledby');
      });
      const interactiveWithoutName = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .filter((element) => getAccessibleName(element).length === 0);

      return {
        h1Count: document.querySelectorAll('h1').length,
        labelledControls: labelledControls.length,
        meaningfulAltCount: Array.from(document.querySelectorAll('img'))
          .filter((img) => (img.getAttribute('alt') ?? '').trim().length > 0).length,
        genericLinkTextCount: Array.from(document.querySelectorAll('a'))
          .filter((link) => (link.textContent ?? '').trim().toLowerCase() === 'click here').length,
        missingAltCount: document.querySelectorAll('img:not([alt]), img[alt=""]').length,
        interactiveWithoutName: interactiveWithoutName.length,
      };
    });

    expect(audit.h1Count).toBe(1);
    expect(audit.labelledControls).toBeGreaterThan(1);
    expect(audit.meaningfulAltCount).toBeGreaterThan(0);
    expect(audit.genericLinkTextCount).toBe(0);
    expect(audit.missingAltCount).toBe(0);
    expect(audit.interactiveWithoutName).toBe(0);
  });

  test('detects real axe-core violations on the inaccessible demo', async ({ page }, testInfo) => {
    await page.goto('https://axibly.ai/demo/inaccessible');

    await expect(page.getByRole('heading', { level: 1, name: 'Inaccessible Demo Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'click here' }).first()).toBeVisible();
    await expect(page.getByText('Div used as button')).toBeVisible();

    const axeResults = await runAxeAudit(page);
    await writeAccessibilityArtifact(testInfo, {
      suiteName: 'Axibly Accessibility Demo',
      testName: 'detects real axe-core violations on the inaccessible demo',
      pageName: 'inaccessible',
      url: page.url(),
      violations: axeResults.violations,
    });
    const violations = axeResults.violations;
    expect(violations.length).toBeGreaterThan(0);
    const violationIds = violations.map((violation) => violation.id);
    expect(violationIds).toEqual(expect.arrayContaining(['image-alt', 'link-name']));

    const audit = await page.evaluate(() => ({
      labelCount: document.querySelectorAll('label').length,
      genericLinkTextCount: Array.from(document.querySelectorAll('a'))
        .filter((link) => (link.textContent ?? '').trim().toLowerCase() === 'click here').length,
      missingAltCount: document.querySelectorAll('img:not([alt]), img[alt=""]').length,
      nonSemanticInteractiveCount: Array.from(document.querySelectorAll('div, span'))
        .filter((element) => {
          const text = (element.textContent ?? '').trim();
          return text === 'Div used as button'
            || element.hasAttribute('onclick')
            || element.getAttribute('tabindex') !== null;
        }).length,
    }));

    expect(audit.labelCount).toBeLessThan(2);
    expect(audit.genericLinkTextCount).toBeGreaterThan(0);
    expect(audit.missingAltCount).toBeGreaterThan(0);
  });
});
