# Postman / Newman Integration (Optional)

This directory is an **optional** skeleton for teams that want to maintain
Postman collections alongside their Playwright API tests.

## Recommended Approach

**Primary API tests should live in `tests/api/` using Playwright's built-in
`APIRequestContext`.** This keeps all tests in a single framework with unified
reporting, TypeScript support, and CI integration.

Use this directory only if your team already has existing Postman collections
that you want to run as part of your CI pipeline.

## Directory Structure

Place your exported Postman files here:

```
postman/
  collection.json       # Exported Postman collection (v2.1 format)
  environment.json      # Exported Postman environment variables
  README.md             # This file
```

## Running with Newman (CLI)

[Newman](https://github.com/postmanlabs/newman) is the CLI runner for Postman
collections. Install it globally or as a dev dependency:

```bash
# Install Newman
npm install -g newman

# Run a collection
newman run postman/collection.json \
  --environment postman/environment.json \
  --reporters cli,htmlextra

# Run with environment variable overrides
newman run postman/collection.json \
  --env-var "baseUrl=https://staging.example.com" \
  --env-var "apiKey=your-api-key"
```

## Adding to package.json (Optional)

If you decide to use Newman, add a script to your `package.json`:

```json
{
  "scripts": {
    "test:postman": "newman run postman/collection.json --environment postman/environment.json"
  }
}
```

## When to Use Playwright vs. Postman

| Use Case | Recommendation |
|---|---|
| New API tests | Playwright `tests/api/` |
| Existing Postman collections | Newman (this directory) |
| API + UI combined flows | Playwright (single framework) |
| Quick manual API exploration | Postman GUI |
| CI/CD automated API tests | Playwright (preferred) or Newman |
