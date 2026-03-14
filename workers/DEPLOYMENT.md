# Newsletter Signup Deployment Guide

This guide walks you through deploying the newsletter signup system for Indigo Palm Collective.

## Architecture

- **Frontend**: Newsletter form in `index.html` sends data to Cloudflare Worker
- **Backend**: Cloudflare Worker (`newsletter-signup.js`) handles requests
- **Email**: Resend API sends welcome email with WELCOME10 discount code
- **Storage**: Google Sheets via Apps Script webhook stores emails

## Prerequisites

1. ✅ Resend account with verified domain (hello@indigopalm.co)
2. ✅ Google Sheet for newsletter subscribers
3. ⏳ Google Apps Script webhook (needs deployment)
4. ⏳ Cloudflare Workers account

## Step 1: Deploy Google Apps Script Webhook

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Copy the code from `google-apps-script-webhook.js`
4. Paste it into the script editor
5. Click **Deploy** > **New deployment**
6. Select type: **Web app**
7. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Copy the webhook URL (looks like: `https://script.google.com/macros/s/.../exec`)
10. **Save this URL** - you'll need it for Step 2

## Step 2: Deploy Cloudflare Worker

### Option A: Using Cloudflare Dashboard (Easier)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create Application** > **Create Worker**
4. Name it: `indigo-palm-newsletter`
5. Click **Deploy** (with default code)
6. Click **Quick Edit**
7. Copy the code from `newsletter-signup.js` and paste it
8. Click **Save and Deploy**

**Add Environment Variables:**
1. In the Worker dashboard, go to **Settings** > **Variables**
2. Add these variables:
   - `RESEND_API_KEY` = [your Resend API key]
   - `SHEETS_WEBHOOK_URL` = [paste the URL from Step 1]
3. Click **Save**

**Add Custom Domain:**
1. Go to **Triggers** tab
2. Click **Add Custom Domain**
3. Enter: `newsletter.indigopalm.co`
4. Click **Add Custom Domain**
5. Wait for DNS to propagate (1-5 minutes)

### Option B: Using Wrangler CLI (Advanced)

```bash
cd /Users/etuan/Desktop/Airbnb/indigopalm/workers

# Install Wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Add secrets
wrangler secret put RESEND_API_KEY
# Paste: re_2fymdHtu_3N3PPRJBAfEoeXrpnGZg2fTt

wrangler secret put SHEETS_WEBHOOK_URL
# Paste: [your Google Apps Script webhook URL]

# Deploy
wrangler deploy
```

## Step 3: Test the Newsletter Signup

### Test Email Only (Already Works)
```bash
cd /Users/etuan/Desktop/Airbnb/indigopalm
node test-newsletter-email-only.js
```

### Test Full Flow (After Deployment)
```bash
node test-newsletter.js
```

### Test Live on Website
1. Go to https://indigopalm.co
2. Scroll to "Stay in the Loop" section
3. Enter test email: `eann.tuan@gmail.com`
4. Click **SIGN UP**
5. Check:
   - ✅ Success message appears
   - ✅ Email arrives in inbox
   - ✅ Google Sheet has new entry

## Troubleshooting

### Error: "Signup failed. Please try again."
- Check Worker logs in Cloudflare Dashboard
- Verify environment variables are set correctly
- Test Google Apps Script webhook directly

### Email not arriving
- Check Resend dashboard for delivery status
- Verify domain is verified (hello@indigopalm.co)
- Check spam folder

### Google Sheet not updating
- Test the Apps Script webhook directly:
  ```bash
  curl -X POST [YOUR_WEBHOOK_URL] \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```
- Check Apps Script execution logs
- Verify sheet name is "Newsletter"

## Files Reference

- `newsletter-signup.js` - Cloudflare Worker (main backend)
- `google-apps-script-webhook.js` - Apps Script webhook code
- `email-templates/newsletter-welcome.html` - Email template
- `wrangler.toml` - Worker configuration
- `test-newsletter.js` - Full test script
- `test-newsletter-email-only.js` - Email-only test script

## Current Status

✅ Email template created with WELCOME10 discount code
✅ Resend API configured and tested
✅ Google Sheet created (ID: 1WQLrcUaEz5O_OBLzTXet5Qn0WAmhS99xlxu-VPkcImM)
✅ Cloudflare Worker code ready
✅ Newsletter form integrated in index.html
⏳ Need to deploy Google Apps Script webhook
⏳ Need to deploy Cloudflare Worker
⏳ Need to add custom domain (newsletter.indigopalm.co)

## Next Steps

1. Deploy Google Apps Script webhook (Step 1)
2. Deploy Cloudflare Worker (Step 2)
3. Test the complete flow (Step 3)
4. Monitor first real signups
