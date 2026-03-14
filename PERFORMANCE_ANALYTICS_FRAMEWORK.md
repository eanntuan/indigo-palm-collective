# Performance Analytics Framework
## Indigo Palm Collective - Data-Driven Property Management

**Version**: 1.0
**Last Updated**: February 25, 2026
**Status**: Pre-Launch Setup

---

## 1. Core Metrics Dashboard

### 1.1 Revenue Metrics
Track these daily/weekly/monthly:

| Metric | Formula | Target (90 days) | Data Source |
|--------|---------|------------------|-------------|
| **Total Revenue** | Sum of all payouts | $15,000/property | Airbnb Dashboard → host_payouts.json |
| **RevPAN** | Total Revenue ÷ Available Nights | $150-200/night | Calculated from bookings |
| **ADR (Average Daily Rate)** | Total Revenue ÷ Booked Nights | $220-280/night | reservations.json |
| **Revenue Growth %** | (Current - Previous) ÷ Previous × 100 | +15% MoM | Month-over-month comparison |
| **Channel Revenue Split** | Revenue by source (Airbnb/VRBO/Direct) | 70% Airbnb, 20% VRBO, 10% Direct | booking-config.js + Hostaway |

**📊 Weekly Revenue Report Format:**
```
Week of [Date]:
- Casa Moto: $1,450 (65% occupancy, $223 ADR)
- Cozy Cactus: $1,680 (78% occupancy, $240 ADR)
- PS Retreat: $980 (45% occupancy, $218 ADR)
- The Well: $1,200 (60% occupancy, $200 ADR)

TOTAL: $5,310 | Portfolio Occupancy: 62%
```

---

### 1.2 Occupancy Metrics

| Metric | How to Calculate | Target | Red Flag |
|--------|------------------|--------|----------|
| **Occupancy Rate %** | Booked Nights ÷ Available Nights × 100 | 65-75% | <50% |
| **Booking Lead Time** | Days between booking date and check-in | 21-45 days | <7 days (last-minute only) |
| **Average Length of Stay** | Total booked nights ÷ # of bookings | 3-4 nights | <2 nights (lots of turnover) |
| **Gap Nights %** | Unbookable 1-2 night gaps ÷ Total nights | <10% | >20% |
| **Seasonal Occupancy** | Compare by month/quarter | 80% peak, 50% low | Flat across seasons |

**🎯 First 90 Days Occupancy Targets:**
- **Days 1-30**: 40-50% (building momentum)
- **Days 31-60**: 55-65% (gaining traction)
- **Days 61-90**: 65-75% (sustainable)

**Data Sources:**
- iCal feeds (analyze-occupancy.js)
- Hostaway API calendar data
- Airbnb/VRBO dashboards

---

### 1.3 Guest Experience Metrics

| Metric | Target | How to Track | Alert If |
|--------|--------|--------------|----------|
| **Overall Rating** | 4.85+ / 5.0 | reviews.json → generate-reviews-report.js | <4.7 |
| **Cleanliness Score** | 4.9+ | Review category ratings | <4.8 |
| **Communication Score** | 4.9+ | Review category ratings | <4.7 |
| **Location Score** | 4.7+ | Review category ratings | <4.5 |
| **Value Score** | 4.7+ | Review category ratings | <4.5 |
| **Response Rate** | 100% | Airbnb dashboard | <90% |
| **Response Time** | <1 hour | Airbnb dashboard | >4 hours |
| **Guest Retention Rate** | 10%+ repeat bookings | reservations.json (match guest IDs) | <5% |

**🌟 Review Sentiment Tracking:**
```
Positive Themes (Top 5):
1. Clean (mentioned 45 times)
2. Responsive host (38 times)
3. Hot tub (32 times)
4. Beautiful space (29 times)
5. Well-stocked kitchen (25 times)

Issues to Address (Top 3):
1. WiFi speed in back bedroom (8 mentions)
2. Pool temperature low (5 mentions)
3. Check-in instructions unclear (3 mentions)
```

**Data Sources:**
- Airbnb reviews export
- VRBO reviews
- Private feedback analysis
- generate-reviews-report.js automation

---

### 1.4 Marketing Performance Metrics

