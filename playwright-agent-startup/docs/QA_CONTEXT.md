# QA Context & Conventions

This document defines the testing scope, selector strategy, wait patterns, PR guidelines, and tagging conventions for this Playwright TypeScript test framework. Every contributor should read this before writing or reviewing tests.

---

## Scope Rules

### What This Framework Covers

| Category | Examples |
|---|---|
| **UI Smoke Tests** | Login flow, navigation, critical user journeys |
| **API Integration Tests** | REST endpoint validation, request/response contracts, auth flows |
| **Cross-Browser Testing** | Chromium, Firefox, WebKit via Playwright projects |
| **End-to-End Flows** | Multi-step user workflows spanning UI and API |

### What This Framework Does NOT Cover

| Category | Suggested Tools |
|---|---|
| **Unit Tests** | Jest, Vitest, Mocha |
| **Performance / Load Tests** | k6, Artillery, Locust, Gatling |
| **Visual Regression** | Playwright visual comparisons (`toHaveScreenshot()`), Percy, Chromatic |
| **Accessibility Audits** | axe-core, Playwright + @axe-core/playwright |
| **Security Scanning** | OWASP ZAP, Snyk, npm audit |

### Test Pyramid Guidance

```
         /  \          <-- Few E2E tests (this framework)
        / E2E \             Slow, expensive, high confidence
       /-------\
      /  Integ  \      <-- API & integration tests (this framework)
     /-----------\          Medium speed, medium confidence
    /    Unit     \    <-- Many unit tests (separate repo/framework)
   /_______________\        Fast, cheap, low-level confidence
```

Tests in this framework live at the **top two layers** of the pyramid. They are slower and more expensive to run than unit tests, so keep them focused on critical paths and user-visible behavior. Avoid duplicating logic that unit tests already cover.

---

## Selector Priority (CRITICAL)

Use the most resilient selector available. Fragile selectors cause flaky tests and painful maintenance.

### 1. Role-Based (PREFERRED)

Accessible roles produce the most resilient, user-centric selectors. They survive CSS refactors and class name changes.

```typescript
// BEST: Uses ARIA role + accessible name
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('heading', { name: 'Dashboard' }).isVisible();
await page.getByRole('link', { name: 'Sign Up' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
await page.getByRole('checkbox', { name: 'Remember me' }).check();
```

### 2. Test ID (When Role Is Not Sufficient)

Use `data-testid` attributes when no semantic role exists or when the element lacks a unique accessible name.

```typescript
// GOOD: Explicit test hook, immune to text/style changes
await page.getByTestId('login-form').isVisible();
await page.getByTestId('user-avatar-dropdown').click();
await page.getByTestId('search-results-count').textContent();
```

### 3. Text (For Assertions, Avoid for Actions)

Text selectors are useful for verifying visible content but are brittle for interactions because text changes with copy updates and i18n.

```typescript
// OK for assertions
await expect(page.getByText('Welcome back')).toBeVisible();
await expect(page.getByText('3 items in cart')).toBeVisible();

// AVOID for actions — text may change
// BAD: await page.getByText('Click here').click();
// GOOD: await page.getByRole('button', { name: 'Click here' }).click();
```

### 4. CSS (Avoid -- Fragile)

CSS selectors break when designers rename classes or restructure markup. Use only as a last resort when no better option exists.

```typescript
// AVOID: Breaks when class names change
await page.locator('.btn-primary').click();
await page.locator('#main-content .card:first-child').click();

// If you must use CSS, prefer stable attributes
await page.locator('[data-testid="submit-btn"]').click(); // Equivalent to getByTestId
```

### 5. XPath (NEVER Unless Absolutely No Alternative)

XPath selectors are the most fragile. They break on any DOM structure change. If you find yourself reaching for XPath, reconsider your approach or add a `data-testid` to the markup.

```typescript
// NEVER do this
await page.locator('//div[@class="container"]/form/button[2]').click();

// Instead, ask the dev team to add a data-testid:
await page.getByTestId('secondary-submit').click();
```

---

## Wait Strategy (CRITICAL)

Playwright auto-waits for elements to be actionable before performing actions. Leverage this. Never add artificial delays.

### NEVER Use Hard Waits

```typescript
// BAD: Arbitrary delay. Slows tests, still flaky.
await page.waitForTimeout(3000);

// BAD: Same problem, different syntax
await new Promise(resolve => setTimeout(resolve, 2000));
```

### ALWAYS Use Explicit Conditions

