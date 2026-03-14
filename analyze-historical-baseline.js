#!/usr/bin/env node

/**
 * Historical Baseline Analyzer
 *
 * Analyzes Airbnb data export (2022-2025) to establish baseline metrics
 * for pre-rebrand performance comparison.
 *
 * Calculates:
 * - Average occupancy by property & season
 * - Average ADR by property & season
 * - Review rating trends
 * - Revenue growth trajectory
 * - Best/worst performing months
 *
 * Output: baseline-metrics.json + console report
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = '/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json';

// Property mapping (Airbnb listing IDs → property names)
const PROPERTY_MAP = {
  '610023395582313286': 'Cozy Cactus',
  '716871660845992276': 'Casa Moto (Casa Moto)', // Historical name
  '1171049679026732503': 'PS Retreat',
  '868862893900280104': 'The Well'
};

// Season definitions
const SEASONS = {
  'PEAK': [3, 4, 5], // March, April, May (peak Palm Springs season)
  'SHOULDER': [1, 2, 10, 11, 12], // Winter & fall
  'LOW': [6, 7, 8, 9] // Summer (hot season)
};

function getSeasonFromMonth(month) {
  for (const [season, months] of Object.entries(SEASONS)) {
    if (months.includes(month)) return season;
  }
  return 'UNKNOWN';
}

console.log('📊 Historical Baseline Analysis (2022-2025)');
console.log('='.repeat(70));
console.log('');

try {
  // Load data files
  console.log('📁 Loading data files...');
  const reservationsPath = path.join(DATA_DIR, 'reservations.json');
  const reviewsPath = path.join(DATA_DIR, 'reviews.json');
  const listingsPath = path.join(DATA_DIR, 'listings.json');
  const payoutsPath = path.join(DATA_DIR, 'host_payouts.json');

  const reservationsData = JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
  const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
  const listingsData = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));

  // Payouts file might not have detailed booking data, focusing on reservations
  console.log('✅ Data loaded successfully\n');

  // Initialize metrics storage
  const metrics = {};
  for (const propertyName of Object.values(PROPERTY_MAP)) {
    metrics[propertyName] = {
      totalRevenue: 0,
      totalNights: 0,
      totalBookings: 0,
      revenueByYear: {},
      revenueByMonth: {},
      revenueBySeason: { PEAK: 0, SHOULDER: 0, LOW: 0 },
      nightsByYear: {},
      nightsBySeason: { PEAK: 0, SHOULDER: 0, LOW: 0 },
      bookingsByYear: {},
      reviews: [],
      ratingsByCategory: {
        overall: [],
        cleanliness: [],
        communication: [],
        location: [],
        value: []
      }
    };
  }

  // Process reservations (bookings from Airbnb data export)
  console.log('📅 Analyzing reservations...');

  // The reservations.json structure has bookingSessions array
  let processedCount = 0;

  reservationsData.forEach(bookingGroup => {
    if (bookingGroup.bookingSessions) {
      bookingGroup.bookingSessions.forEach(session => {
        // Extract booking details from confirmations
        if (session.confirmations) {
          session.confirmations.forEach(confirmation => {
            const booking = confirmation.confirmation;
            if (!booking || !booking.hasSubmitted) return;

            // Identify property
            const listingId = booking.listingId || booking.bookableId;
            const propertyName = PROPERTY_MAP[listingId];
            if (!propertyName) return;

            // Parse dates
            const startDate = new Date(booking.startDate || booking.checkInDate);
            const endDate = new Date(booking.endDate || booking.checkOutDate);

            if (isNaN(startDate) || isNaN(endDate)) return;

            // Calculate nights
            const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            if (nights <= 0 || nights > 60) return; // Skip invalid data

            // Extract revenue (from confirmation or booking object)
            const revenue = parseFloat(booking.totalPrice?.amount || booking.payoutPrice?.amount || 0);
            if (revenue <= 0) return;

            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const season = getSeasonFromMonth(month);

            // Aggregate metrics
            metrics[propertyName].totalRevenue += revenue;
            metrics[propertyName].totalNights += nights;
            metrics[propertyName].totalBookings += 1;

            // By year
            if (!metrics[propertyName].revenueByYear[year]) {
              metrics[propertyName].revenueByYear[year] = 0;
              metrics[propertyName].nightsByYear[year] = 0;
              metrics[propertyName].bookingsByYear[year] = 0;
            }
            metrics[propertyName].revenueByYear[year] += revenue;
            metrics[propertyName].nightsByYear[year] += nights;
            metrics[propertyName].bookingsByYear[year] += 1;

            // By month
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            if (!metrics[propertyName].revenueByMonth[monthKey]) {
              metrics[propertyName].revenueByMonth[monthKey] = { revenue: 0, nights: 0, bookings: 0 };
            }
            metrics[propertyName].revenueByMonth[monthKey].revenue += revenue;
            metrics[propertyName].revenueByMonth[monthKey].nights += nights;
            metrics[propertyName].revenueByMonth[monthKey].bookings += 1;

            // By season
            metrics[propertyName].revenueBySeason[season] += revenue;
            metrics[propertyName].nightsBySeason[season] += nights;

            processedCount++;
          });
        }
      });
    }
  });

  console.log(`✅ Processed ${processedCount} bookings\n`);

  // Process reviews
  console.log('🌟 Analyzing reviews...');
  let reviewCount = 0;

  reviewsData.forEach(reviewGroup => {
    if (reviewGroup.reviewsReceived) {
      reviewGroup.reviewsReceived.forEach(reviewItem => {
        const review = reviewItem.review;
        if (!review || !review.hasSubmitted) return;

        const listingId = review.bookableId || review.entityId;
        const propertyName = PROPERTY_MAP[listingId];
        if (!propertyName) return;

        // Overall rating
        if (review.rating) {
          metrics[propertyName].ratingsByCategory.overall.push(review.rating);
        }

        // Category ratings
        if (reviewItem.reviewCategoryRatings) {
          reviewItem.reviewCategoryRatings.forEach(cat => {
            const category = cat.ratingCategory.toLowerCase();
            if (metrics[propertyName].ratingsByCategory[category]) {
              metrics[propertyName].ratingsByCategory[category].push(cat.ratingV2);
            }
          });
        }

        // Store review details
        metrics[propertyName].reviews.push({
          date: new Date(review.submittedAt || review.createdAt),
          rating: review.rating,
          comment: review.comment || ''
        });

        reviewCount++;
      });
    }
  });

  console.log(`✅ Processed ${reviewCount} reviews\n`);

  // Calculate final metrics and display report
  console.log('');
  console.log('='.repeat(70));
  console.log('📊 BASELINE METRICS REPORT (Pre-Rebrand)');
  console.log('='.repeat(70));
  console.log('');

  const baselineReport = {};

  for (const [propertyName, data] of Object.entries(metrics)) {
    if (data.totalBookings === 0) {
      console.log(`⚠️  ${propertyName}: No historical data found`);
      console.log('');
      continue;
    }

    console.log(`🏠 ${propertyName}`);
    console.log('-'.repeat(70));

    // Overall metrics
    const avgADR = data.totalRevenue / data.totalNights;
    const avgStayLength = data.totalNights / data.totalBookings;
    const avgRating = data.ratingsByCategory.overall.length > 0
      ? data.ratingsByCategory.overall.reduce((a, b) => a + b, 0) / data.ratingsByCategory.overall.length
      : 0;

    console.log(`\n📈 Overall Performance:`);
    console.log(`   Total Revenue: $${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Total Bookings: ${data.totalBookings}`);
    console.log(`   Total Nights Booked: ${data.totalNights}`);
    console.log(`   Average ADR: $${avgADR.toFixed(2)}`);
    console.log(`   Average Stay Length: ${avgStayLength.toFixed(1)} nights`);
    console.log(`   Average Rating: ${avgRating.toFixed(2)} ⭐ (${data.ratingsByCategory.overall.length} reviews)`);

    // Year-over-year
    const years = Object.keys(data.revenueByYear).sort();
    if (years.length > 1) {
      console.log(`\n📅 Year-over-Year:`);
      years.forEach((year, idx) => {
        const revenue = data.revenueByYear[year];
        const nights = data.nightsByYear[year];
        const bookings = data.bookingsByYear[year];
        const adr = revenue / nights;

        let growth = '';
        if (idx > 0) {
          const prevRevenue = data.revenueByYear[years[idx - 1]];
          const growthPct = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
          growth = ` (${growthPct > 0 ? '+' : ''}${growthPct}%)`;
        }

        console.log(`   ${year}: $${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} | ${bookings} bookings | $${adr.toFixed(0)} ADR${growth}`);
      });
    }

    // Seasonal performance
    console.log(`\n🌤️  Seasonal Performance:`);
    const seasons = ['PEAK', 'SHOULDER', 'LOW'];
    seasons.forEach(season => {
      const revenue = data.revenueBySeason[season];
      const nights = data.nightsBySeason[season];
      if (nights > 0) {
        const adr = revenue / nights;
        console.log(`   ${season.padEnd(10)}: $${adr.toFixed(0)} ADR | ${nights} nights | $${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} total`);
      }
    });

    // Best months
    const monthEntries = Object.entries(data.revenueByMonth)
      .map(([month, stats]) => ({
        month,
        revenue: stats.revenue,
        nights: stats.nights,
        adr: stats.revenue / stats.nights
      }))
      .sort((a, b) => b.revenue - a.revenue);

    if (monthEntries.length > 0) {
      console.log(`\n🏆 Top 5 Revenue Months:`);
      monthEntries.slice(0, 5).forEach((entry, idx) => {
        console.log(`   ${idx + 1}. ${entry.month}: $${entry.revenue.toFixed(0)} (${entry.nights} nights, $${entry.adr.toFixed(0)} ADR)`);
      });

      console.log(`\n⚠️  Lowest 3 Revenue Months:`);
      monthEntries.slice(-3).reverse().forEach((entry, idx) => {
        console.log(`   ${idx + 1}. ${entry.month}: $${entry.revenue.toFixed(0)} (${entry.nights} nights, $${entry.adr.toFixed(0)} ADR)`);
      });
    }

    // Review ratings by category
    console.log(`\n⭐ Review Ratings by Category:`);
    const categories = ['overall', 'cleanliness', 'communication', 'location', 'value'];
    categories.forEach(category => {
      const ratings = data.ratingsByCategory[category];
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        console.log(`   ${category.charAt(0).toUpperCase() + category.slice(1).padEnd(14)}: ${avg.toFixed(2)}`);
      }
    });

    console.log('');
    console.log('-'.repeat(70));
    console.log('');

    // Store in baseline report object
    baselineReport[propertyName] = {
      totalRevenue: data.totalRevenue,
      totalBookings: data.totalBookings,
      totalNights: data.totalNights,
      avgADR: parseFloat(avgADR.toFixed(2)),
      avgStayLength: parseFloat(avgStayLength.toFixed(1)),
      avgRating: parseFloat(avgRating.toFixed(2)),
      reviewCount: data.ratingsByCategory.overall.length,
      yearlyData: years.map(year => ({
        year: parseInt(year),
        revenue: data.revenueByYear[year],
        bookings: data.bookingsByYear[year],
        nights: data.nightsByYear[year],
        adr: parseFloat((data.revenueByYear[year] / data.nightsByYear[year]).toFixed(2))
      })),
      seasonalData: seasons.map(season => ({
        season,
        revenue: data.revenueBySeason[season],
        nights: data.nightsBySeason[season],
        adr: data.nightsBySeason[season] > 0
          ? parseFloat((data.revenueBySeason[season] / data.nightsBySeason[season]).toFixed(2))
          : 0
      })),
      topMonths: monthEntries.slice(0, 5),
      categoryRatings: {
        overall: data.ratingsByCategory.overall.length > 0
          ? parseFloat((data.ratingsByCategory.overall.reduce((a, b) => a + b, 0) / data.ratingsByCategory.overall.length).toFixed(2))
          : 0,
        cleanliness: data.ratingsByCategory.cleanliness.length > 0
          ? parseFloat((data.ratingsByCategory.cleanliness.reduce((a, b) => a + b, 0) / data.ratingsByCategory.cleanliness.length).toFixed(2))
          : 0,
        communication: data.ratingsByCategory.communication.length > 0
          ? parseFloat((data.ratingsByCategory.communication.reduce((a, b) => a + b, 0) / data.ratingsByCategory.communication.length).toFixed(2))
          : 0,
        location: data.ratingsByCategory.location.length > 0
          ? parseFloat((data.ratingsByCategory.location.reduce((a, b) => a + b, 0) / data.ratingsByCategory.location.length).toFixed(2))
          : 0,
        value: data.ratingsByCategory.value.length > 0
          ? parseFloat((data.ratingsByCategory.value.reduce((a, b) => a + b, 0) / data.ratingsByCategory.value.length).toFixed(2))
          : 0
      }
    };
  }

  // Portfolio-level insights
  console.log('🎯 PORTFOLIO-LEVEL INSIGHTS');
  console.log('='.repeat(70));

  const portfolioStats = Object.values(baselineReport).filter(p => p.totalRevenue > 0);
  if (portfolioStats.length > 0) {
    const avgPortfolioADR = portfolioStats.reduce((sum, p) => sum + p.avgADR, 0) / portfolioStats.length;
    const avgPortfolioRating = portfolioStats.reduce((sum, p) => sum + p.avgRating, 0) / portfolioStats.length;
    const totalPortfolioRevenue = portfolioStats.reduce((sum, p) => sum + p.totalRevenue, 0);

    console.log(`\n📊 Average Portfolio ADR: $${avgPortfolioADR.toFixed(2)}`);
    console.log(`⭐ Average Portfolio Rating: ${avgPortfolioRating.toFixed(2)}`);
    console.log(`💰 Total Historical Revenue: $${totalPortfolioRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);

    console.log(`\n🎯 Rebrand Opportunity Analysis:`);
    console.log(`   Current Portfolio ADR: $${avgPortfolioADR.toFixed(0)}`);
    console.log(`   Competitive Premium ADR Target: $265`);

    const upliftDollar = 265 - avgPortfolioADR;
    const upliftPct = ((upliftDollar / avgPortfolioADR) * 100).toFixed(1);

    console.log(`   Potential Uplift: +$${upliftDollar.toFixed(0)}/night (+${upliftPct}%)`);
    console.log(`   Annual Revenue Impact (at 70% occupancy):`);

    const annualNights = 365 * 0.7 * portfolioStats.length;
    const additionalRevenue = upliftDollar * annualNights;
    console.log(`   → Additional $${additionalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} per year`);
  }

  console.log('');
  console.log('='.repeat(70));

  // Save to JSON
  const outputPath = '/Users/etuan/Desktop/Airbnb/indigopalm/baseline-metrics.json';
  const outputData = {
    generatedAt: new Date().toISOString(),
    properties: baselineReport,
    portfolioSummary: {
      avgADR: portfolioStats.reduce((sum, p) => sum + p.avgADR, 0) / portfolioStats.length,
      avgRating: portfolioStats.reduce((sum, p) => sum + p.avgRating, 0) / portfolioStats.length,
      totalRevenue: portfolioStats.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalBookings: portfolioStats.reduce((sum, p) => sum + p.totalBookings, 0),
      propertiesAnalyzed: portfolioStats.length
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n✅ Baseline metrics saved to: ${outputPath}`);
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