| Channel | Metric | Target | How to Track |
|---------|--------|--------|--------------|
| **Website** | Traffic → Booking Conversion | 2-3% | Google Analytics + booking-flow.js |
| **Website** | Avg. Time on Property Pages | 2+ minutes | Google Analytics |
| **Pinterest** | Monthly Impressions | 50,000+ | Pinterest Analytics |
| **Pinterest** | Pin Saves | 500+ | Pinterest Analytics |
| **Pinterest** | Pin → Website Clicks | 1,000+ | Google Analytics (referral source) |
| **Pinterest** | Pinterest → Booking Conversion | 1-2% | Track UTM params in booking URLs |
| **Instagram** | Follower Growth Rate | +5% per month | Instagram Insights |
| **Instagram** | Story Engagement Rate | 10%+ | Instagram Insights |
| **SEO** | Organic Keywords Ranked | 50+ (first 90 days) | Google Search Console |
| **SEO** | Average Position for Target Keywords | Top 20 | Google Search Console |
| **Email** | Newsletter Open Rate | 35%+ | Mailchimp/ConvertKit |
| **Email** | Email → Booking Conversion | 3-5% | Track newsletter subscriber bookings |

**🎨 Content Performance Tracking:**
```
Top Performing Pins (Last 30 Days):
1. Casa Moto Hot Tub Sunset - 2,450 impressions, 185 saves, 42 clicks
2. Cozy Cactus Kitchen Vibe - 1,890 impressions, 142 saves, 38 clicks
3. PS Retreat Pool Aerial - 1,650 impressions, 128 saves, 31 clicks

Best Converting Pages:
1. /casa-moto.html - 3.2% conversion (48 views → 1.5 bookings)
2. /cozy-cactus.html - 2.8% conversion
3. Index (gallery) - 1.9% conversion
```

**Data Sources:**
- Google Analytics 4
- Pinterest Analytics
- Instagram Insights
- Google Search Console
- UTM tracking in booking URLs

---

### 1.5 ROI & Financial Analysis

| Metric | How to Calculate | Review Frequency |
|--------|------------------|------------------|
| **Property ROI** | (Annual Net Income ÷ Total Investment) × 100 | Quarterly |
| **Marketing ROI** | (Revenue from Channel - Marketing Cost) ÷ Marketing Cost × 100 | Monthly |
| **Renovation ROI (Casa Moto)** | (Revenue Increase ÷ Renovation Cost) × 100 | Compare pre/post launch |
| **Cost per Booking** | Total Marketing Spend ÷ # of Bookings | Monthly |
| **Operating Expense Ratio** | (Operating Costs ÷ Gross Revenue) × 100 | Monthly (target: <35%) |
| **Net Profit Margin** | (Net Income ÷ Gross Revenue) × 100 | Monthly (target: 40%+) |

**📈 Monthly P&L Template:**
```
REVENUE:
Gross Rental Income:        $18,500
Cleaning Fees Collected:    $2,400
TOTAL REVENUE:              $20,900

EXPENSES:
Mortgage/Rent:              ($4,800)
Cleaning Services:          ($1,800)
Utilities:                  ($650)
Maintenance & Repairs:      ($420)
Property Management (10%):  ($1,850)
Marketing:                  ($500)
Supplies & Amenities:       ($280)
TOTAL EXPENSES:             ($10,300)

NET INCOME:                 $10,600
Net Profit Margin:          50.7%
```

**Data Sources:**
- QuickBooks (quickbooks-functions.js integration)
- Bank statements
- Receipts tracking
- Hostaway reports

---

### 1.6 Competitive Benchmarking

**Competitor Analysis Template:**

| Your Property | Rate | Occupancy | Rating | Amenities Score |
|---------------|------|-----------|--------|-----------------|
| **Casa Moto** | $250/nt | 68% | 4.89 | Hot tub, pool, workspace, AC |

| Competitor | Rate | Occupancy Est. | Rating | Amenities Score | Gap Analysis |
|------------|------|----------------|--------|-----------------|--------------|
| Casa Serenity | $280/nt | ~75% | 4.92 | Hot tub, pool, fireplace, AC | They have fireplace (high demand) |
| Desert Oasis | $220/nt | ~60% | 4.78 | Pool, workspace | Lower rating = opportunity |
| Palm Springs Escape | $295/nt | ~80% | 4.95 | Hot tub, pool, outdoor kitchen | Premium positioning working |

**How to Track:**
1. **Airbnb Search**: Monthly check competitors in same area/capacity
2. **AirDNA** (if budget allows): $50/month for market data
3. **Manual Calendar Checks**: Estimate occupancy by checking blocked dates
4. **Review Monitoring**: Track competitor reviews for guest pain points

