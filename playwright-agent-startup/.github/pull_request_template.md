## Summary

<!-- Briefly describe what this PR does and why. -->

## Type of Change

- [ ] New test(s)
- [ ] Bug fix (corrects a failing or flawed test)
- [ ] Refactor (no functional change to test coverage)
- [ ] Configuration change (playwright.config, CI, etc.)
- [ ] Page object / utility update
- [ ] Documentation update

## Test Coverage

<!-- Which features or areas are covered by the tests in this PR? -->

-

## How to Verify

<!-- Steps for a reviewer to run and validate these changes locally. -->

1. `npm install`
2. `npm test` (or the specific test command)
3. `npm run report` to view results

## Checklist

- [ ] Lint passes (`npm run lint`)
- [ ] All tests pass locally (`npm test`)
- [ ] No secrets, credentials, or internal URLs in committed code
- [ ] New selectors use accessible strategies (getByRole, getByLabel, getByTestId)
- [ ] Tests do not use hard-coded waits (`waitForTimeout`) -- use proper Playwright waits
- [ ] Documentation updated if needed
- [ ] PR title follows conventional format (e.g., `feat: ...`, `fix: ...`, `test: ...`)
