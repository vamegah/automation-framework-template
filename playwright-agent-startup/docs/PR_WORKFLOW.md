# PR Workflow Guide

This guide walks you through the complete pull request lifecycle for test contributions. Follow each phase in order to produce clean, reviewable, high-quality PRs.

---

## Overview

Every PR passes through five phases:

```
Scout --> Design --> Implement --> Hygiene --> PR Description
  |         |          |            |             |
  |         |          |            |             +-- Fill PR template, link issues
  |         |          |            +-- Lint, clean up, final checks
  |         |          +-- Write tests, use POM, tag properly
  |         +-- Plan test cases, review selector strategy
  +-- Scan for secrets, check coverage gaps
```

---

## 1. Scout Phase

Before writing any code, verify the codebase is clean and you understand the existing coverage.

### Security Scan

Run a scan for secrets and vulnerabilities. Do not skip this step.

```bash
# Check for hardcoded secrets (see docs/SECURITY_SANITIZATION.md for full patterns)
grep -rn "api[_-]key.*=.*['\"]" . --include="*.ts" --include="*.json"
grep -rn "password.*=.*['\"]" . --include="*.ts" --include="*.json"
grep -rn "Bearer " . --include="*.ts"
grep -rn "\.internal\.\|\.local\.\|\.corp\." . --include="*.ts" --include="*.json"
```

Or use Claude Code:
```
Scan for hardcoded secrets, API keys, or tokens in the codebase.
```

### Coverage Check

Identify gaps before writing new tests.

```
Find untested user flows by comparing pages/ objects to tests/ui/ specs.
```

```
Map API endpoints from [source] and identify missing test coverage.
```

### Fix Findings

If the scout phase reveals problems, fix them before proceeding. Security issues take priority and may warrant their own PR.

---

## 2. Design Phase

Plan your tests before writing code. This saves time and produces better test design.

### For UI Tests

1. Identify the user flow to test.
2. Check if a page object already exists in `pages/`. If not, plan one.
3. Review the selector strategy against `docs/QA_CONTEXT.md`:
   - Prefer role-based selectors (`getByRole`)
   - Fall back to test IDs (`getByTestId`)
   - Avoid CSS class selectors
   - Never use XPath
4. Decide on tags: `@ui` is required, add `@smoke` for critical paths.

Use Claude Code:
```
Write a smoke test for the [page name] page using the POM pattern in pages/.
Follow the selector priority from docs/QA_CONTEXT.md.
```

### For API Tests

1. Identify the endpoints to test.
2. Plan scenarios: success (2xx), client error (4xx), auth required (401), not found (404).
3. Determine if you need auth fixtures or test data setup.
4. Decide on tags: `@api` is required, add `@smoke` for critical endpoints.

Use Claude Code:
```
Write API tests for [METHOD] [endpoint] covering: 200 OK, 400 bad request,
401 unauthorized, 404 not found.
```

---

## 3. Implement Phase

Write your tests following the project conventions.

### File Structure

```
pages/
  login.page.ts          <-- Page Object Model (POM) files
  dashboard.page.ts

tests/
  ui/
    login.spec.ts        <-- UI test specs
    dashboard.spec.ts
  api/
    users.spec.ts        <-- API test specs
    auth.spec.ts
  fixtures/
    base.fixture.ts      <-- Shared fixtures (auth, test data, etc.)
```

### Implementation Checklist

- [ ] Page objects go in `pages/` with the `.page.ts` suffix
- [ ] Test specs go in `tests/ui/` or `tests/api/` with the `.spec.ts` suffix
- [ ] Use fixtures from `tests/fixtures/base.fixture.ts` for shared setup
- [ ] Follow selector priority: role > testid > text > css (see `docs/QA_CONTEXT.md`)
- [ ] Follow wait strategy: no `waitForTimeout`, use `toBeVisible`, `waitForResponse`, etc.
- [ ] Tag every test: `@ui`/`@api` + `@smoke`/`@regression`
- [ ] Keep tests independent -- no test should depend on another test's state

### Run Tests Locally

Always run tests before pushing.

