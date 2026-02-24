# PriceLabs Integration Guide

Since you use **PriceLabs for dynamic pricing**, your direct booking site needs to fetch real-time prices from your PMS.

---

## The Reality

### **PriceLabs Workflow:**
```
PriceLabs (calculates prices daily)
    ↓
Hostaway/Hospitable (receives updates)
    ↓
Airbnb/VRBO (synced automatically)
    ↓
YOUR DIRECT SITE ← must fetch from PMS
```

### **Why You Need APIs:**
- PriceLabs changes prices **daily** (sometimes multiple times)
- Weekend of April 12 might be $350 today, $425 tomorrow (demand increases)
- Manual sync = always outdated
- Showing wrong prices = bad guest experience

---

## Solution Options

### **Option 1: Full API Integration** ⭐ Recommended

**What it does:**
- Fetches real PriceLabs pricing from Hostaway/Hospitable
- Updates every 2 hours (cached to reduce API calls)
- Fallback to "from $X/night" if API fails

**Requirements:**
- Netlify/Vercel for serverless functions
- Hostaway API token (read-only)
- Hospitable API key (you already have)

**Pros:**
- ✅ Accurate PriceLabs pricing
- ✅ Automatic updates
- ✅ Competitive with Airbnb/VRBO

**Cons:**
- ❌ Requires backend (Netlify)
- ❌ PM dependency for Hostaway token

**Cost:** Free (Netlify tier includes 125k function calls/month)

---

### **Option 2: Hospitable Only + Static Hostaway**

**What it does:**
- PS Retreat: Live PriceLabs pricing via Hospitable API
- Casa Moto/Cozy Cactus: Show price ranges ("from $225/night")
- Link to Hostaway Direct for exact pricing

**Pros:**
- ✅ No Hostaway API dependency
- ✅ PS Retreat has accurate pricing (you control)
- ✅ Simpler setup

**Cons:**
- ❌ Hostaway properties show estimate only
- ❌ Guest must click through to see exact price

**Example:**
```
Cozy Cactus - From $250/night
[Check Exact Dates] → Links to Hostaway Direct booking
```

---

### **Option 3: Display Only Base Rates**

**What it does:**
- Show PriceLabs **base rate** on your site
- "Pricing varies by date - check availability for exact rates"
- Guest selects dates → See live PriceLabs pricing

**Pros:**
- ✅ No API needed for initial display
- ✅ Set expectations ("pricing varies")
- ✅ Still show accurate price at checkout

**Cons:**
- ❌ Less transparent upfront
- ❌ Guest might bounce before checking dates

---

## My Recommendation: **Option 1 with Smart Fallback**

Use APIs for accurate pricing, but design for failure:

### **When API Works:**
```
Cozy Cactus
$267/night average
Feb 20-22 (3 nights)
```

### **When API Fails:**
```
Cozy Cactus
From $250/night
[Check Availability] → Still shows real pricing at checkout
```

---

## Setup Steps

### **1. Get API Credentials**

**Hostaway (Ask PM):**
```
"Can you create a read-only API token for our direct booking site?
We need to fetch pricing to display PriceLabs rates to guests."
```

**Hospitable (You Have):**
- Already configured in your .env file
- Token: `d9035907-ba8e-4705-adf7-24e5ae53afe1`

---

### **2. Deploy to Netlify**

**Why Netlify:**
- Serverless functions (no server to maintain)
- Free tier = 125k API calls/month
- Auto-deploys from GitHub
- Built-in environment variables (secure)

**Setup:**
1. Push code to GitHub
2. Connect repo to Netlify
3. Add environment variables:
   ```
   HOSTAWAY_API_TOKEN=your_token_here
   HOSPITABLE_API_KEY=your_key_here
   ```
4. Deploy

---

### **3. Update Booking Widget**

I'll modify `booking-widget.html` to fetch from your Netlify function:

```javascript
// Fetch real PriceLabs pricing
async function fetchPricing(propertyId, checkIn, checkOut) {
  try {
    const response = await fetch(
      `/.netlify/functions/fetch-pricelabs-pricing?propertyId=${propertyId}&startDate=${checkIn}&endDate=${checkOut}`
    );
    const data = await response.json();

    if (data.source === 'fallback') {
      console.warn('Using fallback pricing');
    }

    return data;
  } catch (error) {
    console.error('Pricing fetch failed:', error);
    return null;
  }
}
```

---

## API Call Optimization

### **Caching Strategy:**
- Cache pricing for **2 hours** server-side
- Reduces API calls (PriceLabs doesn't update that frequently)
- 3 properties × 30 days × 4 price checks/day = ~360 API calls/month
- Well under Netlify's 125k limit

### **Cost Breakdown:**
```
Netlify Functions: FREE (under 125k calls)
Hostaway API: Included in your plan
Hospitable API: Included in your plan
PriceLabs: Already paying for it

Total additional cost: $0
```

---

## Handling PM Dependency

**If PM revokes Hostaway API access:**

1. **Function automatically falls back** to base rates
2. Logs warning (you get notified)
3. Site still works - just shows "from $X/night"
4. Guest sees exact price at Stripe checkout

**No site breakage. Just reduced pricing transparency.**

---

## Testing PriceLabs Integration

### **Before Going Live:**

1. **Check Hostaway Calendar**
   - Go to Hostaway dashboard
   - View April 10-12 (Coachella W1)
   - Note the PriceLabs price (e.g., $425)

2. **Test Your Widget**
   - Open booking-widget.html
   - Select Casa Moto
   - Pick April 10-12
   - Should show $425/night (matches Hostaway)

3. **Verify Calculation**
   ```
   Night 1 (Apr 10): $425 (PriceLabs)
   Night 2 (Apr 11): $425 (PriceLabs)
   Night 3 (Apr 12): $425 (PriceLabs)
   ────────────────────────
   Subtotal: $1,275
   Cleaning: $150
   Taxes: $171
   ────────────────────────
   TOTAL: $1,596
   ```

---

## Alternative: Link to Hostaway Direct

**If you don't want API dependency at all:**

```javascript
// Skip pricing fetch for Hostaway properties
if (property.platform === 'hostaway') {
  window.location.href = `https://luxuryvacations.holidayfuture.com/listing/${property.listingId}`;
}
```

**User Experience:**
1. User selects Casa Moto on your site
2. Clicks "Check Availability"
3. Redirects to Hostaway's direct booking page
4. Sees exact PriceLabs pricing there

**Pros:**
- ✅ Zero API dependency
- ✅ Always accurate (Hostaway has the pricing)

**Cons:**
- ❌ User leaves your site
- ❌ Less brand control

---

## Next Steps

**Option A: Full Integration** (Recommended)
1. I'll deploy the Netlify functions
2. Get Hostaway API token from PM
3. Test with live PriceLabs data
4. Launch

**Option B: Hybrid Approach**
1. Use Hospitable API for PS Retreat
2. Link Hostaway properties to their direct booking
3. Launch immediately (no PM dependency)

**Which approach do you prefer?**
