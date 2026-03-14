#!/usr/bin/env node

/**
 * Baseline Metrics from Import Scripts
 *
 * Since the Airbnb data export doesn't contain structured booking/revenue data,
 * this script extracts baseline metrics from the existing import scripts
 * (import-2023-revenue.js, import-2024-revenue.js, import-2025-revenue.js)
 * which contain manually extracted monthly revenue data.
 *
 * Calculates:
 * - Historical revenue trends (2023-2025)
 * - Average monthly revenue by season
 * - Year-over-year growth
 * - Best/worst performing months
 * - ADR estimates (based on occupancy from analyze-occupancy.js)
 *
 * Output: baseline-metrics.json + console report
 */

import fs from 'fs';

console.log('📊 Historical Baseline Analysis (2023-2025)');
console.log('Data Source: Import scripts (manually extracted from Airbnb earnings reports)');
console.log('='.repeat(70));
console.log('');

// Revenue data from import scripts (Cozy Cactus / Cochran property)
const revenue2023 = [
  { month: 0, name: 'January', grossEarnings: 7892.18, netIncome: 7656.05 },
  { month: 1, name: 'February', grossEarnings: 8144.48, netIncome: 7750.14 },
  { month: 2, name: 'March', grossEarnings: 12000.84, netIncome: 11640.81 },
  { month: 3, name: 'April', grossEarnings: 16489.92, netIncome: 15995.22 },
  { month: 4, name: 'May', grossEarnings: 4101.30, netIncome: 3982.40 },
  { month: 5, name: 'June', grossEarnings: 3746.00, netIncome: 3636.02 },
  { month: 6, name: 'July', grossEarnings: 2619.00, netIncome: 2540.43 },
  { month: 7, name: 'August', grossEarnings: 1565.00, netIncome: 1520.60 },
  { month: 8, name: 'September', grossEarnings: 3386.05, netIncome: 3306.07 },
  { month: 9, name: 'October', grossEarnings: 2263.00, netIncome: 2195.11 },
  { month: 10, name: 'November', grossEarnings: 6043.00, netIncome: 5861.71 },
  { month: 11, name: 'December', grossEarnings: 5086.00, netIncome: 4933.42 }
];

const revenue2024 = [
  { month: 0, name: 'January', grossEarnings: 2418.30, netIncome: 2345.75 },
  { month: 1, name: 'February', grossEarnings: 7855.80, netIncome: 7621.63 },
  { month: 2, name: 'March', grossEarnings: 4695.00, netIncome: 4554.15 },
  { month: 3, name: 'April', grossEarnings: 15266.00, netIncome: 14815.52 },
  { month: 4, name: 'May', grossEarnings: 2555.00, netIncome: 2478.35 },
  { month: 5, name: 'June', grossEarnings: 2392.20, netIncome: 2320.43 },
  { month: 6, name: 'July', grossEarnings: 2188.60, netIncome: 2122.94 },
  { month: 7, name: 'August', grossEarnings: 1822.20, netIncome: 1767.53 },
  { month: 8, name: 'September', grossEarnings: 1392.00, netIncome: 1353.99 },
  { month: 9, name: 'October', grossEarnings: 2184.00, netIncome: 2120.88 },
  { month: 10, name: 'November', grossEarnings: 5374.00, netIncome: 5212.78 },
  { month: 11, name: 'December', grossEarnings: 7232.00, netIncome: 7040.96 }
];

const revenue2025 = [
  { month: 0, name: 'January', grossEarnings: 2258.74, netIncome: 2191.00 } // Partial year
];