```bash
# Run all tests
npm test

# Run only the tests you changed
npx playwright test tests/ui/login.spec.ts

# Run in headed mode to watch the browser
npx playwright test --headed tests/ui/login.spec.ts

# Run with debug inspector
npm run test:debug

# Run only smoke tests
npx playwright test --grep "@smoke"
```

---

## 4. Hygiene Phase

Clean up your code before opening a PR. Reviewers should not have to point out lint errors or leftover debug code.

### Lint

```bash
npm run lint
```

Fix all warnings and errors. Do not suppress warnings without a comment explaining why.

### Automated Checks

Review your changes against these rules:

| Check | Command / Action |
|---|---|
| No `.only` in tests | Search for `test.only` or `describe.only` |
| No `.skip` without reason | Search for `test.skip` -- if intentional, add a comment |
| No `console.log` | Remove all debug logging |
| No hardcoded URLs | Use environment variables or config for base URLs |
| No hardcoded credentials | Use environment variables or fixtures |
| No `waitForTimeout` | Replace with proper waits (see `docs/QA_CONTEXT.md`) |
| Proper tags | Every test has `@ui` or `@api` tag |

### Quick Hygiene Scan

Use Claude Code:
```
Run pr-hygiene checks on my staged changes. Check for .only, .skip,
console.log, hardcoded URLs, missing tags, and bad wait patterns.
```

### Review Diff Size

Check if your PR is within the recommended size:

```bash
git diff --stat main
```

Target: **~400 lines or fewer**. If larger, consider splitting into multiple PRs (see PR Slicing Guidelines in `docs/QA_CONTEXT.md`).

---

## 5. PR Description Phase

A clear PR description helps reviewers understand your changes quickly.

### Use the PR Template

If the repository includes `.github/pull_request_template.md`, the template auto-populates when you create a PR on GitHub. Fill in every section:

1. **Summary**: What did you change and why? (2-3 sentences)
2. **Type of change**: New tests, bug fix, refactor, config change
3. **Test coverage**: Which tests were added or modified?
4. **Checklist**: Confirm lint passes, tests pass, no secrets, tags applied

### Example PR Description

```markdown
## Summary
Added smoke tests for the login page covering valid login, invalid credentials,
and account lockout scenarios. Created a new LoginPage page object.

## Type of Change
- [x] New tests
- [ ] Bug fix
- [ ] Refactor
- [ ] Configuration

## Test Coverage
- tests/ui/login.spec.ts: 3 new tests (@ui @smoke)
- pages/login.page.ts: new page object

## Checklist
- [x] Tests pass locally (`npm test`)
- [x] Lint passes (`npm run lint`)
- [x] No hardcoded secrets or URLs
- [x] Tests are tagged (@ui, @smoke)
- [x] Selectors follow priority (role > testid > css)
- [x] No .only or .skip left in test files
```

### Link Issues

If your PR addresses an issue or ticket, link it:

```markdown
Closes #42
Relates to #38
```

---

## Quick Commands Reference

```bash
# Linting & formatting
npm run lint              # Check code style

# Running tests
npm test                  # Run all tests
npm run test:ui           # Run UI tests only
npm run test:api          # Run API tests only
npm run test:debug        # Debug mode with Playwright inspector

# Reports
npm run report            # Open the HTML test report

# Playwright utilities
npx playwright show-report           # Open last test report
npx playwright test --headed         # Run with visible browser
npx playwright test --grep "@smoke"  # Run only smoke-tagged tests
npx playwright test --project=firefox  # Run in a specific browser
npx playwright codegen [URL]         # Record interactions to generate code

# Git helpers
git diff --stat main      # Check PR size against main branch
git log --oneline -10     # View recent commits
```

---

## Troubleshooting

### Tests pass locally but fail in CI

- Check if CI installs Playwright browsers: `npx playwright install --with-deps`
- Verify environment variables are set in CI config
- Check if the application under test is accessible from the CI environment

### Tests are flaky

- Review wait strategy (see `docs/QA_CONTEXT.md`)
- Check for shared state between tests
- Look for race conditions with network requests
- Use `--repeat-each 5` to reproduce: `npx playwright test [file] --repeat-each 5`

### Cannot find page object or fixture

- Verify import paths use the correct relative path
- Check that the file suffix is correct (`.page.ts` for pages, `.fixture.ts` for fixtures)
- Ensure the export is named correctly
