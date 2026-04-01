# Security & Sanitization Guide

This guide helps you keep the repository clean of secrets, credentials, internal references, and sensitive data. Use it before every commit and especially before making the repository public.

---

## What to Remove Before Making Public

Complete this checklist before sharing the repository outside your team or publishing it as open source.

- [ ] No real API keys, tokens, or passwords anywhere in the codebase
- [ ] No internal hostnames or IP addresses (e.g., `*.internal.*`, `*.local.*`, `*.corp.*`)
- [ ] No employee names or email addresses (use generic: "QA Engineer", "testuser@example.com")
- [ ] No company-specific naming (project codes, team names, product codenames)
- [ ] No screenshots of internal systems in test-results/ or docs/
- [ ] No internal documentation links (wiki, Confluence, Notion, etc.)
- [ ] No proprietary business logic (algorithms, pricing rules, etc.)
- [ ] No real customer or user data (names, emails, addresses, payment info)
- [ ] No internal Postman collections with real endpoints or auth tokens
- [ ] No CI/CD configs with internal server addresses or deployment targets

---

## Grep Patterns for Common Secrets

Run these commands from the repository root to scan for leaked secrets. Fix every finding before committing.

### API Keys & Tokens

```bash
# Generic API keys
grep -rn "api[_-]key.*=.*['\"][a-zA-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*"

# Bearer tokens
grep -rn "Bearer [a-zA-Z0-9]" . --include="*.ts" --include="*.json"

# Generic tokens
grep -rn "token.*=.*['\"][a-zA-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*"

# OpenAI / AI service keys
grep -rn "sk-[a-zA-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*"
```

### Passwords

```bash
# Password assignments
grep -rn "password.*=.*['\"]" . --include="*.ts" --include="*.json" --include="*.env*"

# Alternate password variable names
grep -rn "passwd\|pwd" . --include="*.ts" --include="*.json" --include="*.env*"
```

### Internal URLs & Networks

```bash
# Internal domain patterns
grep -rn "\.internal\.\|\.local\.\|\.corp\." . --include="*.ts" --include="*.json" --include="*.env*"

# Private IP address ranges (RFC 1918)
grep -rn "10\.\|172\.1[6-9]\.\|172\.2[0-9]\.\|172\.3[01]\.\|192\.168\." . --include="*.ts" --include="*.json" --include="*.env*"

# Localhost with non-standard ports (may reveal internal services)
grep -rn "localhost:[0-9]" . --include="*.ts" --include="*.json" --include="*.env*"
```

### AWS / Cloud Credentials

```bash
# AWS Access Key IDs (always start with AKIA)
grep -rn "AKIA[A-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*"

# AWS secret keys and access key references
grep -rn "aws_secret\|aws_access" . --include="*.ts" --include="*.json" --include="*.env*"

# Generic cloud credentials
grep -rn "AZURE_\|GCP_\|GOOGLE_CLOUD_" . --include="*.ts" --include="*.json" --include="*.env*"
```

### Generic Secrets

```bash
# Secret assignments
grep -rn "secret.*=.*['\"]" . --include="*.ts" --include="*.json" --include="*.env*"

# Private keys
grep -rn "private[_-]key" . --include="*.ts" --include="*.json" --include="*.env*" --include="*.pem"

# Connection strings (often contain passwords)
grep -rn "connection[_-]string\|mongodb\+srv\|postgres://\|mysql://" . --include="*.ts" --include="*.json" --include="*.env*"
```

### One-Liner: Run All Checks

```bash
echo "=== API Keys ===" && \
grep -rn "api[_-]key.*=.*['\"][a-zA-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== Bearer Tokens ===" && \
grep -rn "Bearer [a-zA-Z0-9]" . --include="*.ts" --include="*.json" ; \
echo "=== Passwords ===" && \
grep -rn "password.*=.*['\"][^'\"]*[a-zA-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== Internal URLs ===" && \
grep -rn "\.internal\.\|\.local\.\|\.corp\." . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== Private IPs ===" && \
grep -rn "10\.\|172\.1[6-9]\.\|172\.2[0-9]\.\|172\.3[01]\.\|192\.168\." . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== AWS Keys ===" && \
grep -rn "AKIA[A-Z0-9]" . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== Secrets ===" && \
grep -rn "secret.*=.*['\"]" . --include="*.ts" --include="*.json" --include="*.env*" ; \
echo "=== Done ==="
```