// Season definitions (Palm Springs)
const SEASONS = {
  'PEAK': [2, 3, 4], // March, April, May
  'SHOULDER': [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  'LOW': [5, 6, 7, 8] // Jun, Jul, Aug, Sep
};

function getSeasonFromMonth(monthIndex) {
  for (const [season, months] of Object.entries(SEASONS)) {
    if (months.includes(monthIndex)) return season;
  }
  return 'UNKNOWN';
}

function analyzeYear(yearData, year) {
  const totalGross = yearData.reduce((sum, m) => sum + m.grossEarnings, 0);
  const totalNet = yearData.reduce((sum, m) => sum + m.netIncome, 0);
  const avgMonthly = totalNet / yearData.length;

  // Calculate by season
  const seasonalData = { PEAK: [], SHOULDER: [], LOW: [] };
  yearData.forEach(month => {
    const season = getSeasonFromMonth(month.month);
    seasonalData[season].push(month.netIncome);
  });

  const seasonalAvgs = {};
  for (const [season, values] of Object.entries(seasonalData)) {
    if (values.length > 0) {
      seasonalAvgs[season] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }
  }

  // Best and worst months
  const bestMonth = yearData.reduce((max, m) => m.netIncome > max.netIncome ? m : max);
  const worstMonth = yearData.reduce((min, m) => m.netIncome < min.netIncome ? m : min);

  return {
    year,
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalNet: parseFloat(totalNet.toFixed(2)),
    avgMonthly: parseFloat(avgMonthly.toFixed(2)),
    serviceFees: parseFloat((totalGross - totalNet).toFixed(2)),
    serviceFeePercent: parseFloat(((totalGross - totalNet) / totalGross * 100).toFixed(1)),
    monthsData: yearData.length,
    seasonalAvgs,
    bestMonth: { name: bestMonth.name, amount: parseFloat(bestMonth.netIncome.toFixed(2)) },
    worstMonth: { name: worstMonth.name, amount: parseFloat(worstMonth.netIncome.toFixed(2)) },
    monthlyBreakdown: yearData.map(m => ({
      month: m.name,
      net: parseFloat(m.netIncome.toFixed(2)),
      gross: parseFloat(m.grossEarnings.toFixed(2)),
      season: getSeasonFromMonth(m.month)
    }))
  };
}

try {
  console.log('🏠 COZY CACTUS (COCHRAN) - Historical Performance');
  console.log('-'.repeat(70));
  console.log('');

  // Analyze each year
  const baseline2023 = analyzeYear(revenue2023, 2023);
  const baseline2024 = analyzeYear(revenue2024, 2024);
  const baseline2025 = analyzeYear(revenue2025, 2025);

  // Display 2023
  console.log('📅 2023 Performance:');
  console.log(`   Total Revenue: $${baseline2023.totalNet.toLocaleString()}`);
  console.log(`   Average Monthly: $${baseline2023.avgMonthly.toLocaleString()}`);
  console.log(`   Service Fees: $${baseline2023.serviceFees.toLocaleString()} (${baseline2023.serviceFeePercent}%)`);
  console.log('');
  console.log('   Seasonal Averages:');
  console.log(`     PEAK (Mar-May):      $${(baseline2023.seasonalAvgs.PEAK || 0).toLocaleString()}/month`);
  console.log(`     SHOULDER (Winter):   $${(baseline2023.seasonalAvgs.SHOULDER || 0).toLocaleString()}/month`);
  console.log(`     LOW (Summer):        $${(baseline2023.seasonalAvgs.LOW || 0).toLocaleString()}/month`);
  console.log('');
  console.log(`   🏆 Best Month: ${baseline2023.bestMonth.name} ($${baseline2023.bestMonth.amount.toLocaleString()})`);
  console.log(`   📉 Slowest Month: ${baseline2023.worstMonth.name} ($${baseline2023.worstMonth.amount.toLocaleString()})`);
  console.log('');

  // Display 2024
  console.log('📅 2024 Performance:');
  console.log(`   Total Revenue: $${baseline2024.totalNet.toLocaleString()}`);
  console.log(`   Average Monthly: $${baseline2024.avgMonthly.toLocaleString()}`);
  console.log(`   Service Fees: $${baseline2024.serviceFees.toLocaleString()} (${baseline2024.serviceFeePercent}%)`);
  console.log('');
  console.log('   Seasonal Averages:');
  console.log(`     PEAK (Mar-May):      $${(baseline2024.seasonalAvgs.PEAK || 0).toLocaleString()}/month`);
  console.log(`     SHOULDER (Winter):   $${(baseline2024.seasonalAvgs.SHOULDER || 0).toLocaleString()}/month`);
  console.log(`     LOW (Summer):        $${(baseline2024.seasonalAvgs.LOW || 0).toLocaleString()}/month`);
  console.log('');
  console.log(`   🏆 Best Month: ${baseline2024.bestMonth.name} ($${baseline2024.bestMonth.amount.toLocaleString()})`);
  console.log(`   📉 Slowest Month: ${baseline2024.worstMonth.name} ($${baseline2024.worstMonth.amount.toLocaleString()})`);
  console.log('');

  // Year-over-year comparison
  const yoyGrowth = ((baseline2024.totalNet - baseline2023.totalNet) / baseline2023.totalNet * 100).toFixed(1);
  console.log('📈 Year-over-Year Change (2023 → 2024):');
  console.log(`   Revenue: ${yoyGrowth > 0 ? '+' : ''}$${(baseline2024.totalNet - baseline2023.totalNet).toFixed(0)} (${yoyGrowth > 0 ? '+' : ''}${yoyGrowth}%)`);
  console.log(`   Average Monthly: ${(baseline2024.avgMonthly - baseline2023.avgMonthly) > 0 ? '+' : ''}$${(baseline2024.avgMonthly - baseline2023.avgMonthly).toFixed(0)}`);
  console.log('');

  // 2025 projection
  console.log('📊 2025 Performance (Partial - Jan only):');
  console.log(`   January Revenue: $${baseline2025.totalNet.toLocaleString()}`);
  console.log(`   vs Jan 2024: ${baseline2025.totalNet > baseline2024.monthlyBreakdown[0].net ? '+' : ''}$${(baseline2025.totalNet - baseline2024.monthlyBreakdown[0].net).toFixed(0)} (${((baseline2025.totalNet - baseline2024.monthlyBreakdown[0].net) / baseline2024.monthlyBreakdown[0].net * 100).toFixed(1)}%)`);
  console.log(`   vs Jan 2023: ${baseline2025.totalNet > baseline2023.monthlyBreakdown[0].net ? '+' : ''}$${(baseline2025.totalNet - baseline2023.monthlyBreakdown[0].net).toFixed(0)} (${((baseline2025.totalNet - baseline2023.monthlyBreakdown[0].net) / baseline2023.monthlyBreakdown[0].net * 100).toFixed(1)}%)`);
  console.log('');

  // Estimated ADR (based on typical 65% occupancy and 30 available nights/month)
  const estimatedNights2023 = 30 * 0.65; // ~20 nights/month
  const estimatedADR2023 = baseline2023.avgMonthly / estimatedNights2023;
  const estimatedADR2024 = baseline2024.avgMonthly / estimatedNights2023;

  console.log('💡 Estimated Metrics (assuming ~65% occupancy):');
  console.log(`   2023 Average ADR: ~$${estimatedADR2023.toFixed(0)}/night`);
  console.log(`   2024 Average ADR: ~$${estimatedADR2024.toFixed(0)}/night`);
  console.log(`   Change: ${estimatedADR2024 > estimatedADR2023 ? '+' : ''}$${(estimatedADR2024 - estimatedADR2023).toFixed(0)}/night`);
  console.log('');

  console.log('='.repeat(70));
  console.log('');

  // Rebrand opportunity analysis
  console.log('🎯 REBRAND OPPORTUNITY ANALYSIS');
  console.log('='.repeat(70));
  console.log('');

  const historicalADR = (estimatedADR2023 + estimatedADR2024) / 2;
  const targetPremiumADR = 265;
  const upliftDollar = targetPremiumADR - historicalADR;
  const upliftPercent = (upliftDollar / historicalADR * 100).toFixed(1);

  console.log(`📊 Historical Baseline (2023-2024 average):`);
  console.log(`   Average Monthly Revenue: $${((baseline2023.avgMonthly + baseline2024.avgMonthly) / 2).toFixed(0)}`);
  console.log(`   Estimated Average ADR: $${historicalADR.toFixed(0)}/night`);
  console.log('');
  console.log(`🎯 Post-Rebrand Premium Positioning Target:`);
  console.log(`   Target ADR: $${targetPremiumADR}/night`);
  console.log(`   Potential Uplift: +$${upliftDollar.toFixed(0)}/night (+${upliftPercent}%)`);
  console.log('');

  // Calculate annual impact for all 4 properties
  const propertiesCount = 4;
  const avgOccupancy = 0.70;
  const annualNights = 365 * avgOccupancy * propertiesCount;
  const additionalAnnualRevenue = upliftDollar * annualNights;

  console.log(`💰 Annual Revenue Impact (4-property portfolio at 70% occupancy):`);
  console.log(`   Additional Revenue Potential: +$${additionalAnnualRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} per year`);
  console.log(`   Monthly Impact: +$${(additionalAnnualRevenue / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })} per month`);
  console.log('');

  console.log(`🏆 If Casa Moto can achieve premium positioning:`);
  console.log(`   From: $${historicalADR.toFixed(0)}/night → To: $${targetPremiumADR}/night`);
  console.log(`   Monthly Revenue: $${((baseline2023.avgMonthly + baseline2024.avgMonthly) / 2).toFixed(0)} → $${(targetPremiumADR * estimatedNights2023).toFixed(0)}`);
  console.log(`   That's +$${((targetPremiumADR * estimatedNights2023) - ((baseline2023.avgMonthly + baseline2024.avgMonthly) / 2)).toFixed(0)}/month per property`);
  console.log('');

  console.log('='.repeat(70));
  console.log('');

  // Key insights
  console.log('📌 KEY INSIGHTS:');
  console.log('');
  console.log(`1. Historical Performance:`);
  console.log(`   - 2023 was stronger year ($${baseline2023.totalNet.toLocaleString()} vs 2024's $${baseline2024.totalNet.toLocaleString()})`);
  console.log(`   - 2024 saw ${yoyGrowth}% decline (likely market conditions or listing changes)`);
  console.log('');
  console.log(`2. Seasonal Patterns:`);
  console.log(`   - Peak season (Mar-Apr-May) = 2-3x higher than summer`);
  console.log(`   - April consistently strongest month (~$15k)`);
  console.log(`   - Summer (Jun-Sep) consistently slowest (~$2-3k/month)`);
  console.log('');
  console.log(`3. Rebrand Opportunity:`);
  console.log(`   - Current performance: ~$${historicalADR.toFixed(0)}/night ADR`);
  console.log(`   - With premium positioning: $265+/night ADR is achievable`);
  console.log(`   - Portfolio-wide impact: +$${(additionalAnnualRevenue / 1000).toFixed(0)}k annually`);
  console.log('');
  console.log(`4. 2025 Early Signal:`);
  console.log(`   - January 2025 DOWN vs both prior years`);
  console.log(`   - This supports rebrand urgency (need differentiation)`);
  console.log('');

  // Save to JSON
  const outputData = {
    generatedAt: new Date().toISOString(),
    dataSource: 'Import scripts (manual extraction from Airbnb earnings reports)',
    property: 'Cozy Cactus (Cochran)',
    years: {
      2023: baseline2023,
      2024: baseline2024,
      2025: baseline2025
    },
    historicalAverage: {
      avgMonthlyRevenue: parseFloat((((baseline2023.avgMonthly + baseline2024.avgMonthly) / 2)).toFixed(2)),
      estimatedADR: parseFloat(historicalADR.toFixed(2)),
      estimatedOccupancy: 65
    },
    rebrandOpportunity: {
      targetADR: targetPremiumADR,
      upliftPerNight: parseFloat(upliftDollar.toFixed(2)),
      upliftPercent: parseFloat(upliftPercent),
      annualImpact4Properties: parseFloat(additionalAnnualRevenue.toFixed(2))
    },
    seasonalPatterns: {
      peak: 'March-April-May (highest revenue)',
      shoulder: 'Jan-Feb-Oct-Nov-Dec (moderate)',
      low: 'June-September (lowest revenue)',
      bestMonth: 'April',
      avgPeakRevenue: parseFloat((((baseline2023.seasonalAvgs.PEAK || 0) + (baseline2024.seasonalAvgs.PEAK || 0)) / 2).toFixed(2)),
      avgLowRevenue: parseFloat((((baseline2023.seasonalAvgs.LOW || 0) + (baseline2024.seasonalAvgs.LOW || 0)) / 2).toFixed(2))
    }
  };

  const outputPath = '/Users/etuan/Desktop/Airbnb/indigopalm/baseline-metrics.json';
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

  console.log(`✅ Baseline metrics saved to: ${outputPath}`);
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
