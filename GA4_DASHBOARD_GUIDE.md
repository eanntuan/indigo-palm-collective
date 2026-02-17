# How to Read Your Google Analytics Dashboard
## Quick Reference Guide for Indigo Palm Collective

---

## 📊 Your Dashboard Overview

**What You're Tracking:**
- Website visitors and where they come from
- Which properties get the most interest
- How many people click "Book Now" buttons
- Email inquiries (booking conversions)
- Newsletter signups

**Your GA4 Property ID:** G-LCY4M0HEQB
**Access:** [analytics.google.com](https://analytics.google.com)

---

## 🎯 DAILY CHECK (2 minutes)

### What to Look At:

1. **Reports → Realtime**
   - See visitors on your site RIGHT NOW
   - What pages they're viewing
   - Where they're from (country)

   **What's Normal:**
   - 0-5 active users most days
   - Spikes during Coachella/Stagecoach season (Feb-Apr)
   - Weekend traffic usually higher than weekdays

---

2. **Reports → Engagement → Events (Last 7 Days)**

   **Key Events to Watch:**

   | Event Name | What It Means | Good Signal |
   |------------|---------------|-------------|
   | `check_availability_click` | Someone clicked "Check Availability" on a property page | **HIGH INTENT** - They're seriously interested |
   | `booking_click` | Someone clicked booking widget on homepage | **HIGH INTENT** - Ready to book |
   | `email_click` | Someone clicked your email to inquire | **CONVERSION** - Hot lead! |
   | `newsletter_signup` | Someone joined your email list | Growing your audience |
   | `page_view` | Someone viewed a page | Basic traffic metric |

   **What to Do:**
   - If you see 5+ `check_availability_click` in a day → Check your email for inquiries
   - If you see spikes in events but no bookings → Your pricing might be off
   - If events are zero → Check if your site is down or marketing paused

---

## 📅 WEEKLY CHECK (10 minutes)

### 1. Traffic Sources
**Reports → Acquisition → Traffic Acquisition (Last 7 Days)**

| Source | What It Means | What's Good |
|--------|---------------|-------------|
| **Direct** | Typed your URL or bookmarked | Should be 20-40% (loyal visitors) |
| **Organic Search** | Found you on Google | Should grow over time with SEO |
| **Social** | From Instagram/Pinterest/Facebook | Track your social media ROI |
| **Referral** | From another website linking to you | Great for credibility |
| **Paid Search** | Google Ads | Track if you're running ads |
| **Unassigned** | Can't determine source | Usually bots, ignore this |

**🚩 Red Flags:**
- **90%+ Direct traffic** = Either all bot traffic OR you have zero marketing reach
- **Zero Social traffic** = Your Pinterest/Instagram isn't driving traffic yet
- **Zero Organic Search** = Google isn't finding you (SEO problem)

**Your Current Issue (from your report):**
- 90% Direct (27/30 sessions) = Almost no organic discovery
- Need to focus on: Pinterest content, Instagram posts, Google SEO

---

### 2. Property Performance
**Reports → Engagement → Pages and Screens**

See which properties people are most interested in:

| Page | Views | What It Means |
|------|-------|---------------|
| Homepage | High | Good - people are landing properly |
| Cozy Cactus page | Low/Med/High | Family interest level |
| Terra Luz page | Low/Med/High | Design-conscious traveler interest |
| PS Retreat page | Low/Med/High | MCM purist interest |
| The Well page | Low/Med/High | Couples/wellness interest |

**How to Use This:**
- Low property page views = Update homepage cards with better photos/copy
- High views but no bookings = Pricing or availability issue
- One property dominates = Feature it more in marketing

**Your Current Issue (from your report):**
- Homepage: 22 views (good)
- Each property: Only 2 views (bad - people aren't exploring)
- **Action:** Make property cards more clickable, add compelling taglines

---

### 3. Visitor Geography
**Reports → User → Demographics → Demographics Details**

Where your visitors are coming from:

**Your Current Data:**
- Germany: 10 users (42%) → Likely bot traffic
- United States: 7 users (29%) → REAL potential customers
- China: 3 users (13%) → Likely bot traffic

**What to Track:**
- **US visitors** = Your target market
- **California/Arizona/Nevada** = Regional weekend trips
- **New York/Texas** = Festival travelers

**Pro Tip:** In GA4, add a filter to ONLY see US traffic:
1. Click "Add comparison" at top
2. Select "Country" → "United States"
3. Now you're only seeing real potential customers

---

### 4. Engagement Metrics
**Reports → Engagement → Overview**

| Metric | What It Means | What's Good | Your Current |
|--------|---------------|-------------|--------------|
| **Active Users** | Unique visitors in time period | 50-200/week | 24/week |
| **Average Engagement Time** | How long people stay | 60-180 seconds | **3 seconds ⚠️** |
| **New vs Returning** | First-time vs repeat visitors | 70/30 split | Too early to tell |

**🚩 Your Critical Issue: 3 Second Engagement**
This means people are:
- Landing on your site and immediately leaving (bounce)
- OR it's bot traffic (Germany/China visitors)

**How to Fix:**
1. Filter to US traffic only to see real engagement
2. Check mobile experience (most vacation rental searches are mobile)
3. Ensure images load fast
4. Make booking buttons obvious

---

## 🎯 CONVERSION TRACKING (MOST IMPORTANT!)

### Events You Should See (After Our Update):

**Go to: Reports → Engagement → Events**

Look for these custom events we just set up:

1. **check_availability_click**
   - Property name (which property they clicked)
   - This is a HOT LEAD - they're ready to book

2. **email_click**
   - Which email link (booking inquiry, help, direct booking)
   - This is a CONVERSION - they're reaching out

3. **booking_click**
   - Which property from homepage booking widget
   - HIGH INTENT - ready to check rates

---

### How to Track Your True Conversion Rate:

**Formula:**
```
Conversion Rate = (email_click + check_availability_click) ÷ page_view × 100
```

**Example:**
- 100 page views
- 5 check_availability_clicks
- 2 email clicks
- = 7% conversion rate (EXCELLENT for vacation rentals)

**What's Good:**
- 1-3% = Average
- 3-5% = Good
- 5%+ = Excellent (your copy/design is working!)

---

## 📈 MONTHLY REVIEW (30 minutes)

### 1. Compare to Last Month
**Reports → Reports Snapshot → Change date range**

Track these metrics month-over-month:

| Metric | What to Track | Goal |
|--------|---------------|------|
| **Users** | Growing or shrinking? | +20% month over month |
| **Organic traffic** | SEO working? | Should grow steadily |
| **Social traffic** | Pinterest/IG working? | Should correlate with posting |
| **Conversions** | email_click events | 3-5% of users |
| **Engagement time** | People staying longer? | Should increase with better copy |

---

### 2. Best Performing Content
**Reports → Engagement → Pages and Screens**

See which pages keep people engaged longest:
- High engagement time = Great content, people are interested
- High bounce rate = People leave quickly, need better content

**Use This To:**
- Double down on what's working
- Rewrite underperforming pages
- Update property photos/copy

---

### 3. Traffic Source ROI

Track which marketing channels work:

| Channel | Free or Paid? | Goal | How to Measure |
|---------|---------------|------|----------------|
| **Pinterest** | Free | Drive qualified traffic | Check "Social" traffic + pins clicked |
| **Instagram** | Free | Build brand awareness | Check "Social" traffic + profile visits |
| **Google Organic** | Free (SEO effort) | Long-term growth | Check "Organic Search" |
| **Email Marketing** | Free | Convert subscribers | Track link clicks from emails |
| **Google Ads** | Paid | Immediate bookings | Check "Paid Search" + conversion rate |

**Calculate ROI:**
```
If you got 5 bookings from Pinterest (0 cost)
And 5 bookings from Google Ads ($500 cost)
→ Pinterest has INFINITE ROI, focus there!
```

---

## 🚨 ALERTS TO SET UP

### Create Custom Alerts (Advanced):

1. **Zero Traffic Alert**
   - If website goes down, you'll know within 24 hours

2. **Conversion Spike Alert**
   - When bookings surge, check if it's a festival or viral post

3. **High Bounce Rate Alert**
   - If people start leaving immediately, something broke

**How to Set Up:**
1. Go to Admin → Data Streams → Web
2. Click "Enhanced Measurement"
3. Ensure all toggles are ON

---

## 📊 CUSTOM REPORTS TO CREATE

### 1. "Property Performance Dashboard"

Shows which properties drive conversions:

**Dimensions:**
- Property name (from events)
- Event name

**Metrics:**
- Event count
- Conversion rate

**Use:** See which properties to feature in marketing

---

### 2. "Real Visitors Only" (Filter Out Bots)

**Apply Filter:**
- Country = United States
- OR exclude Germany + China

**Use:** See your actual performance without bot noise

---

### 3. "Booking Funnel"

Track the journey:
1. Homepage view
2. Property page view
3. Check availability click
4. Email click (conversion!)

**Use:** See where people drop off, optimize that step

---

## 🎯 WHAT TO FOCUS ON RIGHT NOW

Based on your current data (last 28 days):

### ❌ Problems:
1. **3-second engagement** → People aren't staying
2. **90% direct traffic** → Zero marketing reach
3. **Only 2 views per property** → Homepage isn't converting to exploration
4. **0% retention** → Nobody comes back (need email capture)

### ✅ Solutions:
1. **Filter out bot traffic** (Germany/China) to see real data
2. **Start Pinterest strategy** → Drive qualified social traffic
3. **Update homepage CTAs** → Make property cards more clickable (just did this!)
4. **Capture emails** → Newsletter popup for return visitors
5. **Track conversions** → We just added this, watch for email_click events

---

## 📱 QUICK WINS TO TRACK

### This Week:
- [ ] Check Events report daily for `email_click` (conversions!)
- [ ] Filter traffic to US only (exclude bots)
- [ ] Screenshot current metrics for before/after comparison

### This Month:
- [ ] Post 12 Pinterest pins (from your execution guide)
- [ ] Track which pins drive traffic (check Referral sources)
- [ ] Compare engagement time: Did avatar copy improve it?

### This Quarter:
- [ ] Grow organic traffic from Google (SEO)
- [ ] Build email list to 100+ subscribers
- [ ] Hit 3-5% conversion rate on booking events

---

## 🔗 QUICK LINKS

**Your Most Useful Reports:**
1. [Realtime Overview](https://analytics.google.com/analytics/web/#/realtime) - Live visitors
2. [Traffic Sources](https://analytics.google.com/analytics/web/#/report/trafficsources-overview) - Where people come from
3. [Events Report](https://analytics.google.com/analytics/web/#/report/content-event-overview) - Track conversions
4. [Pages Report](https://analytics.google.com/analytics/web/#/report/content-pages) - Which properties perform best

---

## 💡 PRO TIPS

1. **Mobile Matters**
   - 70%+ of vacation rental searches are on mobile
   - Always check "User → Tech → Details" to see mobile vs desktop split
   - If your mobile traffic has low engagement, your site isn't mobile-optimized

2. **Seasonal Patterns**
   - Track year-over-year (2026 vs 2027)
   - Coachella (April) and Stagecoach (April) should spike traffic
   - If they don't, you're not capturing festival searches

3. **Ignore Vanity Metrics**
   - Page views don't matter if nobody converts
   - Focus on: `email_click` and `check_availability_click` events
   - 100 visitors with 5 bookings > 1,000 visitors with 0 bookings

4. **Compare to Competitors**
   - Airbnb listings get 2-5% conversion rate
   - You should match or beat this with better design/copy
   - If you're below 2%, something's broken

5. **Attribution Windows**
   - Someone might visit 3-5 times before booking
   - Don't expect instant conversions
   - Use email capture to nurture leads

---

## ❓ COMMON QUESTIONS

**Q: Why is my traffic so low?**
A: You're not marketing yet. Start Pinterest + Instagram + SEO.

**Q: How do I know if the avatar copy is working?**
A: Compare engagement time and conversion rate before vs after. Should see 30-60 second engagement instead of 3 seconds.

**Q: What's a "good" conversion rate?**
A: 3-5% for vacation rentals. Below 2% means something's wrong (pricing, copy, design).

**Q: Why is Germany my top traffic source?**
A: Bot traffic. Filter to US only to see real visitors.

**Q: When should I see results from Pinterest?**
A: 2-4 weeks after consistent posting (12+ pins). Check "Social" traffic source.

**Q: How do I track individual pin performance?**
A: Use UTM parameters on Pinterest links, or check GA4 → Reports → Acquisition → All Traffic → Source/Medium

---

## 🎓 NEXT LEVEL: ADVANCED TRACKING

Once you're comfortable with basics, add:

1. **UTM Parameters** - Track which Pinterest pins drive traffic
2. **Audience Segments** - Create lists of high-intent visitors for remarketing
3. **Funnel Visualization** - See exact drop-off points
4. **Cohort Analysis** - Track if people come back
5. **E-commerce Tracking** - If you add direct booking, track actual revenue

---

## 📞 NEED HELP?

If GA4 shows something confusing:
1. Export the report as PDF
2. Ask me to analyze it
3. I'll explain what it means and what to do

**Remember:** Data is only useful if you ACT on it. Check weekly, make changes, track results.

---

**Last Updated:** February 2026
**Property ID:** G-LCY4M0HEQB
**Tracking Active:** ✅ Homepage, All Property Pages, Email Links, Booking Widgets
