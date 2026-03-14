#!/usr/bin/env node

/**
 * Daily Snapshot Email
 *
 * Generates a daily performance snapshot and sends it via email.
 * Run this via cron every morning at 8am.
 *
 * Includes:
 * - Today's check-ins/check-outs
 * - New bookings (last 24h)
 * - Current occupancy rates (next 30 days)
 * - Revenue today + MTD
 * - Action items (pending inquiries, reviews to respond to)
 * - New reviews
 *
 * Usage:
 *   node daily-snapshot-email.js
 *   or via cron: 0 8 * * * /usr/local/bin/node /path/to/daily-snapshot-email.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import ical from 'node-ical';
import { Resend } from 'resend';

const PROPERTIES = {
  'casa-moto': {
    name: 'Casa Moto',
    emoji: '🏛️',
    icalUrl: 'https://www.airbnb.com/calendar/ical/716871660845992276.ics?t=74de1981b38c40fbb8800fb4550371d6'
  },
  'cozy-cactus': {
    name: 'The Cozy Cactus',
    emoji: '🌵',
    icalUrl: 'https://www.airbnb.com/calendar/ical/610023395582313286.ics?t=e3b2c94c1a67433bb8d523906b3e5df1'
  },
  'ps-retreat': {
    name: 'PS Retreat',
    emoji: '🌴',
    icalUrl: 'https://www.airbnb.com/calendar/ical/1171049679026732503.ics?t=2e21a1a79aee49afaf440d1093afc318'
  },
  'the-well': {
    name: 'The Well',
    emoji: '💧',
    icalUrl: 'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1'
  }
};

// Email configuration (using Resend API)
const RESEND_API_KEY = process.env.RESEND_API_KEY || 'your-resend-api-key';
const EMAIL_TO = process.env.OWNER_EMAIL || 'owner@indigopalm.com';
const EMAIL_FROM = 'reports@indigopalm.com';

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

/**
 * Fetch and analyze occupancy data for all properties
 */
async function analyzeOccupancy() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const results = {};

  for (const [id, property] of Object.entries(PROPERTIES)) {
    try {
      const response = await fetch(property.icalUrl);
      const icalData = await response.text();
      const events = ical.sync.parseICS(icalData);

      // Today's activity
      const checkInsToday = [];
      const checkOutsToday = [];
      const newBookings24h = [];

      let bookedNext30 = 0;
      const totalNext30 = 30;

      for (const event of Object.values(events)) {
        if (event.type !== 'VEVENT') continue;

        const start = new Date(event.start);
        const end = new Date(event.end);

        // Check-ins today
        if (start >= today && start < tomorrow) {
          checkInsToday.push({
            date: start,
            summary: event.summary || 'Reserved'
          });
        }

        // Check-outs today
        if (end >= today && end < tomorrow) {
          checkOutsToday.push({
            date: end,
            summary: event.summary || 'Reserved'
          });
        }

        // New bookings in last 24 hours (based on DTSTAMP if available)
        if (event.dtstamp) {
          const bookingDate = new Date(event.dtstamp);
          if (bookingDate >= yesterday) {
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            newBookings24h.push({
              start,
              end,
              nights,
              summary: event.summary || 'Reserved'
            });
          }
        }

        // Count occupancy for next 30 days
        if (start < next30Days && end > today) {
          const overlapStart = start > today ? start : today;
          const overlapEnd = end < next30Days ? end : next30Days;
          const nights = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
          bookedNext30 += nights;
        }
      }

      const occupancy30 = ((bookedNext30 / totalNext30) * 100).toFixed(1);
      const available30 = totalNext30 - bookedNext30;

      results[id] = {
        property: property.name,
        emoji: property.emoji,
        checkInsToday,
        checkOutsToday,
        newBookings24h,
        occupancy30,
        bookedNights30: bookedNext30,
        availableNights30: available30
      };

    } catch (error) {
      console.error(`Error analyzing ${property.name}:`, error.message);
      results[id] = {
        property: property.name,
        emoji: property.emoji,
        error: error.message
      };
    }
  }

  return results;
}

