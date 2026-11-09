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

## What is not covered

The browser card form on `/pay/` (Square's SDK turning typed card numbers into a token) is not exercised: the sandbox test uses Square's test token `cnon:card-nonce-ok` in its place. The live smoke check only confirms the page loads the Square SDK. Open `/pay/` once after changes to that page.

## Test cards and tokens (sandbox only)

- `cnon:card-nonce-ok`: approved. `cnon:card-nonce-declined`: declined.
