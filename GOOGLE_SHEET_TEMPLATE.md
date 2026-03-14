# Performance Dashboard Google Sheet Template

## Overview
This template provides the structure for manual tracking until all automation scripts are running. Copy this structure into a new Google Sheet.

---

## Sheet 1: Daily Revenue Tracker

### Column Headers (Row 1):
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Date | Casa Moto | Cozy Cactus | PS Retreat | The Well | Total Revenue | Channel (Airbnb/VRBO/Direct) | Notes | Check-ins | Check-outs |

### Instructions:
- Update daily with revenue from each property
- Use dropdown for Channel column: `Airbnb`, `VRBO`, `Direct`
- Notes column for special events, price changes, etc.

### Sample Data:
```
2026-02-25 | $275 | $480 | $0 | $210 | $965 | Airbnb | Casa Moto at new premium rate | Casa Moto (4 guests) | Cozy Cactus (6 guests)
```

### Formulas:
- **Total Revenue (F2)**: `=SUM(B2:E2)`
- **Weekly Total (F9)**: `=SUM(F2:F8)` (adjust range for each week)
- **Monthly Total**: Create summary row at end of month

---

## Sheet 2: Occupancy Tracker

### Column Headers:
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Week Starting | Casa Moto Occ% | Cozy Cactus Occ% | PS Retreat Occ% | The Well Occ% | Portfolio Occ% | Notes | Action Taken |

### Instructions:
- Update weekly (every Monday)
- Calculate occupancy: `(Booked Nights ÷ 7) × 100`
- Portfolio Occ% is average of all properties

### Sample Data:
```
2026-02-24 | 71% | 80% | 59% | 52% | 65.5% | PS Retreat low | Flash sale promo sent
```

### Formulas:
- **Portfolio Occ% (F2)**: `=AVERAGE(B2:E2)`

---

## Sheet 3: Review Tracker

### Column Headers:
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Property | Overall Rating | Cleanliness | Communication | Location | Value | Key Themes |

### Instructions:
- Add each new review as it comes in
- Calculate monthly averages for each category
- Track trends (are ratings improving post-rebrand?)

### Sample Data:
```
2026-02-25 | Casa Moto | 5.0 | 5.0 | 5.0 | 4.8 | 4.9 | "Beautifully renovated, hot tub amazing"
```

### Formulas:
- **Monthly Average Overall (below data)**: `=AVERAGE(C2:C30)` (adjust range)
- **Property Average**: Use `AVERAGEIF(B:B,"Casa Moto",C:C)`

---

## Sheet 4: Expense Tracker

### Column Headers:
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Date | Property | Category | Description | Amount | Receipt Link | Paid From |

### Categories Dropdown:
- Cleaning
- Maintenance & Repairs
- Utilities
- Supplies & Amenities
- Marketing
- Property Management
- Mortgage/Rent
- Insurance
- Other

### Instructions:
- Log every expense
- Link to receipt (Google Drive or photo)
- Calculate totals by category monthly

### Sample Data:
```
2026-02-25 | Casa Moto | Supplies | Pool chemicals | $87.50 | [Link] | QuickBooks
```

### Formulas:
- **Monthly Total (F100)**: `=SUM(E2:E99)`
- **By Category**: `=SUMIF(C:C,"Cleaning",E:E)`
- **By Property**: `=SUMIF(B:B,"Casa Moto",E:E)`

---

## Sheet 5: Marketing Performance

### Column Headers:
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Week Starting | Website Visits | Pinterest Impressions | Pinterest Saves | Instagram Followers | Email Subscribers | Bookings from Website | Conversion Rate % |

### Instructions:
- Update weekly from analytics dashboards
- Track growth week-over-week
- Conversion Rate = (Bookings ÷ Visits) × 100

### Sample Data:
```
2026-02-24 | 1,845 | 14,200 | 87 | 423 | 156 | 3 | 0.16%
```

### Formulas:
- **Conversion Rate (H2)**: `=(G2/B2)*100`
- **Week-over-Week Growth**: `=(B2-B3)/B3*100`

---

## Sheet 6: Competitor Benchmarking

### Column Headers:
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Date Checked | Competitor Name | Base Rate | Peak Rate | Rating | Amenities | Notes |

