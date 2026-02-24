# Direct Booking System Setup Guide

## What We Built

### 1. **Booking Widget** (`booking-widget.html`)
- Property selection with pricing
- Date picker with availability checking
- Guest count selector
- Real-time price calculation
- Displays total with taxes before checkout

### 2. **Checkout Page** (`checkout.html`)
- Guest information form
- Add-ons (early check-in, late checkout, mid-stay cleaning)
- Reservation summary sidebar
- Promo code support (DIRECT10, DIRECT15)
- Ready for Stripe integration

### 3. **Backend Functions** (Optional - see hosting options below)
- `get-availability.js` - Fetches iCal feeds, returns blocked dates
- `get-pricing.js` - Dynamic pricing with weekend/peak rates

---

## Pricing Strategy

Your pricing is visible on three levels:

### Level 1: Property Cards (Base Price)
Shows starting price per night on homepage/widget

### Level 2: Date Selection (Dynamic Pricing)
Calculates actual price based on:
- **Weekday Rate**: Base price
- **Weekend Rate**: +10% (Fri/Sat nights)
- **Peak Season**: +20-40% (Coachella, Stagecoach, holidays)

### Level 3: Checkout (Final Total)
- Nightly rate × nights
- Cleaning fee
- Taxes (12% Indio, 13.5% Palm Springs)
- Add-ons (optional)
- Promo code discount

---

## Pricing Configuration

Edit pricing in `netlify/functions/get-pricing.js`:

```javascript
const STATIC_PRICING = {
  'cozy-cactus': {
    basePrice: 250,        // Weekday rate
    weekendRate: 275,      // Fri/Sat
    peakSeasonRate: 300,   // Festivals
    cleaningFee: 150,
    taxRate: 0.12,
    minNights: 2
  },
  // ... other properties
};

// Peak dates (Coachella, holidays)
const PEAK_DATES = [
  { start: '2026-04-10', end: '2026-04-19' }, // Coachella
  { start: '2026-12-20', end: '2026-12-31' }, // Holidays
];
```

---

## Hosting Options

### Option 1: **GitHub Pages** (Static Only)
**Pros:**
- Free
- Already using GitHub
- Simple deployment

**Cons:**
- No serverless functions (can't run get-availability.js)
- Must use client-side iCal parsing (CORS issues)

**Best for:** If you're okay with static pricing and manual availability checking

---

### Option 2: **Netlify** (Recommended)
**Pros:**
- Free tier includes serverless functions
- Automatic GitHub deploys
- Built-in form handling
- No CORS issues

**Cons:**
- Another platform to manage

**Best for:** Dynamic pricing + real-time availability

**Setup:**
1. Connect GitHub repo to Netlify
2. Set build command: `echo "No build"`
3. Set publish directory: `/`
4. Add environment variables (iCal URLs)
5. Deploy

---

### Option 3: **Vercel**
**Pros:**
- Similar to Netlify
- GitHub integration
- Serverless functions

**Cons:**
- Functions use different syntax (needs minor rewrites)

---

### Option 4: **Cloudflare Pages**
**Pros:**
- Free
- Fast global CDN
- Cloudflare Workers (serverless)

**Cons:**
- Workers use different API

---

## Recommended Stack

**For You:** **GitHub Pages + Manual Pricing Updates**

Why? You're worried about PM dependency, so keep it simple:

1. **Host static site on GitHub Pages** (free)
2. **Hardcode pricing** in `booking-widget.html` (update quarterly)
3. **Use Stripe for payments** (works client-side)
4. **Get email after payment** with booking details
5. **Manually block calendars** (5 min per booking)

**NO backend needed. NO Netlify. NO API keys to regenerate.**

---

## Quick Start (GitHub Pages Only)

1. **Get iCal URLs from PM**
   - Text PM: "Can you send iCal export URLs for Casa Moto and Cozy Cactus?"
   - You already have PS Retreat and The Well URLs

2. **Update pricing** in `booking-widget.html` line 220:
   ```javascript
   const properties = {
     'cozy-cactus': {
       basePrice: 250,  // Update when prices change
       cleaningFee: 150,
       taxRate: 0.12
     }
   };
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add direct booking system"
   git push origin main
   ```

4. **Enable GitHub Pages**
   - Repo → Settings → Pages
   - Source: main branch
   - Save

5. **Test it**
   - Visit: `https://yourusername.github.io/indigopalm/booking-widget.html`

---

## Stripe Integration (Next Step)

After testing the widget, we'll add Stripe:

1. Create Stripe account
2. Get API keys
3. Create checkout sessions
4. Handle webhooks for booking emails

Cost: 2.9% + $0.30 per transaction (no monthly fee)

---

## Summary

**You have:**
- ✅ Booking widget with pricing calculator
- ✅ Checkout page ready for Stripe
- ✅ No PM dependency (iCal only)
- ✅ Works on GitHub Pages (no backend needed)

**You need:**
- Get iCal URLs from PM (one-time ask)
- Set up Stripe account
- Test booking flow

**Total cost:** ~3% per booking (Stripe fees only)

---

## Questions?

1. Want me to set up Stripe integration?
2. Need help getting iCal URLs?
3. Want to add dynamic pricing later (requires Netlify/Vercel)?
