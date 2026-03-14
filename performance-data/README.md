# Performance Data Tracking

This directory contains local backup files for all performance analytics data.

## Files

### Current Files
- `baseline-metrics.json` - Historical baseline analysis (2023-2025) from import scripts
- `occupancy-snapshot-2026-02-25.json` - Current occupancy rates as of Feb 25, 2026

### Future Files (Generated Weekly)
- `occupancy-snapshot-YYYY-MM-DD.json` - Daily/weekly occupancy snapshots
- `weekly-metrics.csv` - Weekly revenue and occupancy tracking
- `monthly-summary.csv` - Monthly aggregated performance metrics
- `competitor-tracking.csv` - Competitor pricing and positioning data

## Purpose

These files serve as:
1. **Backup** - Local copy in case Google Sheet has issues
2. **Source Data** - Input for automation scripts and analysis
3. **Historical Archive** - Long-term performance tracking

## Data Flow

```
Airbnb/VRBO/Hostaway → Scripts (analyze-*.js) → Local Files (this dir) → Google Sheet (via team-lead)
```

## Update Schedule

**Daily (Optional):**
- Occupancy snapshots (run analyze-occupancy.js)

**Weekly (Every Monday):**
- Revenue metrics
- Occupancy trends
- Booking analytics
- Channel performance

**Monthly (1st of month):**
- Monthly summary report
- Compare vs targets
- Seasonal analysis

## Script Locations

All analysis scripts are in parent directory:
- `/Users/etuan/Desktop/Airbnb/indigopalm/analyze-occupancy.js`
- `/Users/etuan/Desktop/Airbnb/indigopalm/analyze-baseline-from-imports.js`
- `/Users/etuan/Desktop/Airbnb/indigopalm/daily-snapshot-email.js`
- `/Users/etuan/Desktop/Airbnb/indigopalm/generate-reviews-report.js`

## Google Sheet Integration

Data from these files is formatted and sent to @team-lead for logging to:
**Master Operations Sheet → Performance Tab**
https://docs.google.com/spreadsheets/d/1RVwzwt95RNoKhsLpHh3Km_uV0bV9d6jB3JqSIf499yg/edit

## Data Format

All JSON files follow consistent structure:
```json
{
  "date": "YYYY-MM-DD",
  "properties": {
    "property-id": {
      "metrics": "values"
    }
  },
  "portfolio": {
    "aggregated": "metrics"
  }
}
```

CSV files use standard format:
```
Date,Property,Metric1,Metric2,...
```

## Maintenance

- Keep last 90 days of daily snapshots
- Keep all weekly/monthly summaries (archive annually)
- Baseline files are permanent (never delete)

---

**Last Updated:** February 25, 2026
**Maintained By:** performance-analyst agent
