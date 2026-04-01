# QA Prompt Library

Copy-paste these prompts into Claude Code to quickly accomplish common QA tasks. Replace placeholders in `[brackets]` with your actual values.

---

## Decision Tree

Use this tree to find the right prompts for your task:

```
What do you need?
|
+-- Write new tests
|   +-- UI test .............. see "UI Test Design" prompts
|   +-- API test ............. see "API Test Design" prompts
|
+-- Review / improve existing tests
|   +-- Flaky test ........... see "Flake Triage" prompts
|   +-- Coverage gaps ........ see "Coverage & Quality" prompts
|
+-- PR workflow
|   +-- Before PR ............ see "PR & Hygiene" prompts
|   +-- Security check ....... see "Security" prompts
|
+-- Documentation
|   +-- Update docs .......... see "Documentation" prompts
|
+-- MCP / tooling
    +-- Browser automation ... see "MCP" prompts
    +-- Test runner .......... see "MCP" prompts
```

---

## UI Test Design

**Write a new smoke test:**
```
Write a smoke test for the [page name] page using the POM pattern in pages/.
Follow the selector priority from docs/QA_CONTEXT.md (role > testid > text > css).
Tag the test with @ui @smoke.
```

**Generate a page object:**
```
Generate a page object for [page URL] following our selector priority
(role > testid > css). Place it in pages/[name].page.ts. Include locators
for all interactive elements and common action methods.
```

**Review selectors in an existing test:**
```
Review selectors in tests/ui/[file] -- flag any CSS or XPath selectors
that should use role-based or testid selectors instead. Show before/after
for each change.
```

**Write a multi-step user flow test:**
```
Write an end-to-end test for this user flow: [describe the flow, e.g.,
"user signs up, verifies email, completes onboarding, lands on dashboard"].
Use page objects from pages/. Tag with @ui @regression.
```

**Add accessibility checks to a test:**
```
Add accessibility assertions to tests/ui/[file] using Playwright's
built-in accessibility snapshot or suggest @axe-core/playwright integration.
```

---

## API Test Design

**Write tests for an endpoint:**
```
Write API tests for [METHOD] [endpoint] covering these scenarios:
- 200 OK with valid request
- 400 Bad Request with invalid payload
- 401 Unauthorized without auth token
- 404 Not Found for missing resource
Use the request fixture. Tag with @api.
```

**Generate test skeleton from OpenAPI spec:**
```
Generate a test skeleton for all endpoints in [OpenAPI spec file or URL].
Create one test file per resource. Cover success and error cases.
Tag all tests with @api.
```

**Test authenticated endpoints:**
```
Write API tests for [endpoint] that requires authentication.
Use the auth fixture to obtain a token, then include it in request headers.
Test both authenticated and unauthenticated scenarios.
```

**Validate response schemas:**
```
Write tests for [endpoint] that validate the response body structure
matches the expected schema. Check required fields, types, and nested objects.
```

---

## Coverage & Quality

**Find untested user flows:**
```
Find untested user flows by comparing page objects in pages/ to test specs
in tests/ui/. List page object methods that are never called in any test.
```

**Map API endpoint coverage:**
```
Map API endpoints from [source: e.g., routes file, OpenAPI spec, or URL]
and identify which endpoints have test coverage in tests/api/ and which
are missing. Output a coverage table.
```

**Check assertion quality:**
```
Review tests in tests/[ui or api]/ and flag tests that are missing
meaningful assertions. A test that only navigates without asserting
outcomes is incomplete.
```

**Find duplicate test coverage:**
```
Scan tests/ for duplicate or overlapping test coverage. Identify tests
that verify the same behavior and suggest consolidation.
```

---

## Flake Triage

**Triage a flaky test:**
```
Triage flaky test "[test name]" -- check traces in test-results/, analyze
the failure pattern, and find the root cause. Suggest a fix following the
wait strategy rules in docs/QA_CONTEXT.md.
```

**Find hard-wait anti-patterns:**
```
List all tests using waitForTimeout, sleep, setTimeout, or any hard wait
pattern. For each occurrence, suggest the proper Playwright wait alternative
(toBeVisible, waitForResponse, waitForURL, etc.).
```

**Analyze test timing:**
```
Review tests in tests/[directory] and identify tests that are likely to
be slow or flaky due to: missing waits, race conditions, shared state
between tests, or reliance on external services without mocking.
```

**Fix a specific failure:**
```
This test is failing with error: "[paste error message]". The test is in
[file path]. Diagnose the issue and provide a fix.
```

---

## PR & Hygiene

**Pre-PR checklist:**
```
Run pr-hygiene checks on my staged changes:
1. Are there any .only or .skip left in test files?
2. Are there console.log statements that should be removed?
3. Are there hardcoded URLs that should use environment variables?
4. Do all tests have proper tags (@ui, @api, @smoke, @regression)?
5. Are selectors following the priority in docs/QA_CONTEXT.md?
```

**Scan for secrets:**
```
Scan the entire codebase for hardcoded secrets, API keys, tokens,
passwords, internal URLs, or private IP addresses. Use the patterns
from docs/SECURITY_SANITIZATION.md.
```

**Lint and format check:**
```
Check if my changes pass linting and formatting rules. Fix any issues
without changing test logic. Show me what was changed.
```

**PR description draft:**
```
Draft a PR description for my current changes using the template in
.github/pull_request_template.md. Summarize what changed, what type
of change it is, and what tests cover it.
```

---

## Security

**Full security scan:**
```
Perform a full security scan of this repository following
docs/SECURITY_SANITIZATION.md. Check for:
- Hardcoded API keys, tokens, passwords
- Internal hostnames or IP addresses
- Real email addresses or personal data
- AWS/cloud credentials
- Files that should not be committed (.env, test-results/)
```

**Sanitize before publishing:**
```
Review all files for anything that should be removed before making this
repository public. Follow the checklist in docs/SECURITY_SANITIZATION.md.
Output a list of files and line numbers that need attention.
```

---

## Documentation

**Update docs after changes:**
```
I just added/changed [describe change]. Update the relevant documentation
in docs/ to reflect this change. Keep the same style and formatting as
existing docs.
```

**Generate JSDoc for page objects:**
```
Add JSDoc comments to all methods in pages/[file]. Describe what each
method does, its parameters, and any important behavior notes.
```

---

## MCP

**Discover available MCP tools:**
```
Which MCP server should I use to [task]? Show me the available tools
from the configured MCP servers in .mcp.json.
```

**Browser automation with MCP:**
```
Use MCP (playwright server) to:
1. Navigate to [URL]
2. [Describe interactions: click, fill, etc.]
3. Take a screenshot of the result
```

**Run tests with MCP:**
```
Use MCP (playwright-test server) to run all @smoke tests and show me
the results. If any fail, show the error details.
```

**Explore MCP capabilities:**
```
Show me all available Playwright MCP tools for browser automation.
List each tool with a short description of what it does.
```

---

## Tips for Effective Prompts

1. **Be specific.** Include file names, endpoint paths, and page names.
2. **Reference conventions.** Point to `docs/QA_CONTEXT.md` for selector and wait strategy rules.
3. **Include context.** If fixing a bug, paste the error message. If adding a test, describe the user flow.
4. **Chain prompts.** Start with a design prompt, then implement, then review.
5. **Iterate.** If the output is not right, refine your prompt with more detail rather than starting over.
