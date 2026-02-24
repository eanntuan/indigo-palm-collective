# Dynamic Pricing Guide

## ✅ How Your Pricing Works Now

Your booking widget automatically calculates **different rates** based on:
1. **Day of week** (weekdays vs. weekends)
2. **Peak seasons** (Coachella, holidays, spring break)
3. **Property-specific rates**

**No backend needed. No APIs. No Netlify.** Just smart JavaScript.

---

## Pricing Tiers

### **Tier 1: Base Rate** (Sunday-Thursday)
- Cozy Cactus: **$250/night**
- Casa Moto: **$225/night**
- PS Retreat: **$180/night**
- The Well: **$300/night**

### **Tier 2: Weekend Rate** (Friday-Saturday)
- Cozy Cactus: **$275/night** (+10%)
- Casa Moto: **$250/night** (+11%)
- PS Retreat: **$200/night** (+11%)
- The Well: **$325/night** (+8%)

### **Tier 3: Peak Season Rate** (Festivals/Holidays)
- Cozy Cactus: **$350/night** (+40%)
- Casa Moto: **$400/night** (+78%)
- PS Retreat: **$275/night** (+53%)
- The Well: **$425/night** (+42%)

---

## Peak Season Dates (Auto-Applied)

### **2026 Peak Dates:**

**Coachella Valley Festivals:**
- April 10-12: Coachella Weekend 1
- April 17-19: Coachella Weekend 2
- April 24-26: Stagecoach Festival

**Holidays:**
- March 14-22: Spring Break
- May 22-25: Memorial Day
- September 4-7: Labor Day
- November 25-29: Thanksgiving
- December 18-31: Winter Holidays
- January 1-5, 2027: New Year

**Want to add more dates?** Edit `booking-widget.html` line 288:

```javascript
const PEAK_DATES = [
    { start: '2026-04-10', end: '2026-04-12', name: 'Coachella W1' },
    // Add your custom dates here
];
```

---

## Pricing Examples

### **Example 1: Weekday Stay**
**Property:** Cozy Cactus
**Dates:** Monday, Feb 17 → Wednesday, Feb 19 (2 nights)

```
Night 1 (Mon): $250 (base rate)
Night 2 (Tue): $250 (base rate)
──────────────────────
Subtotal:      $500
Cleaning Fee:  $150
Taxes (12%):   $78
──────────────────────
TOTAL:         $728
```

---

### **Example 2: Weekend Included**
**Property:** Cozy Cactus
**Dates:** Friday, Feb 21 → Monday, Feb 24 (3 nights)

```
Night 1 (Fri): $275 (weekend rate 🎉)
Night 2 (Sat): $275 (weekend rate 🎉)
Night 3 (Sun): $250 (base rate)
──────────────────────
Subtotal:      $800
Cleaning Fee:  $150
Taxes (12%):   $114
──────────────────────
TOTAL:         $1,064

Average: $267/night
```

**Widget shows:** "$267 avg × 3 nights"

---

### **Example 3: Coachella Weekend (Peak Season)**
**Property:** Casa Moto
**Dates:** Friday, April 10 → Monday, April 13 (3 nights)

```
Night 1 (Fri): $400 (peak - Coachella W1 🎪)
Night 2 (Sat): $400 (peak - Coachella W1 🎪)
Night 3 (Sun): $400 (peak - Coachella W1 🎪)
──────────────────────
Subtotal:      $1,200
Cleaning Fee:  $150
Taxes (12%):   $162
──────────────────────
TOTAL:         $1,512

Average: $400/night
```

**Widget shows:** "Peak season rate: $400/night (Coachella W1)"

---

### **Example 4: Mixed Rates**
**Property:** PS Retreat
**Dates:** Thursday, April 9 → Tuesday, April 14 (5 nights)