**Wait for element state:**
```typescript
// Wait for an element to appear and be visible
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

// Wait for an element to disappear (e.g., loading spinner)
await expect(page.getByTestId('loading-spinner')).toBeHidden();

// Wait for element to contain specific text
await expect(page.getByTestId('status')).toHaveText('Complete');
```

**Wait for page/navigation state:**
```typescript
// Wait for navigation to complete
await page.waitForURL('**/dashboard');

// Wait for network to settle
await page.waitForLoadState('networkidle');

// Wait for DOM to be fully loaded
await page.waitForLoadState('domcontentloaded');
```

**Wait for network responses:**
```typescript
// Wait for a specific API call to complete
const responsePromise = page.waitForResponse(
  response => response.url().includes('/api/users') && response.status() === 200
);
await page.getByRole('button', { name: 'Load Users' }).click();
const response = await responsePromise;
```

**Wait for a specific condition with polling:**
```typescript
// Playwright's expect auto-retries with a timeout
await expect(page.getByTestId('item-count')).toHaveText('5', { timeout: 10000 });

// Use expect.poll for custom conditions
await expect.poll(async () => {
  const items = await page.getByTestId('list-item').count();
  return items;
}).toBeGreaterThan(0);
```

### Auto-Waiting Explained

Playwright actions (`click`, `fill`, `check`, etc.) automatically wait for the target element to be:

1. **Attached** to the DOM
2. **Visible** on screen
3. **Stable** (not animating)
4. **Enabled** (not disabled)
5. **Receiving events** (not obscured by another element)

This means most of the time, you do not need explicit waits at all:

```typescript
// Playwright automatically waits for the button to be clickable
await page.getByRole('button', { name: 'Submit' }).click();

// Playwright automatically waits for the input to be ready
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
```

### DO / DON'T Summary

| DO | DON'T |
|---|---|
| `await expect(locator).toBeVisible()` | `await page.waitForTimeout(2000)` |
| `await page.waitForURL('**/path')` | `await sleep(1000)` |
| `await page.waitForResponse(...)` | `await new Promise(r => setTimeout(r, ...))` |
| `await page.waitForLoadState('networkidle')` | Arbitrary `setTimeout` wrappers |
| `await expect.poll(() => ...).toBe(...)` | Retry loops with `sleep` inside |

---

## PR Slicing Guidelines

Small, focused PRs are easier to review, less likely to introduce bugs, and faster to merge.

### Rules

- **One feature = one PR.** A new page object + its tests = one PR.
- **One bug fix = one PR.** Fix flaky test + root cause explanation = one PR.
- **Test-only changes are valid PRs.** Adding tests for existing code is valuable.
- **Max ~400 lines per PR** for reviewability. If it is larger, split it.
- **Include test + implementation in the same PR.** Do not merge untested code.

### Examples of Good PR Scope

| PR Title | Contents |
|---|---|
| "Add login page smoke tests" | `pages/login.page.ts` + `tests/ui/login.spec.ts` |
| "Add API tests for /users endpoint" | `tests/api/users.spec.ts` |
| "Fix flaky navigation test" | Fix in spec file + updated wait strategy |
| "Update selectors to use role-based locators" | Refactor across affected files |

### Examples of Bad PR Scope

| PR Title | Problem |
|---|---|
| "Add all page objects and tests" | Too large, impossible to review |
| "Fix tests + add new feature + update config" | Multiple concerns, split them |

---

## Test Tagging Convention

Tags go in the test title string. Use them to organize test execution into logical suites.

### Standard Tags

| Tag | Meaning | When to Use |
|---|---|---|
| `@ui` | UI / browser test | Any test that opens a browser |
| `@api` | API / HTTP test | Any test that calls REST endpoints directly |
| `@smoke` | Critical path | Tests that must pass on every deploy |
| `@regression` | Full coverage | Thorough tests run on schedule or before release |

### How to Apply Tags

```typescript
import { test, expect } from '@playwright/test';

test('user can log in with valid credentials @ui @smoke', async ({ page }) => {
  // This test runs in both the @ui and @smoke suites
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('securepassword');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('GET /api/users returns 200 @api @smoke', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);
});

test('user profile shows order history @ui @regression', async ({ page }) => {
  // Full regression test, not needed on every deploy
  // ...
});
```

### Running Tagged Tests

```bash
# Run only smoke tests
npx playwright test --grep "@smoke"

# Run only UI tests
npx playwright test --grep "@ui"

# Run only API tests
npx playwright test --grep "@api"

# Run smoke tests that are also UI tests
npx playwright test --grep "(?=.*@smoke)(?=.*@ui)"

# Exclude regression tests (run everything except @regression)
npx playwright test --grep-invert "@regression"
```