---

## What NOT to Publish

These files and directories should never be committed to a public repository.

### Files Excluded by .gitignore

| Path | Reason |
|---|---|
| `.env` | Contains real environment variables (credentials, URLs) |
| `.mcp.json` | May contain API keys or server configurations |
| `node_modules/` | Third-party dependencies (install via `npm install`) |
| `test-results/` | May contain screenshots/videos of internal applications |
| `playwright-report/` | May contain screenshots and traces with sensitive data |
| `blob-report/` | Playwright blob reports with full test artifacts |

### Files That Require Manual Review

| Path | What to Check |
|---|---|
| `postman/*.json` | Remove real endpoints, auth tokens, request bodies with real data |
| `tests/fixtures/*` | Remove real credentials, replace with placeholders |
| `playwright.config.ts` | Remove internal base URLs, replace with env vars or `https://example.com` |
| `.github/workflows/*` | Remove internal server addresses, deployment targets, real secrets references |

### Verify .gitignore Coverage

Confirm these entries exist in `.gitignore`:

```gitignore
# Environment
.env
.env.local
.env.*.local

# MCP configuration (may contain secrets)
.mcp.json

# Dependencies
node_modules/

# Test artifacts (may contain screenshots of internal apps)
test-results/
playwright-report/
blob-report/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## Safe Patterns

Use these patterns throughout the codebase to keep it portable and secret-free.

### Environment Variables for All URLs and Credentials

```typescript
// GOOD: Base URL from environment
const baseURL = process.env.BASE_URL || 'https://example.com';

// GOOD: API key from environment
const apiKey = process.env.API_KEY || 'your-api-key-here';

// BAD: Hardcoded URL
const baseURL = 'https://staging.mycompany.internal.com';

// BAD: Hardcoded credential
const apiKey = 'sk-abc123realkey456';
```

### Placeholder Values

Use these safe placeholders when example values are needed:

| Type | Safe Placeholder |
|---|---|
| URL | `https://example.com` |
| API base URL | `https://api.example.com/v1` |
| Email | `testuser@example.com` |
| Name | `Test User`, `Jane Doe` |
| API key | `your-api-key-here` |
| Password | `your-password-here` |
| Token | `your-token-here` |
| Phone | `+1-555-000-0000` |
| Address | `123 Test Street, Anytown, ST 00000` |

### .env.example File

Always provide a `.env.example` with placeholder values. Real `.env` files must never be committed.

```bash
# .env.example -- Copy to .env and fill in real values
BASE_URL=https://example.com
API_URL=https://api.example.com/v1
API_KEY=your-api-key-here
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=your-password-here
```

### References to People and Teams

```typescript
// GOOD: Generic role references
// Author: QA Engineer
// Reviewer: Development Team

// BAD: Real names and emails
// Author: John Smith (john.smith@company.com)
// Reviewer: Jane Doe (jane.doe@company.com)
```

---

## Pre-Commit Security Checklist

Run through this checklist before every commit:

1. **Run grep patterns** from the section above.
2. **Check git diff** for any secrets in staged changes:
   ```bash
   git diff --cached | grep -i "key\|token\|password\|secret\|bearer"
   ```
3. **Review new files** -- are any of them in the "What NOT to Publish" list?
4. **Check test artifacts** -- did you accidentally stage `test-results/` or `playwright-report/`?
5. **Verify .env.example** -- if you added new env vars, update `.env.example` with placeholders.

---

## Automated Secret Scanning

Consider adding these tools to your CI pipeline for continuous protection:

| Tool | Purpose | Link |
|---|---|---|
| **git-secrets** | Prevents committing secrets to git | https://github.com/awslabs/git-secrets |
| **gitleaks** | Scans git repos for hardcoded secrets | https://github.com/gitleaks/gitleaks |
| **truffleHog** | Searches for high-entropy strings and secrets | https://github.com/trufflesecurity/trufflehog |
| **GitHub Secret Scanning** | Automatic scanning on GitHub repositories | Built into GitHub |

### Example: gitleaks Pre-Commit Hook

```bash
# Install gitleaks and add as a pre-commit hook
# See https://github.com/gitleaks/gitleaks for installation instructions

# Run manually before committing
gitleaks detect --source . --verbose
```
