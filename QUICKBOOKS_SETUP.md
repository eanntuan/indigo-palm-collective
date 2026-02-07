# QuickBooks Online Integration Setup Guide

## Overview
Your dashboard now has full QuickBooks Online integration to automatically sync:
- **All Expenses** (mortgage, utilities, contractors, supplies, etc.)
- **All Revenue** (Airbnb, direct bookings, other income)
- **Bank Account Balances**

No more manual CSV uploads - everything syncs automatically!

---

## Step 1: Create QuickBooks Developer App

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Sign in with your QuickBooks account
3. Click **Dashboard** → **Create an app**
4. Choose **QuickBooks Online API**
5. App Name: "Desert Edit Dashboard" (or whatever you want)
6. Click **Create app**

## Step 2: Get API Credentials

1. In your new app, go to **Keys & credentials**
2. You'll see:
   - **Client ID** (long string starting with AB...)
   - **Client Secret** (click "Show" to reveal)
3. **Copy these - you'll need them for Netlify**

## Step 3: Set Redirect URI

1. Still in **Keys & credentials**
2. Under **Redirect URIs**, add:
   ```
   https://indigopalmcollective.netlify.app/.netlify/functions/quickbooks-callback
   ```
3. Click **Save**

## Step 4: Configure Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your **indigopalmcollective** site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

```
QB_CLIENT_ID = [Your Client ID from Step 2]
QB_CLIENT_SECRET = [Your Client Secret from Step 2]
QB_REDIRECT_URI = https://indigopalmcollective.netlify.app/.netlify/functions/quickbooks-callback
```

Also add these Firebase Admin SDK credentials (for the Netlify functions):
```
FIREBASE_PROJECT_ID = [Your Firebase project ID]
FIREBASE_CLIENT_EMAIL = [Your Firebase service account email]
FIREBASE_PRIVATE_KEY = [Your Firebase private key - keep the quotes and \n characters]
```

### Where to get Firebase credentials:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ → **Project settings** → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Copy the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep it exactly as is, including `\n`)

## Step 5: Deploy Updated Code

From your terminal:

```bash
cd /Users/etuan/Desktop/Airbnb/desert-edit-deploy

# Install new dependencies
npm install

# Deploy to Netlify (if using Netlify CLI)
netlify deploy --prod

# Or push to GitHub (if auto-deploy is enabled)
git add .
git commit -m "Add QuickBooks integration"
git push
```

## Step 6: Connect QuickBooks to Your Dashboard

1. Go to your dashboard: https://indigopalmcollective.netlify.app/dashboard.html
2. Click the **⚙️ Settings** tab
3. Click **Connect QuickBooks**
4. Sign in with your QuickBooks account
5. Authorize the app
6. You'll be redirected back to your dashboard

## Step 7: Initial Data Sync

1. Click **Sync Now**
2. Wait 1-2 minutes (it's pulling all your historical data)
3. The dashboard will refresh with your QuickBooks data

---

## How It Works

### Data Mapping

The sync function automatically categorizes your QuickBooks data:

#### **Property Detection**
Transactions are mapped to properties by keywords in:
- Transaction description
- Vendor name
- Memo/notes
- Class field (if you use Classes in QB)

Keywords:
- "Cochran" or "Cozy Cactus" → `cochran`
- "Casa Moto" or "Villa" → `casa-moto`
- "PS Retreat" or "Palm Springs Retreat" → `ps-retreat`
- "The Well" → `the-well`

#### **Expense Categories**
Expenses are automatically categorized:
- Mortgage/Loan → "Mortgage"
- Electric/SCE/Power → "Utilities - Electric"
- Water/Sewer → "Utilities - Water"
- Gas → "Utilities - Gas"
- Solar → "Utilities - Solar"
- Internet/Spectrum/WiFi → "Internet"
- HOA/Association → "HOA"
- Insurance → "Insurance"
- Property Tax → "Property Tax"
- Cleaning/Cleaner → "Cleaning"
- Supplies/Stock → "Supplies"
- Repair/Maintenance → "Repairs"
- Landscaping/Yard → "Landscaping"
- Pool/Spa → "Pool/Spa"
- Pest/Termite → "Pest Control"
- Airbnb/Hostaway/Hospitable → "Property Management"

#### **Revenue Sources**
Revenue is categorized by keywords in deposit descriptions:
- "Airbnb" → `Airbnb`
- "Direct" or "Booking" → `Direct`
- "VRBO" → `VRBO`
- Everything else → `Other`

### Sync Frequency

**Option 1: Manual Sync** (Current setup)
- Go to Settings → Click "Sync Now"
- Run whenever you want updated data

**Option 2: Scheduled Sync** (Future enhancement)
- Can set up Netlify scheduled functions to auto-sync daily
- Would require upgrading to Netlify Pro ($19/month)

---

## Troubleshooting

### "QuickBooks not connected" error
- Check that all environment variables are set in Netlify
- Redeploy the site after adding env vars

### "Token expired" error
- This is normal - tokens expire after 1 hour
- The system automatically refreshes them
- If it fails, just disconnect and reconnect QB

### Wrong property assignments
- Update the property detection keywords in:
  `/netlify/functions/quickbooks-sync.js` → `mapToProperty()` function

### Wrong expense categories
- Update the categorization logic in:
  `/netlify/functions/quickbooks-sync.js` → `categorizeExpense()` function

---

## Security Notes

- Your QB credentials are stored securely in Netlify (encrypted)
- Access tokens are stored in Firebase Firestore
- Tokens refresh automatically before expiring
- You can disconnect anytime (Settings → Disconnect)
- Synced data stays in your Firebase even if you disconnect

---

## Support

If you need help:
1. Check the browser console for errors (F12 → Console)
2. Check Netlify function logs for QB API errors
3. Verify all environment variables are correct
4. Make sure your QB app is in Production mode (not Sandbox)

---

**That's it!** Once connected, your dashboard will always show real-time financial data from QuickBooks. No more manual uploads. 🎉