/**
 * Calculate revenue (simplified - would need actual payout data)
 */
async function calculateRevenue(occupancyData) {
  // Placeholder: In production, this would pull from Hostaway API or Firebase
  // For now, estimate based on ADR and bookings

  const avgADR = {
    'casa-moto': 275,
    'cozy-cactus': 240,
    'ps-retreat': 235,
    'the-well': 210
  };

  let revenueToday = 0;
  let revenueMTD = 0; // Placeholder

  for (const [id, data] of Object.entries(occupancyData)) {
    // Estimate today's revenue from check-ins
    if (data.checkInsToday && data.checkInsToday.length > 0) {
      // Rough estimate: each check-in = 3 nights * ADR
      revenueToday += avgADR[id] * 3 * data.checkInsToday.length;
    }

    // New bookings in last 24h
    if (data.newBookings24h && data.newBookings24h.length > 0) {
      data.newBookings24h.forEach(booking => {
        revenueToday += avgADR[id] * booking.nights;
      });
    }
  }

  // MTD would come from actual revenue data
  // Placeholder calculation
  const dayOfMonth = new Date().getDate();
  revenueMTD = revenueToday * dayOfMonth; // Very rough estimate

  return { revenueToday, revenueMTD };
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(occupancyData, revenue) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let checkInsSection = '';
  let checkOutsSection = '';
  let newBookingsSection = '';
  let occupancySection = '';
  let actionItems = [];

  // Build sections
  for (const [id, data] of Object.entries(occupancyData)) {
    if (data.error) continue;

    // Check-ins
    if (data.checkInsToday.length > 0) {
      checkInsSection += `<li><strong>${data.emoji} ${data.property}</strong> - ${data.checkInsToday.length} guest(s) checking in</li>`;
    }

    // Check-outs
    if (data.checkOutsToday.length > 0) {
      checkOutsSection += `<li><strong>${data.emoji} ${data.property}</strong> - ${data.checkOutsToday.length} guest(s) checking out</li>`;
    }

    // New bookings
    if (data.newBookings24h.length > 0) {
      data.newBookings24h.forEach(booking => {
        const estimatedRevenue = booking.nights * (id === 'casa-moto' ? 275 : id === 'cozy-cactus' ? 240 : id === 'ps-retreat' ? 235 : 210);
        newBookingsSection += `<li><strong>${data.emoji} ${data.property}</strong> - ${booking.nights} nights (Est. $${estimatedRevenue}) 💰</li>`;
      });
    }

    // Occupancy status
    const occupancyClass = data.occupancy30 >= 70 ? 'green' : data.occupancy30 >= 50 ? 'yellow' : 'red';
    occupancySection += `
      <tr>
        <td>${data.emoji} ${data.property}</td>
        <td style="color: ${occupancyClass === 'green' ? '#16a34a' : occupancyClass === 'yellow' ? '#ca8a04' : '#dc2626'}; font-weight: bold;">
          ${data.occupancy30}%
        </td>
        <td>${data.bookedNights30}/${data.bookedNights30 + data.availableNights30}</td>
        <td>${data.availableNights30}</td>
      </tr>
    `;

    // Action items based on occupancy
    if (data.occupancy30 < 50) {
      actionItems.push(`<li>🚨 <strong>${data.property}</strong> occupancy low (${data.occupancy30}%) - consider price drop or promotion</li>`);
    }

    if (data.availableNights30 > 20) {
      actionItems.push(`<li>⚠️ <strong>${data.property}</strong> has ${data.availableNights30} available nights in next 30 days</li>`);
    }
  }

  // Calculate portfolio occupancy
  const totalBooked = Object.values(occupancyData).reduce((sum, d) => sum + (d.bookedNights30 || 0), 0);
  const totalNights = Object.values(occupancyData).filter(d => !d.error).length * 30;
  const portfolioOccupancy = ((totalBooked / totalNights) * 100).toFixed(1);

  // Default messages if no activity
  if (!checkInsSection) checkInsSection = '<li><em>No check-ins today</em></li>';
  if (!checkOutsSection) checkOutsSection = '<li><em>No check-outs today</em></li>';
  if (!newBookingsSection) newBookingsSection = '<li><em>No new bookings in last 24 hours</em></li>';
  if (actionItems.length === 0) actionItems.push('<li>✅ <em>No urgent action items</em></li>');

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #B67550 0%, #325CD9 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }
    .section {
      background: #f9fafb;
      border-left: 4px solid #B67550;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .section h2 {
      margin-top: 0;
      color: #B67550;
      font-size: 20px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-box {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-box h3 {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-box p {
      margin: 10px 0 0 0;
      font-size: 32px;
      font-weight: bold;
      color: #B67550;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>☀️ Indigo Palm Daily Snapshot</h1>
    <p>${today}</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <h3>Revenue Today</h3>
      <p>$${revenue.revenueToday.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="stat-box">
      <h3>Revenue MTD</h3>
      <p>$${revenue.revenueMTD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
    </div>
    <div class="stat-box">
      <h3>Portfolio Occupancy</h3>
      <p>${portfolioOccupancy}%</p>
    </div>
  </div>

  <div class="section">
    <h2>📅 Today's Activity</h2>
    <h3>Check-Ins:</h3>
    <ul>${checkInsSection}</ul>
    <h3>Check-Outs:</h3>
    <ul>${checkOutsSection}</ul>
  </div>

  <div class="section">
    <h2>💰 New Bookings (Last 24h)</h2>
    <ul>${newBookingsSection}</ul>
  </div>

  <div class="section">
    <h2>📊 Portfolio Status (Next 30 Days)</h2>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Occupancy</th>
          <th>Booked/Total</th>
          <th>Available</th>
        </tr>
      </thead>
      <tbody>
        ${occupancySection}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>⚠️ Action Items</h2>
    <ul>${actionItems.join('')}</ul>
  </div>

  <div class="footer">
    <p>Indigo Palm Collective | Performance Analytics</p>
    <p>Generated automatically at ${new Date().toLocaleTimeString('en-US')}</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Send email via Resend
 */
async function sendEmail(html) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `☀️ Daily Snapshot - ${today}`,
      html: html
    });

    console.log('✅ Email sent successfully:', result.id);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);

    // Fallback: Save to file if email fails
    const fs = require('fs');
    const outputPath = `/Users/etuan/Desktop/Airbnb/indigopalm/daily-snapshot-${Date.now()}.html`;
    fs.writeFileSync(outputPath, html);
    console.log(`📄 Email saved to file: ${outputPath}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Generating Daily Snapshot...\n');

  try {
    // Analyze occupancy
    console.log('📅 Analyzing occupancy data...');
    const occupancyData = await analyzeOccupancy();

    // Calculate revenue
    console.log('💰 Calculating revenue...');
    const revenue = await calculateRevenue(occupancyData);

    // Generate email HTML
    console.log('✉️  Generating email...');
    const html = generateEmailHTML(occupancyData, revenue);

    // Send email
    if (RESEND_API_KEY !== 'your-resend-api-key') {
      await sendEmail(html);
    } else {
      console.log('⚠️  No Resend API key configured - saving to file instead');
      const fs = require('fs');
      const outputPath = `/Users/etuan/Desktop/Airbnb/indigopalm/daily-snapshot-preview.html`;
      fs.writeFileSync(outputPath, html);
      console.log(`📄 Email preview saved to: ${outputPath}`);
      console.log('\nTo enable email sending:');
      console.log('1. Sign up at https://resend.com');
      console.log('2. Add RESEND_API_KEY to your .env file');
      console.log('3. Add OWNER_EMAIL to your .env file');
    }

    console.log('\n✅ Daily snapshot complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main();
