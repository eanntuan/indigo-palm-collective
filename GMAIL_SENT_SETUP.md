# Copy guest emails into Gmail's real Sent folder

Resend sends the mail. If the three Google secrets below exist, the Worker then inserts
a copy into `indigopalmco@gmail.com` with the SENT label (Gmail API `users.messages.insert`,
scope `gmail.insert`). It never sends or reads mail, and it never blocks the guest email:
if Google is unreachable the failure is only logged.

Without the secrets the Worker keeps BCC'ing `indigopalmco@gmail.com` instead (copy lands in
the inbox). With the secrets, the BCC is dropped so you do not get two copies.
Emails addressed to the host herself are not copied into Sent.

## One-time setup (computer, about 15 minutes)

1. **Google Cloud project:** console.cloud.google.com, create a project (e.g. "Indigo Palm Mail").
   APIs & Services > Library > enable **Gmail API**.
2. **Consent screen:** APIs & Services > OAuth consent screen. User type **External**, add
   `indigopalmco@gmail.com` as the app contact. Add the scope
   `https://www.googleapis.com/auth/gmail.insert`. Then **Publish app** (status "In production").
   If it stays in "Testing", Google expires the refresh token after 7 days.
   The "unverified app" warning during sign-in is expected for your own account.
3. **Credentials:** Credentials > Create credentials > OAuth client ID > **Web application**.
   Authorized redirect URI: `https://developers.google.com/oauthplayground`.
   Copy the Client ID and Client secret.
4. **Get the refresh token:** open developers.google.com/oauthplayground. Gear icon > tick
   "Use your own OAuth credentials" and paste the Client ID and secret. In step 1 type the scope
   `https://www.googleapis.com/auth/gmail.insert`, click Authorize APIs, sign in as
   `indigopalmco@gmail.com`, allow. In step 2 click **Exchange authorization code for tokens**
   and copy the **Refresh token**.
5. **Add three Worker secrets** (Cloudflare > Workers > indigo-palm-api > Settings >
   Variables and Secrets, or `wrangler secret put NAME`):
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

Secrets only take effect on the next deploy or secret save; no code change is needed.

## Check it works

Send yourself a test booking request. The guest email should appear in Gmail's Sent folder
within a few seconds. If not, look at the Worker logs for "Gmail Sent copy failed" (a 401/403
usually means the refresh token expired or the wrong account was authorised).

## Notes

- Not tested against Google from the build environment (no network); covered by unit and
  flow tests with a fake Google.
- If you revoke the app in your Google account, the copies stop (guest emails are unaffected).