### Competitors to Track:
1. Casa Serenity
2. Desert Oasis Villa
3. Palm Springs Escape
4. Modern Palm Retreat
5. Indigo Moon House

### Instructions:
- Check monthly (first Monday)
- Search Airbnb for similar properties
- Note any special offers or promotions

### Sample Data:
```
2026-02-25 | Casa Serenity | $280 | $350 | 4.92 | Hot tub, pool, fireplace | Running 15% off promo
```

---

## Sheet 7: Monthly Summary Dashboard

### Key Metrics Table:

| Metric | Casa Moto | Cozy Cactus | PS Retreat | The Well | Portfolio |
|--------|-----------|-------------|------------|----------|-----------|
| **Revenue** | =SUM(Data) | | | | =SUM() |
| **Occupancy %** | | | | | |
| **ADR** | | | | | |
| **# Bookings** | | | | | |
| **Avg Rating** | | | | | |
| **Expenses** | | | | | |
| **Net Income** | | | | | |
| **Net Margin %** | | | | | |

### Instructions:
- Update at end of each month
- Pull from other sheets using formulas
- Create charts for visual reporting

### Sample Formulas:
- **Revenue**: `=SUMIF('Daily Revenue'!B:B,"Casa Moto",'Daily Revenue'!F:F)`
- **Net Income**: `=Revenue-Expenses`
- **Net Margin %**: `=(Net Income/Revenue)*100`

---

## Sheet 8: Goals & Targets

### 90-Day Target Tracker:

| Week # | Date Range | Target Revenue | Actual Revenue | Variance | Target Occ% | Actual Occ% | Status |
|--------|------------|----------------|----------------|----------|-------------|-------------|--------|
| Week 1 | Feb 24-Mar 2 | $3,425 | | | 50% | | |
| Week 2 | Mar 3-9 | $3,700 | | | 52% | | |

### Instructions:
- Set targets based on 90-day goals from framework
- Update weekly with actuals
- Calculate variance: `Actual - Target`
- Status: 🟢 (on track), 🟡 (close), 🔴 (behind)

---

## Conditional Formatting Rules

### Occupancy Sheet:
- **Green** if >=70%
- **Yellow** if 50-69%
- **Red** if <50%

### Review Tracker:
- **Green** if rating >=4.85
- **Yellow** if 4.7-4.84
- **Red** if <4.7

### Goals & Targets:
- **Green** if actual >= target
- **Red** if actual < target

---

## Charts to Create

1. **Revenue Trend Chart** (Sheet 1 data)
   - Line chart: Date (X) vs Total Revenue (Y)
   - Compare to target line

2. **Occupancy Comparison** (Sheet 2 data)
   - Column chart: Properties (X) vs Occupancy % (Y)
   - Show portfolio average as horizontal line

3. **Expense Breakdown** (Sheet 4 data)
   - Pie chart: Categories with percentages

4. **Marketing Funnel** (Sheet 5 data)
   - Funnel chart: Website Visits → Bookings

5. **Rating Trends** (Sheet 3 data)
   - Line chart: Date (X) vs Avg Rating (Y) by property

---

## Automation Ideas (Advanced)

Once comfortable with manual tracking, consider:

1. **Google Sheets + Apps Script**
   - Auto-pull data from Google Analytics API
   - Auto-calculate summaries

2. **Zapier Integrations**
   - Airbnb → Google Sheets (new bookings)
   - Hostaway → Google Sheets (revenue sync)

3. **Data Studio Dashboard**
   - Connect Google Sheet as data source
   - Create visual dashboard for sharing

---

## Quick Start Checklist

- [ ] Create new Google Sheet: "Indigo Palm Performance Dashboard"
- [ ] Copy all 8 sheet structures
- [ ] Set up conditional formatting rules
- [ ] Create 5 charts
- [ ] Add last 30 days of historical data
- [ ] Set reminder: Update daily (revenue), weekly (occupancy, marketing), monthly (summary)
- [ ] Share with team members (view-only access)

---

## Support

If you need help with formulas or automation:
1. Check Google Sheets documentation
2. Ask performance analyst (me!)
3. Consider hiring a Google Sheets expert on Fiverr (~$50) for custom automation

**Template Version**: 1.0
**Last Updated**: February 25, 2026
