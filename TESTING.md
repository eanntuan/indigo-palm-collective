# Testing the booking and payment flows

Three layers, all run by GitHub Actions (`.github/workflows/payment-tests.yml`).

| Layer | What it proves | When it runs | Needs |
|---|---|---|---|
| `npm test` | Our logic: approval, deposit math, split and pay-in-full, daily balance job, declines, emails. Uses a fake Square. | Every push and pull request | nothing |
| `npm run test:sandbox` | Real Square accepts what we send: payment link, saved card, charges, the balance charge from the saved card, a declined card. Uses Square's **sandbox** (fake money, test cards). | Pushes to main, nightly, by hand | `SQUARE_SANDBOX_ACCESS_TOKEN` |
| `scripts/smoke-live.sh` | The live site and API are up and refuse bogus requests. Read-only: never books or charges. | Nightly, by hand | nothing |

Failed runs email you from GitHub (Settings > Notifications > Actions).

## One-time setup for the sandbox test

1. developer.squareup.com > Applications > your application > **Sandbox** tab (not Production).
2. Copy the **Sandbox access token**.
3. GitHub repo > Settings > Secrets and variables > Actions > New repository secret: name `SQUARE_SANDBOX_ACCESS_TOKEN`, paste the token.
4. Optional: a second secret `SQUARE_SANDBOX_LOCATION_ID` (Square dashboard > Sandbox test accounts > Locations). If you skip it the first sandbox location is used.
5. Run it: Actions > Payment tests > Run workflow.

The sandbox token is separate from your live token and cannot touch real money. Never put the live token in GitHub.

## Running locally

    npm test
    SQUARE_SANDBOX_ACCESS_TOKEN=... npm run test:sandbox
    bash scripts/smoke-live.sh

## Alerts and health

- **Push alerts.** When an automatic charge is declined, the 3-day grace period ends, a charge needs a manual check, or a card payment is taken but the booking fails to confirm, the Worker also sends a web push to the host's device (in addition to the existing email). Code: `api-worker/alerts.js`. A push failure is logged and ignored; it never blocks a charge. The 3-day "charge coming up" reminder stays email-only. To receive pushes, open `https://indigopalm.co/inbox` on your phone (iPhone: Add to Home Screen first) and tap Enable once, then check with `/api/test-push?key=ADMIN_KEY`. Only one device is stored (the latest subscription).
- **Daily job heartbeat.** After each successful `0 9 * * *` run the Worker stores the time in KV key `heartbeat:daily`.
- **`GET /api/health?key=ADMIN_KEY`** returns the last daily run time (and its age in hours) plus counts of autopay records that are `scheduled`, `failed` and `needs_attention`. No names, emails or secrets. If the age is over about 26 hours, the daily job is not running.
- **`GET /api/ping`** is public and returns only `{"ok":true}`.
- `scripts/smoke-live.sh` (nightly) also checks `/api/ping`, that `www.indigopalm.co` loads, and that the TLS certificate has at least 14 days left (`MIN_CERT_DAYS` to change). It fails if the certificate date cannot be read.

## What is not covered

The browser card form on `/pay/` (Square's SDK turning typed card numbers into a token) is not exercised: the sandbox test uses Square's test token `cnon:card-nonce-ok` in its place. The live smoke check only confirms the page loads the Square SDK. Open `/pay/` once after changes to that page.

## Test cards and tokens (sandbox only)

- `cnon:card-nonce-ok`: approved. `cnon:card-nonce-declined`: declined.

## SEO checks

`scripts/seo/` holds three read-only checks (broken links and images, orphan pages, missing alt text) ported from the /babysit-seo skill. They run weekly in GitHub Actions (`.github/workflows/seo-checks.yml`) and write reports to the run summary and an artifact. Run locally: `python3 scripts/seo/check_broken_links.py --skip-external --output /tmp/broken.md` (needs `requests` and `beautifulsoup4`). The alt-text check reads the live site, so it needs network access.