**Quarterly Benchmark Report:**
```
Q1 2026 Competitive Position:
- Your ADR: $238 (Market Avg: $245) → -$7 vs market
- Your Occupancy: 71% (Market Avg: 68%) → +3% vs market
- Your Rating: 4.87 (Market Avg: 4.81) → +0.06 vs market

Strategic Insights:
✓ Occupancy above market = pricing has room to increase
✓ Ratings strong = guest experience validated
⚠ ADR below market = underpricing, recommend +5% increase
```

---

## 2. Data Sources & Collection Methods

### 2.1 Automated Data Collection

| Data Type | Source | Collection Method | Frequency |
|-----------|--------|-------------------|-----------|
| **Bookings** | Airbnb iCal | analyze-occupancy.js script | Daily (via cron) |
| **Revenue** | Hostaway API | API call + store in Firebase | Daily |
| **Reviews** | Airbnb Data Export | generate-reviews-report.js | Weekly |
| **Website Traffic** | Google Analytics | GA4 API integration | Real-time |
| **Pinterest** | Pinterest API | Manual export → CSV | Weekly |
| **Expenses** | QuickBooks | quickbooks-functions.js sync | Weekly |

### 2.2 Manual Tracking (Until Automated)

**Weekly Checklist** (Every Monday 9am):
- [ ] Export Airbnb earnings report (last 7 days)
- [ ] Export VRBO earnings report (last 7 days)
- [ ] Check Hostaway for direct bookings
- [ ] Log expenses in QuickBooks
- [ ] Update Google Sheet: [Performance Dashboard Master](link-to-sheet)
- [ ] Screenshot Pinterest analytics
- [ ] Export Google Analytics weekly summary

**Monthly Deep Dive** (First Monday of month):
- [ ] Download full Airbnb data export
- [ ] Run generate-reviews-report.js for sentiment analysis
- [ ] Compare ADR vs competitors (manual Airbnb search)
- [ ] Review Google Search Console rankings
- [ ] Calculate all ROI metrics
- [ ] Generate monthly performance PDF report

---

## 3. Baseline Metrics (Pre-Launch)

### 3.1 Property Starting Points

| Property | Current Status | Launch Date | Baseline Data Needed |
|----------|----------------|-------------|----------------------|
| **Casa Moto** | Post-renovation | Feb 2026 | Historical data from Casa Moto (2022-2025) |
| **Cozy Cactus** | Active listing | 2022 | Full history in Airbnb export |
| **PS Retreat** | Active listing | 2025 | Since Jan 2025 |
| **The Well** | Active listing | 2025 | Since Jan 2025 |

### 3.2 Historical Performance (For Benchmarking)

**Run this analysis:**
```bash
cd /Users/etuan/Desktop/Airbnb/indigopalm
node analyze-historical-baseline.js
```

This will calculate:
- Average occupancy 2022-2025 (pre-rebrand)
- Average ADR by season
- Review rating trends
- Revenue growth trajectory
- Best/worst performing months

**Expected Output:**
```
Historical Baseline (2022-2025):
====================================
Cozy Cactus:
- Avg Occupancy: 64%
- Avg ADR: $215
- Peak Season (Mar-May): 82% occupancy, $285 ADR
- Low Season (Jul-Aug): 48% occupancy, $185 ADR
- Total Reviews: 87 (4.83 avg)
- YoY Growth: +12% revenue

[Similar for other properties]

Rebrand Opportunity:
- Current portfolio ADR: $215
- Competitive premium ADR: $265
- Potential uplift: +23% with premium positioning
```

---

## 4. First 90 Days KPI Targets

### Days 1-30: Launch & Awareness
**Revenue Goals:**
- Casa Moto: $3,500 (50% occupancy, $233 ADR)
- Cozy Cactus: $4,200 (maintain 65% occupancy)
- PS Retreat: $2,800 (40% occupancy - building awareness)
- The Well: $3,200 (50% occupancy)
- **TOTAL**: $13,700

**Marketing Goals:**
- 5,000 website visits
- 25,000 Pinterest impressions
- 150 Pinterest saves
- 5 direct bookings from website
- 3+ reviews for Casa Moto (establish new identity)

**Operational Goals:**
- Response time <1 hour (100% of inquiries)
- 0 negative reviews
- All properties 4.85+ rating

---

### Days 31-60: Traction & Optimization
**Revenue Goals:**
- Casa Moto: $5,000 (65% occupancy, $256 ADR) ← price increase
- Cozy Cactus: $5,200 (70% occupancy, $248 ADR)
- PS Retreat: $4,000 (55% occupancy)
- The Well: $4,500 (60% occupancy)
- **TOTAL**: $18,700 (+36% vs Month 1)

