# Split payment by card (automatic balance charge)

Guests who book more than 60 days out can pay 50% now by card, with their card saved
(with their consent) and the remaining 50% charged automatically 60 days before
check-in. Each charge carries its own 3% card fee. Everything else (Zelle, the full-payment
card link, approvals) works exactly as before.

**Status: built and unit/integration tested against a FAKE Square. It has NOT been run
against Square. Test in the Square sandbox before turning it on.**

## How it works

1. Host approves a booking in `admin-approve.html` as usual. If the stay is more than
   60 days out and no override total was used, the guest email gets an extra
   "Split payment by card" button linking to `/pay/?id=...&t=<private token>`.
2. `/pay/` loads Square's Web Payments card form. The guest ticks a consent box, and the
   Worker (`api-worker/autopay.js`) creates a Square customer, saves the card (Cards API),
   charges the first 50% + 3%, stores the schedule in KV (`autopay:<bookingId>`),
   confirms the booking the normal way, and emails a payment schedule.
3. A daily cron (09:00 UTC) charges the balance on its due date and emails a receipt.
4. If the balance charge is declined: the guest gets an update-card link, the host is
   alerted, the charge retries daily for 3 days, then the host is alerted again.
5. If the result is ever unclear (network error / 5xx), the Worker retries only with the
   same idempotency key, then STOPS and alerts the host. It never retries blindly later.
6. Three days before each charge the host gets an email with a one-tap "stop automatic
   charge" link. Stopping disables the saved card.

The `/pay/` page also lets the guest pay the whole amount (total + 3%) by card in one
charge. That path saves no card and schedules nothing (record status `paid_full`), and it
still works for stays inside 60 days. Test it in the sandbox too.

Not included: the $300 security deposit (undecided), refunds (do these in Square),
and any change to Zelle or the full-payment card link.

## Setup

```bash
cd api-worker
wrangler secret put SQUARE_APPLICATION_ID     # Square Developer Dashboard > your app > Credentials
# SQUARE_ACCESS_TOKEN, RESEND_API_KEY, ADMIN_DEBUG_KEY already exist
# optional: wrangler secret put SQUARE_LOCATION_ID   (defaults to the first Square location)
wrangler deploy
```

Without `SQUARE_APPLICATION_ID` the split option is simply not offered.

## Test in the sandbox first

1. Set `SQUARE_SANDBOX=true` and use sandbox credentials (application id, access token).
2. Approve a test booking with check-in more than 60 days away; open the email's split link.
3. Pay with Square's test card `4111 1111 1111 1111` (any future expiry, CVV 111).
   Confirm: first charge appears in the Square sandbox, the booking becomes confirmed,
   the schedule email arrives, and `GET /api/autopay/status?key=ADMIN_KEY&id=BOOKING_ID`
   shows `status: scheduled` with the right `dueDate`.
4. Test the balance charge by editing `dueDate` in the KV record to today, then wait for
   the 09:00 UTC cron (or trigger it with `wrangler dev --test-scheduled`).
5. Test a decline with Square's decline test card, the update-card page (`&mode=update`),
   and the stop link.
6. Only then remove `SQUARE_SANDBOX` and use production credentials.

## Host controls

- Stop a charge (cancelled booking, changed plans): open
  `https://indigopalm.co/api/autopay/cancel?key=ADMIN_KEY&id=BOOKING_ID` and tap the button.
  **If a guest cancels, stop the automatic charge or they will still be charged.**
- Look at a schedule: `GET /api/autopay/status?key=ADMIN_KEY&id=BOOKING_ID`.
- Refund a cancelled guest's first payment manually in Square.

## Known limitations

- Square's card-on-file rules and your consent wording should be reviewed (ideally by a
  lawyer) before launch. The consent text and acceptance time, IP and user agent are
  stored in the KV record as evidence.
- No SCA/3-D Secure step (fine for US cards; add `verifyBuyer` for EU/UK cards).
- Halves are fee'd separately, so total fees can differ from 3% of the total by a cent.
- There is no admin-page button yet; stopping is via the emailed link.
