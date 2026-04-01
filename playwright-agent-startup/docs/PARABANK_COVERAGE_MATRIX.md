# ParaBank Coverage Matrix

This matrix tracks reachable ParaBank demo screens and the current Playwright coverage status.

## Public Screens

| Screen | Route | Current Coverage | Planned Edge Cases |
|---|---|---|---|
| Home | `index.htm` | Covered | Broken navigation links, login panel visibility, latest news block |
| About Us | `about.htm` | Covered | Additional copy changes if the live demo content is revised |
| Services | `services.htm` | Covered | Additional service-link health checks if external docs become stable |
| Contact | `contact.htm` | Covered | Contact details content, support message |
| Customer Lookup | `lookup.htm` | Covered | Invalid recovery data branch |
| Register | `register.htm` | Covered | Password mismatch branch |
| Administration | `admin.htm` | Covered | Read-only defaults only; no admin writes against the live demo |
| News | `news.htm` | Covered | Additional article-detail assertions if content remains stable |
| Site Map | `sitemap.htm` | Covered | Broken-link crawling if we switch to a controlled environment |

## Authenticated Screens

| Screen | Route | Current Coverage | Planned Edge Cases |
|---|---|---|---|
| Accounts Overview | `overview.htm` | Covered | Empty state, account table integrity, balance formatting |
| Account Activity | `activity.htm?id=<id>` | Covered | Transaction-detail drilldown page |
| Open New Account | `openaccount.htm` | Partial | Savings vs checking creation, minimum-balance messaging, retry stability |
| Transfer Funds | `transfer.htm` | Covered | Same-account prevention, invalid amount, debit/credit verification |
| Bill Pay | `billpay.htm` | Covered | Backend failure branch |
| Find Transactions | `findtrans.htm` | Covered | Transaction-detail drilldown page |
| Update Contact Info | `updateprofile.htm` | Covered | Required-field validation, persistence of updates |
| Request Loan | `requestloan.htm` | Covered | Additional denial message variants |
| Log Out | `logout.htm` | Covered | Cross-browser session invalidation stays sensitive because it mutates the shared demo session |

## Controlled Target Coverage

| Flow | Controlled Route | Coverage |
|---|---|---|
| Find Transactions drilldown | `findtrans.htm` -> `transaction.htm?id=<id>` | Covered |
| Account Activity drilldown | `activity.htm?id=<id>` -> `transaction.htm?id=<id>` | Covered |
| Bill Pay backend failure | `billpay.htm?fromAccountId=999999` | Covered |
| Loan denial: insufficient down payment | `requestloan.htm?denial=insufficient-down-payment` | Covered |
| Loan denial: amount too high | `requestloan.htm?denial=amount-too-high` | Covered |

## Current Strategy

- Keep destructive/write-heavy flows consolidated so the live demo tenant stays stable.
- Prefer assertions on durable user-visible outcomes over brittle transient text.
- Add deeper negative cases only where the demo app behaves consistently across Chromium, Firefox, and WebKit.
- Use the controlled target for deep branches that the public demo serves unreliably, while keeping user-facing smoke/regression coverage on the live site.

## Current Live-Demo Blockers

1. Transaction-detail drilldowns from `findtrans.htm` and `activity.htm` are still blocked for fresh live-demo users because account-backed routes intermittently return the generic `Error!` page.
2. Additional backend error and loan-denial variants are still environment-sensitive on the public ParaBank tenant and need either stable seeded credentials or a controlled deployment.