**Marketing Goals:**
- 8,000 website visits (+60%)
- 40,000 Pinterest impressions
- 300 Pinterest saves
- 10 direct bookings from website
- Rank for 10 target keywords (Google top 30)

**Operational Goals:**
- 5+ reviews per property
- All properties 4.87+ rating
- Guest retention: 2+ repeat bookings

---

### Days 61-90: Sustainable Growth
**Revenue Goals:**
- Casa Moto: $6,500 (75% occupancy, $288 ADR) ← premium established
- Cozy Cactus: $6,000 (75% occupancy, $267 ADR)
- PS Retreat: $5,200 (65% occupancy, $267 ADR)
- The Well: $5,500 (70% occupancy, $262 ADR)
- **TOTAL**: $23,200 (+24% vs Month 2, +69% vs Month 1)

**Marketing Goals:**
- 12,000 website visits
- 60,000 Pinterest impressions
- 500 Pinterest saves
- 15 direct bookings (25% of total bookings)
- Rank for 25 keywords (Google top 20)

**Operational Goals:**
- 10+ reviews per property
- All properties 4.90+ rating
- Guest retention: 8+ repeat bookings across portfolio
- 5-star Superhost status maintained

---

## 5. Reporting Templates

### 5.1 Daily Snapshot (Automated Email)
```
☀️ Indigo Palm Daily Snapshot - [Date]

📅 TODAY'S ACTIVITY:
- Check-ins: Casa Moto (4 guests)
- Check-outs: Cozy Cactus (6 guests)
- New Bookings: PS Retreat (3 nights, $810) 💰

📊 PORTFOLIO STATUS:
- Current Occupancy (Next 30 days): 68%
- Revenue Today: $950
- Revenue MTD: $14,200

⚠️ ACTION ITEMS:
- [ ] Respond to inquiry: The Well (2 hours old)
- [ ] Casa Moto check-in at 4pm - send welcome message
- [ ] Cozy Cactus cleaning scheduled 11am

🌟 NEW REVIEW:
Cozy Cactus - 5 stars ⭐⭐⭐⭐⭐
"Everything was labeled perfectly!"
→ Draft response ready in dashboard
```

---

### 5.2 Weekly Performance Report
```
📊 WEEKLY PERFORMANCE REPORT
Week of [Start Date] - [End Date]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 REVENUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Revenue: $5,840
vs Last Week: +$420 (+7.8%)
vs Same Week Last Year: +$1,250 (+27.2%)

By Property:
┌──────────────────┬────────┬──────┬────────┐
│ Property         │ Revenue│ Occ% │ ADR    │
├──────────────────┼────────┼──────┼────────┤
│ Casa Moto        │ $1,650 │ 71%  │ $275   │
│ Cozy Cactus      │ $1,920 │ 80%  │ $240   │
│ PS Retreat       │ $1,180 │ 59%  │ $235   │
│ The Well         │ $1,090 │ 52%  │ $210   │
└──────────────────┴────────┴──────┴────────┘

By Channel:
- Airbnb: $4,380 (75%)
- VRBO: $1,170 (20%)
- Direct: $290 (5%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 BOOKINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Bookings: 7
Total Booked Nights: 23
Avg Booking Lead Time: 32 days
Avg Length of Stay: 3.3 nights

Next 30 Days Occupancy:
- Casa Moto: 68% (20/30 nights)
- Cozy Cactus: 73% (22/30 nights)
- PS Retreat: 57% (17/30 nights)
- The Well: 63% (19/30 nights)
PORTFOLIO: 65.5%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 GUEST EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Reviews: 4
Average Rating: 4.92 ⭐
Response Rate: 100%
Avg Response Time: 42 minutes

Positive Highlights:
✓ "Immaculately clean" (3 mentions)
✓ "Quick responses" (2 mentions)

Issues Noted:
⚠ WiFi slow in back bedroom (1 mention) → Action: Mesh extender ordered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 MARKETING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website Visits: 1,845 (+12% vs LW)
Pinterest Impressions: 14,200
Pinterest Saves: 87
Top Referral Source: Pinterest (38% of traffic)
Organic Search Traffic: +22% WoW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. URGENT: PS Retreat & The Well occupancy below target
   → Recommendation: Flash sale (15% off next 2 weeks)

2. Casa Moto performing above forecast
   → Recommendation: Test $300/night for peak weekends

3. Pinterest driving strong traffic
   → Recommendation: Double pin frequency (2/day → 4/day)

4. 3 gap nights on Cozy Cactus (Feb 28-Mar 2)
   → Recommendation: Adjust min stay requirement
```

