# Option 2 Setup Complete ✅

**Hybrid booking system with zero PM dependency**

---

## How It Works

### **PS Retreat** (Full Booking Flow)
1. User selects PS Retreat
2. Picks dates
3. Clicks "Check Availability"
4. Sees estimated pricing on your site
5. Proceeds to checkout.html → Stripe payment
6. You manually create booking in Hospitable

**Why:** You control Hospitable, no PM dependency

---

### **Cozy Cactus & Casa Moto** (Redirect to Hostaway)
1. User selects Cozy Cactus
2. Picks dates
3. Clicks "Check Exact Pricing →"
4. Opens Hostaway Direct booking page in new tab
5. Sees live PriceLabs pricing
6. Books directly (avoids Airbnb fees)

**Why:** No need for PM's API access

---

### **The Well** (Redirect to Airbnb)
1. User clicks "Check Exact Pricing →"
2. Opens Airbnb listing
3. Books through Airbnb

**Why:** No PMS integration currently

---

## Testing Instructions

### **1. Open the Widget**
```bash
cd /Users/etuan/Desktop/Airbnb/indigopalm
open booking-widget.html
```

### **2. Test Cozy Cactus (Hostaway Redirect)**
1. Select Cozy Cactus (default)
2. Notice button says "Check Exact Pricing →" (not "Check Availability")
3. Pick dates: Feb 20 - Feb 22
4. Add guests: 4
5. Click "Check Exact Pricing →"
6. Should open: `https://luxuryvacations.holidayfuture.com/listing/123646?checkIn=2026-02-20&checkOut=2026-02-22&guests=4`
7. You'll see real PriceLabs pricing on Hostaway Direct

### **3. Test PS Retreat (Full Booking)**
1. Select PS Retreat
2. Notice button says "Check Availability" (not redirect)
3. Pick dates: Feb 20 - Feb 22
4. Click "Check Availability"
5. See pricing calculation on your site
6. Click "Book Now - No Fees"
7. Goes to checkout.html (your custom checkout)

---

## What Users See

### **Property Cards:**
```
Cozy Cactus
From $250 / night
Dynamic pricing • Book direct & save
[Select to check exact pricing]

PS Retreat
From $180 / night
✓ Book here with instant pricing  ← Highlighted
[Full booking flow on this site]
```

### **After Selecting Hostaway Property:**
```
Cozy Cactus selected

Check-in: [Feb 20]
Check-out: [Feb 22]
Guests: [4]

[Check Exact Pricing →]  ← Button opens Hostaway

"You'll see live pricing optimized by PriceLabs"
```

### **After Selecting PS Retreat:**
```
PS Retreat selected

Check-in: [Feb 20]
Check-out: [Feb 22]
Guests: [2]

[Check Availability]  ← Button shows pricing here

Price breakdown shown instantly
```

---

## Updating Hostaway URLs

If your Hostaway Direct URLs change, edit `booking-widget.html` line 220:

```javascript
'cozy-cactus': {
    hostawayUrl: 'https://YOUR-HOSTAWAY-URL/listing/123646',
    hostawayListingId: 123646
}
```

---

## Future Upgrades

### **Phase 1 (Now):**
- ✅ Hostaway properties redirect to Direct booking
- ✅ PS Retreat shows estimated pricing
- ✅ Zero API dependency

### **Phase 2 (Optional):**
- 🔄 Fetch real Hospitable pricing for PS Retreat
- 🔄 Requires simple serverless function
- 🔄 Shows exact PriceLabs rates

### **Phase 3 (If you want):**
- 🔄 Get Hostaway read-only API access
- 🔄 Show exact PriceLabs pricing for all properties
- 🔄 No redirects needed

---

## Adding to Your Homepage

### **Option A: Replace Current Booking Links**

In `index.html`, find your "Book Now" buttons and update:

```html
<a href="booking-widget.html" class="cta-button">
    BOOK YOUR STAY
</a>
```

### **Option B: Property-Specific Links**

Link directly to specific property:

```html
<!-- Cozy Cactus card -->
<a href="booking-widget.html?property=cozy-cactus" class="cta-button">
    CHECK AVAILABILITY
</a>

<!-- PS Retreat card -->
<a href="booking-widget.html?property=ps-retreat" class="cta-button">
    BOOK NOW
</a>
```

The widget will pre-select the property if `?property=X` is in URL.

---

## Stripe Integration (Next Step)

Once you're ready:

1. Create Stripe account
2. Get API keys
3. I'll connect checkout.html to Stripe
4. PS Retreat bookings will charge cards directly
5. Email you booking confirmation

**Cost:** 2.9% + $0.30 per transaction (no monthly fee)

---

## Benefits of Option 2

✅ **Works immediately** - No API setup needed
✅ **Zero PM dependency** - Hostaway properties link directly
✅ **Full control of PS Retreat** - Your Hospitable account
✅ **PriceLabs optimized** - Users see dynamic pricing (on Hostaway or at checkout)
✅ **No backend required** - Works on GitHub Pages
✅ **Direct bookings** - Avoid Airbnb's 15% fee on all properties

---

## Support

**Questions?**
- Test Cozy Cactus → Should open Hostaway Direct
- Test PS Retreat → Should show pricing in widget
- Any issues, let me know

**Ready to deploy?**
1. Push to GitHub
2. Test on GitHub Pages
3. Link from homepage
4. Start taking bookings!

**Want Stripe next?** Just say the word.