```
Night 1 (Thu):  $180 (base rate)
Night 2 (Fri):  $275 (peak - Coachella W1 🎪)
Night 3 (Sat):  $275 (peak - Coachella W1 🎪)
Night 4 (Sun):  $275 (peak - Coachella W1 🎪)
Night 5 (Mon):  $275 (peak - Coachella W1 🎪)
──────────────────────
Subtotal:      $1,280
Cleaning Fee:  $125
Taxes (13.5%): $190
──────────────────────
TOTAL:         $1,595

Average: $256/night
```

**Widget shows:** "Available! Pricing includes: 4 peak nights ($275), 1 weekday night ($180)"

---

## What Users See

### **Step 1: Property Selection**
Shows price range on each card:
```
Cozy Cactus
$250-350 / night
Base rate $250 • Peak $350
```

### **Step 2: Date Selection**
After picking dates, shows breakdown:
```
✓ Available! Pricing includes:
2 weekend nights ($275), 1 weekday night ($250)

Rental: $800
$267 avg × 3 nights
```

### **Step 3: Checkout**
Full transparent breakdown:
```
Rental
  $267 avg × 3 nights ........ $800.00
Cleaning Fee .................. $150.00
Taxes (12%) ................... $114.00
──────────────────────────────────────
TOTAL ......................... $1,064.00
```

---

## How to Update Pricing

### **Change Base Rates:**
Edit `booking-widget.html` around line 220:

```javascript
'cozy-cactus': {
    basePrice: 250,        // ← Change this
    weekendRate: 275,      // ← And this
    peakSeasonRate: 350,   // ← And this
}
```

### **Add New Peak Dates:**
Edit around line 288:

```javascript
const PEAK_DATES = [
    // Add custom event
    { start: '2026-06-15', end: '2026-06-20', name: 'Summer Festival' },
];
```

### **Seasonal Price Changes:**
Want to raise all prices for summer? Just update the values:

```javascript
// Summer 2026 rates (June-August)
basePrice: 275,      // was 250
weekendRate: 300,    // was 275
peakSeasonRate: 375, // was 350
```

---

## Revenue Optimization Tips

### **When to Use Peak Rates:**
✅ Coachella/Stagecoach (4x bookings expected)
✅ Major holidays (high demand)
✅ Local events in Palm Springs
❌ Random weekends (use weekend rate instead)

### **Weekend vs. Peak:**
- **Weekend rate:** Regular Fri/Sat with no special event (+10-15%)
- **Peak rate:** Special events with proven high demand (+40-80%)

### **Testing Your Pricing:**
1. Open `booking-widget.html` in browser
2. Select property
3. Pick different date ranges
4. Watch pricing change automatically

**Try these dates:**
- Feb 17-19 (weekdays only)
- Feb 21-24 (includes weekend)
- April 10-13 (Coachella peak)

---

## Competitive Analysis

### **Your Pricing Strategy:**

**Cozy Cactus** ($250-350)
- Base: Competitive with similar 3BR Indio properties
- Peak: 40% premium during Coachella (justified by location)

**Casa Moto** ($225-400)
- Base: Slightly below market (good for mid-week bookings)
- Peak: 78% premium (highest markup - test and adjust)

**PS Retreat** ($180-275)
- Base: Excellent value for Palm Springs central
- Peak: 53% premium (reasonable for mid-century + location)

**The Well** ($300-425)
- Base: Premium 1BR (wellness positioning justifies it)
- Peak: 42% premium (boutique experience)

---

## Quick Reference

| Property | Weekday | Weekend | Peak | Cleaning | Tax |
|----------|---------|---------|------|----------|-----|
| Cozy Cactus | $250 | $275 | $350 | $150 | 12% |
| Casa Moto | $225 | $250 | $400 | $150 | 12% |
| PS Retreat | $180 | $200 | $275 | $125 | 13.5% |
| The Well | $300 | $325 | $425 | $200 | 13.5% |

---

## Next Steps

1. **Test the widget:** Open `booking-widget.html`
2. **Try different dates:** See pricing change live
3. **Adjust rates:** Based on your market research
4. **Add to homepage:** Link from "Book Now" buttons
5. **Connect Stripe:** Start taking payments

Your pricing is now **transparent, dynamic, and competitive** — no backend required.