---

### 5.3 Monthly Executive Summary
```
📊 INDIGO PALM COLLECTIVE
Monthly Performance Report - [Month Year]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Revenue: $23,450
Net Income: $11,820
Net Margin: 50.4%
Portfolio Occupancy: 68%
Average ADR: $258
Overall Rating: 4.89/5.0

vs Last Month: +18.2% revenue, +3% occupancy
vs Last Year: +31% revenue, +$56 ADR

Status: ✅ ON TRACK (exceeding 90-day targets)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP PERFORMERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Highest Revenue: Cozy Cactus ($6,940)
🏆 Best Occupancy: Cozy Cactus (78%)
🏆 Highest ADR: Casa Moto ($288)
🏆 Best Rating: Casa Moto (4.95)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ WINS:
1. Casa Moto rebrand impact: +42% vs Casa Moto historical
2. Direct bookings hit 12% (target: 10%)
3. Guest retention at 14% (8 repeat bookings)
4. All properties maintained 4.85+ ratings

⚠️ CHALLENGES:
1. PS Retreat slower to gain traction (61% vs 65% target)
2. Gap nights cost ~$1,200 in lost revenue
3. VRBO underperforming (18% vs 20% target)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PRICING: Casa Moto validated at premium tier
   → Increase Cozy Cactus base rate by $15/night

2. MARKETING: Pinterest ROI = 4.2x (best channel)
   → Increase Pinterest content budget by 30%

3. OPERATIONS: PS Retreat needs awareness boost
   → Run targeted Instagram ads ($500 budget)

4. GUEST EXPERIENCE: 92% mention "clean" or "labeled"
   → Lean into systems-focused messaging in listings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT MONTH FORECAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revenue Target: $26,800 (+14%)
Occupancy Target: 72%
ADR Target: $268 (+$10)
Marketing Focus: Spring break bookings
```

---

## 6. Tools & Automation

### 6.1 Existing Scripts (Ready to Use)

| Script | Purpose | Run Command | Output |
|--------|---------|-------------|--------|
| `analyze-occupancy.js` | Real-time occupancy tracking | `node analyze-occupancy.js` | Console report + alerts |
| `generate-reviews-report.js` | Sentiment analysis & themes | `node generate-reviews-report.js` | reviews-data.json |
| `quickbooks-functions.js` | Sync expenses from QuickBooks | Via dashboard UI | Firebase sync |

### 6.2 Scripts to Build

**Priority 1 (Week 1):**
1. **`analyze-historical-baseline.js`**
   - Parse Airbnb data export (2022-2025)
   - Calculate baseline metrics for comparison
   - Output: baseline-metrics.json

2. **`daily-snapshot-email.js`**
   - Pull today's bookings, check-ins, check-outs
   - Calculate MTD revenue
   - Email summary to owner

3. **`competitor-pricing-scraper.js`**
   - Check 5 competitor Airbnb listings
   - Log pricing + availability
   - Alert if competitors undercut by >$20

**Priority 2 (Week 2-3):**
4. **`weekly-performance-report.js`**
   - Aggregate data from all sources
   - Generate formatted report
   - Auto-export to PDF

5. **`gap-night-optimizer.js`**
   - Identify 1-2 night gaps in calendar
   - Calculate lost revenue
   - Suggest min stay adjustments

6. **`booking-lead-time-analyzer.js`**
   - Track when guests book (how far in advance)
   - Identify last-minute vs planner segments
   - Optimize pricing by lead time

**Priority 3 (Month 2):**
7. **`roi-calculator.js`**
   - Pull revenue + expenses
   - Calculate all ROI metrics
   - Generate monthly P&L

8. **`pinterest-performance-tracker.js`**
   - Pull Pinterest API data
   - Match pins to website traffic
   - Calculate pin-to-booking conversion

---

### 6.3 Dashboard Integration

**Current Status:**
- ✅ Firebase backend set up
- ✅ QuickBooks integration functional
- ✅ Review data pipeline working

**To Add:**
1. **Real-time occupancy widget** (use analyze-occupancy.js data)
2. **Revenue chart** (daily/weekly/monthly toggle)
3. **Competitor benchmarking table**
4. **Marketing attribution report** (which channels drive bookings)
5. **Guest sentiment heatmap** (track review themes over time)

---

## 7. Success Criteria

### 7.1 Green Flags (You're Crushing It)
- ✅ Occupancy >70% consistently
- ✅ ADR >$250 average
- ✅ All properties rated 4.85+
- ✅ Response time <1 hour
- ✅ Direct bookings >10% of total
- ✅ Guest retention >10%
- ✅ Marketing ROI >3x
- ✅ Net profit margin >45%

### 7.2 Yellow Flags (Needs Attention)
- ⚠️ Occupancy 50-65%
- ⚠️ Rating dropped below 4.8 on any property
- ⚠️ Response time >2 hours
- ⚠️ Direct bookings <5%
- ⚠️ No repeat guests in 60 days
- ⚠️ Gap nights >15%

### 7.3 Red Flags (Urgent Action)
- 🚨 Occupancy <50% for 2+ weeks
- 🚨 Rating below 4.7
- 🚨 Negative review not responded to in 24h
- 🚨 Revenue down >20% MoM (non-seasonal)
- 🚨 No bookings in next 30 days
- 🚨 Operating expenses >40% of revenue

---

## 8. Next Steps (Implementation Plan)

### Week 1: Foundation Setup
- [ ] Create Google Sheet: "Performance Dashboard Master"
- [ ] Set up Google Analytics 4 on website
- [ ] Connect Google Search Console
- [ ] Set up Pinterest Analytics business account
- [ ] Run analyze-historical-baseline.js for benchmarks
- [ ] Build daily-snapshot-email.js script

### Week 2: Automation & Tracking
- [ ] Set up cron job: Run analyze-occupancy.js daily at 9am
- [ ] Set up cron job: Run daily-snapshot-email.js daily at 8am
- [ ] Build competitor-pricing-scraper.js
- [ ] Create first weekly report template in Google Docs

### Week 3: Optimization Tools
- [ ] Build gap-night-optimizer.js
- [ ] Build booking-lead-time-analyzer.js
- [ ] Set up Google Analytics goals for bookings
- [ ] Create UTM tracking for all Pinterest pins

### Week 4: Dashboard Enhancement
- [ ] Add real-time occupancy widget to dashboard
- [ ] Add revenue chart (Chart.js integration)
- [ ] Add competitor benchmarking table
- [ ] Test all automations end-to-end

---

## 9. Data Privacy & Security

**Sensitive Data Handling:**
- Guest personal info (names, emails, phone) → Never log in scripts
- Payment info → Already handled securely by Airbnb/VRBO/Stripe
- Financial data → QuickBooks OAuth (never store credentials)
- API keys → Store in .env file (gitignored)

**Backup Strategy:**
- Firebase automatic daily backups
- Monthly export of all data to Google Drive
- Version control all scripts (GitHub private repo)

---

## 10. Resources & References

**Internal Links:**
- [Booking Config](/Users/etuan/Desktop/Airbnb/indigopalm/booking-flow.js)
- [Review Analysis Script](/Users/etuan/Desktop/Airbnb/indigopalm/generate-reviews-report.js)
- [Occupancy Tracker](/Users/etuan/Desktop/Airbnb/indigopalm/analyze-occupancy.js)
- [QuickBooks Integration](/Users/etuan/Desktop/Airbnb/indigopalm/quickbooks-functions.js)

**Data Exports:**
- Airbnb data: `/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/`
- Historical payouts: `/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/host_payouts.json`
- Historical reviews: `/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/reviews.json`
- Historical reservations: `/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/reservations.json`

**External Tools:**
- Google Analytics 4: https://analytics.google.com
- Google Search Console: https://search.google.com/search-console
- Pinterest Analytics: https://analytics.pinterest.com
- Hostaway Dashboard: https://dashboard.hostaway.com
- Airbnb Host Dashboard: https://www.airbnb.com/hosting/listings
- VRBO Owner Dashboard: https://www.vrbo.com/my-dashboard

**Recommended (Optional):**
- AirDNA ($50/month): Market data & competitor analysis
- PriceLabs ($20/month): Dynamic pricing optimization
- TouchStay ($8/property/month): Digital guidebooks with analytics

---

## Questions or Issues?

Contact performance analyst (me!) for:
- Script troubleshooting
- Custom metric requests
- Dashboard enhancements
- Data interpretation help
- Benchmark comparisons

**Status**: Ready to track from Day 1 🚀
