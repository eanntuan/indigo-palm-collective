// Desert Edit Dashboard - Main JavaScript
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, query, where, orderBy, limit, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { parseAirbnbPayments, parseAirbnbGuests } from './csv-parsers/airbnb-parser.js';
import { parseBankCSV } from './csv-parsers/bank-parser.js';

// Global state
let currentProperty = 'cochran'; // Focus on Cozy Cactus only for now
let revenueData = [];
let expenseData = [];
let revenueChart = null;
let expenseChart = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌵 Initializing Desert Edit Dashboard...');

  // Setup file upload listeners
  setupFileUploads();

  // Setup hero carousel
  setupHeroCarousel();

  // Load existing data from Firebase
  await loadDashboardData();

  console.log('✅ Dashboard ready!');
});

// Setup File Upload Handlers
function setupFileUploads() {
  // Airbnb upload
  document.getElementById('airbnb-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();
    const status = document.getElementById('airbnb-status');
    status.textContent = 'Processing...';

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const payments = parseAirbnbPayments(data);

      // Save to Firebase
      for (const payment of payments) {
        await addDoc(collection(db, 'revenue'), {
          ...payment,
          propertyId: 'cochran', // Default to Cozy Cactus for now
          importDate: new Date()
        });
      }

      status.textContent = `✅ Imported ${payments.length} payments!`;
      status.className = 'upload-status success';

      // Reload dashboard
      await loadDashboardData();

    } catch (error) {
      console.error('Error uploading Airbnb data:', error);
      status.textContent = '❌ Error: ' + error.message;
      status.className = 'upload-status error';
    } finally {
      hideLoading();
    }
  });

  // Bank CSV upload
  document.getElementById('bank-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();
    const status = document.getElementById('bank-status');
    status.textContent = 'Processing...';

    try {
      const text = await file.text();
      const expenses = parseBankCSV(text);

      // Save to Firebase
      for (const expense of expenses) {
        await addDoc(collection(db, 'expenses'), {
          ...expense,
          propertyId: 'cochran', // Default
          importDate: new Date()
        });
      }

      status.textContent = `✅ Imported ${expenses.length} expenses!`;
      status.className = 'upload-status success';

      // Reload dashboard
      await loadDashboardData();

    } catch (error) {
      console.error('Error uploading bank data:', error);
      status.textContent = '❌ Error: ' + error.message;
      status.className = 'upload-status error';
    } finally {
      hideLoading();
    }
  });
}

// Load Dashboard Data from Firebase
async function loadDashboardData() {
  showLoading();

  try {
    // Load revenue - filter for Cozy Cactus only
    const revenueQuery = query(collection(db, 'revenue'), where('propertyId', '==', 'cochran'));
    const revenueSnap = await getDocs(revenueQuery);
    revenueData = [];
    revenueSnap.forEach(doc => {
      const data = doc.data();
      // Convert Firestore timestamp to Date
      if (data.date && data.date.toDate) {
        data.date = data.date.toDate();
      }
      revenueData.push(data);
    });

    // Load expenses - filter for Cozy Cactus only
    const expenseQuery = query(collection(db, 'expenses'), where('propertyId', '==', 'cochran'));
    const expenseSnap = await getDocs(expenseQuery);
    expenseData = [];
    expenseSnap.forEach(doc => {
      const data = doc.data();
      // Convert Firestore timestamp to Date
      if (data.date && data.date.toDate) {
        data.date = data.date.toDate();
      }
      expenseData.push(data);
    });

    console.log(`Loaded ${revenueData.length} revenue records, ${expenseData.length} expense records (Cozy Cactus only)`);

    // Update all dashboard sections
    updateQuickAnswers();
    updateYearOverYear();
    updatePropertyCards();
    updateCharts();
    updateMonthlyComparison();
    updateExpenseBarChart();
    updateQuickStats();

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    alert('Error loading data: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Update Quick Answer Cards
function updateQuickAnswers() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter data for current month
  const monthRevenue = revenueData.filter(r => {
    return r.date.getFullYear() === currentYear && r.date.getMonth() === currentMonth;
  });

  const monthExpenses = expenseData.filter(e => {
    return e.date.getFullYear() === currentYear && e.date.getMonth() === currentMonth;
  });

  // Calculate monthly totals
  const monthlyIncome = monthRevenue.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
  const monthlyExpensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate YTD totals
  const ytdRevenue = revenueData.filter(r => r.date.getFullYear() === currentYear);
  const ytdExpenses = expenseData.filter(e => e.date.getFullYear() === currentYear);

  const ytdIncome = ytdRevenue.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
  const ytdExpensesTotal = ytdExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate utilities average
  const utilities = expenseData.filter(e => {
    return ['Electric', 'Water', 'Gas', 'Internet'].includes(e.category);
  });
  const utilitiesAvg = utilities.length > 0 ?
    utilities.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, currentMonth + 1) : 0;

  // Calculate one-time costs (non-recurring expenses)
  const oneTimeCosts = monthExpenses.filter(e => {
    return !['Mortgage', 'Electric', 'Water', 'Gas', 'Internet'].includes(e.category);
  });
  const oneTimeTotal = oneTimeCosts.reduce((sum, e) => sum + e.amount, 0);

  // Calculate ROI (simple: (income - expenses) / expenses * 100)
  const roi = ytdExpensesTotal > 0 ? ((ytdIncome - ytdExpensesTotal) / ytdExpensesTotal * 100) : 0;

  // Mortgage balance (from Dec 2025 statement)
  const mortgageBalance = 489000.79;
  const originalMortgage = 550000; // Estimated original loan amount
  const mortgagePercent = ((originalMortgage - mortgageBalance) / originalMortgage * 100);

  // Calculate average gross per month (2025)
  const revenue2025 = revenueData.filter(r => r.date.getFullYear() === 2025);
  const total2025 = revenue2025.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
  const avgGrossMonth = total2025 / 12; // Average across all 12 months

  // Occupancy rate (placeholder - needs booking data)
  const occupancyRate = 65; // TODO: Calculate from booking data when available

  // Average Daily Rate (placeholder - needs booking/nights data)
  const adr = total2025 / 365 * (occupancyRate / 100); // Rough estimate based on revenue and occupancy

  // Update UI
  document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
  document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpensesTotal);
  document.getElementById('ytd-income').textContent = formatCurrency(ytdIncome);
  document.getElementById('ytd-expenses').textContent = formatCurrency(ytdExpensesTotal);
  document.getElementById('utilities-avg').textContent = formatCurrency(utilitiesAvg);
  document.getElementById('one-time-costs').textContent = formatCurrency(oneTimeTotal);
  document.getElementById('roi-percent').textContent = roi.toFixed(1) + '%';
  document.getElementById('mortgage-balance').textContent = formatCurrency(mortgageBalance);

  // Update contexts
  const lastMonthIncome = calculateLastMonthIncome();
  const incomeChange = lastMonthIncome > 0 ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
  document.getElementById('monthly-income-context').textContent =
    incomeChange >= 0 ? `+${incomeChange.toFixed(0)}% vs last month` : `${incomeChange.toFixed(0)}% vs last month`;

  document.getElementById('ytd-expenses-context').textContent =
    `$${(ytdExpensesTotal / Math.max(1, currentMonth + 1)).toLocaleString()} /month average`;

  // Update mortgage progress bar
  document.getElementById('mortgage-progress').style.width = mortgagePercent + '%';
  document.getElementById('mortgage-percent').textContent = mortgagePercent.toFixed(0) + '% paid off';

  // Update new metric cards
  const avgGrossElement = document.getElementById('avg-gross-month');
  if (avgGrossElement) {
    avgGrossElement.textContent = formatCurrency(avgGrossMonth);
  }

  const occupancyElement = document.getElementById('occupancy-rate');
  if (occupancyElement) {
    occupancyElement.textContent = occupancyRate.toFixed(0) + '%';
  }

  const adrElement = document.getElementById('adr');
  if (adrElement) {
    adrElement.textContent = formatCurrency(adr);
  }

  // Update revenue goal progress
  const revenueGoal = 15000;
  const revenueProgress = (monthlyIncome / revenueGoal * 100);
  document.getElementById('revenue-goal-progress').style.width = Math.min(100, revenueProgress) + '%';
  document.getElementById('revenue-goal-label').textContent =
    `${formatCurrency(monthlyIncome)} / ${formatCurrency(revenueGoal)}`;

  // Update expense budget progress
  const expenseBudget = 8000;
  const expenseProgress = (monthlyExpensesTotal / expenseBudget * 100);
  document.getElementById('expense-budget-progress').style.width = Math.min(100, expenseProgress) + '%';
  document.getElementById('expense-budget-label').textContent =
    `${formatCurrency(monthlyExpensesTotal)} / ${formatCurrency(expenseBudget)}`;
  document.getElementById('expense-budget-label').className =
    'progress-label' + (expenseProgress > 90 ? ' warning' : '');
}

// Calculate last month's income
function calculateLastMonthIncome() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const lastMonthRevenue = revenueData.filter(r => {
    return r.date.getFullYear() === lastMonth.getFullYear() &&
           r.date.getMonth() === lastMonth.getMonth();
  });

  return lastMonthRevenue.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
}

// Update Year-over-Year Comparison
function updateYearOverYear() {
  const years = [2023, 2024, 2025];
  const yearData = {};

  // Calculate total revenue for each year (YoY gross includes all sources)
  years.forEach(year => {
    const yearRevenue = revenueData.filter(r => r.date.getFullYear() === year);
    const total = yearRevenue.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
    yearData[year] = total;
  });

  // Update UI for each year
  years.forEach((year, index) => {
    const total = yearData[year];

    // Update amounts
    const amountElement = document.getElementById(`yoy-${year}`);
    if (amountElement) {
      amountElement.textContent = formatCurrency(total);
    }

    // Calculate year-over-year change
    const changeElement = document.getElementById(`yoy-${year}-change`);
    if (!changeElement) return;

    if (index > 0) {
      const previousYear = years[index - 1];
      const previousTotal = yearData[previousYear];
      const change = ((total - previousTotal) / previousTotal) * 100;

      if (change > 0) {
        changeElement.textContent = `↑ ${change.toFixed(1)}% vs ${previousYear}`;
        changeElement.className = 'yoy-change positive';
      } else {
        changeElement.textContent = `↓ ${Math.abs(change).toFixed(1)}% vs ${previousYear}`;
        changeElement.className = 'yoy-change negative';
      }
    } else {
      // First year - show as baseline
      changeElement.textContent = '🏆 Best Year';
      changeElement.className = 'yoy-change positive';
    }
  });
}

// Update Property Cards
function updatePropertyCards() {
  // Calculate revenue for Cozy Cactus only
  let totalRevenue = 0;

  revenueData.forEach(r => {
    totalRevenue += (r.amount || r.netIncome || 0);
  });

  // Calculate average per month
  const monthsOfData = 12; // TODO: calculate actual months

  // Only update Cozy Cactus card (other properties removed)
  const cochranElement = document.getElementById('cochran-revenue');
  if (cochranElement) {
    cochranElement.textContent = formatCurrency(totalRevenue / monthsOfData) + '/month';
  }
}

// Update Charts
function updateCharts() {
  updateRevenueChart();
  updateExpenseChart();
}

// Update Revenue Trend Chart
function updateRevenueChart() {
  const ctx = document.getElementById('revenue-chart');
  if (!ctx) return;

  // Calculate last 12 months
  const months = [];
  const revenueByMonth = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

    const monthRevenue = revenueData.filter(r => {
      return r.date.getFullYear() === date.getFullYear() &&
             r.date.getMonth() === date.getMonth();
    });

    const total = monthRevenue.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
    revenueByMonth.push(total);
  }

  // Destroy existing chart
  if (revenueChart) {
    revenueChart.destroy();
  }

  // Create new chart
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue',
        data: revenueByMonth,
        borderColor: '#738561',
        backgroundColor: 'rgba(115, 133, 97, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Update Expense Breakdown Chart
function updateExpenseChart() {
  const ctx = document.getElementById('expense-chart');
  if (!ctx) return;

  // Aggregate expenses by category
  const categoryTotals = {};
  expenseData.forEach(e => {
    const category = e.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + e.amount;
  });

  const categories = Object.keys(categoryTotals);
  const totals = Object.values(categoryTotals);

  // Destroy existing chart
  if (expenseChart) {
    expenseChart.destroy();
  }

  // Create new chart
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: totals,
        backgroundColor: [
          '#738561', '#d2635b', '#00877b', '#9c8b77',
          '#e8a598', '#4da6a0', '#c5c3ba', '#f5f3ee'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// Update Expense Bar Chart (by category)
let expenseBarChart = null;

function updateExpenseBarChart() {
  const ctx = document.getElementById('expense-bar-chart');
  if (!ctx) return;

  // Aggregate YTD expenses by category
  const now = new Date();
  const currentYear = now.getFullYear();
  const ytdExpenses = expenseData.filter(e => e.date.getFullYear() === currentYear);

  const categoryTotals = {};
  ytdExpenses.forEach(e => {
    const category = e.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + e.amount;
  });

  // Sort categories by total amount (descending)
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  const categories = Object.keys(sortedCategories);
  const totals = Object.values(sortedCategories);

  // Destroy existing chart
  if (expenseBarChart) {
    expenseBarChart.destroy();
  }

  // Create horizontal bar chart
  expenseBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'YTD Expenses',
        data: totals,
        backgroundColor: '#738561',
        borderColor: '#5a6b4d',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // Makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.x);
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Update Monthly Comparison Chart
let monthlyComparisonChart = null;

function updateMonthlyComparison() {
  const ctx = document.getElementById('monthly-comparison-chart');
  if (!ctx) {
    console.error('Monthly comparison chart canvas not found');
    return;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2023, 2024, 2025];

  // Initialize data structure for each year
  const yearlyData = {};
  years.forEach(year => {
    yearlyData[year] = Array(12).fill(0); // Initialize with 0 for each month
  });

  // Aggregate revenue by year and month
  revenueData.forEach(r => {
    const year = r.date.getFullYear();
    const month = r.date.getMonth(); // 0-11

    if (years.includes(year)) {
      yearlyData[year][month] += (r.amount || r.netIncome || 0);
    }
  });

  // If no data, show sample data as placeholder
  const hasData = Object.values(yearlyData).some(yearData => yearData.some(val => val > 0));
  if (!hasData) {
    console.log('No revenue data yet - showing sample data');
    // Sample data for demonstration
    yearlyData[2024] = [5200, 6100, 7300, 8200, 9100, 8500, 7800, 8900, 7600, 6800, 5900, 6400];
    yearlyData[2025] = [6800, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  // Destroy existing chart
  if (monthlyComparisonChart) {
    monthlyComparisonChart.destroy();
  }

  // Create grouped bar chart
  monthlyComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: '2023',
          data: yearlyData[2023],
          backgroundColor: 'rgba(255, 215, 0, 0.8)',
          borderColor: '#ffd700',
          borderWidth: 2
        },
        {
          label: '2024',
          data: yearlyData[2024],
          backgroundColor: 'rgba(0, 135, 123, 0.8)',
          borderColor: '#00877b',
          borderWidth: 2
        },
        {
          label: '2025',
          data: yearlyData[2025],
          backgroundColor: 'rgba(115, 133, 97, 0.8)',
          borderColor: '#738561',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += '$' + context.parsed.y.toLocaleString();
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            },
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
}

// Update Quick Stats
function updateQuickStats() {
  // Last updated
  document.getElementById('last-updated').textContent = new Date().toLocaleDateString();

  // Total records
  document.getElementById('total-records').textContent =
    (revenueData.length + expenseData.length).toLocaleString();

  // Net profit
  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || r.netIncome || 0), 0);
  const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  document.getElementById('net-profit').textContent = formatCurrency(netProfit);
  document.getElementById('net-profit').style.color = netProfit >= 0 ? '#00877b' : '#d2635b';
}

// Property Selection
window.selectProperty = function(propertyId, element) {
  currentProperty = propertyId;

  // Update active state
  document.querySelectorAll('.property-card').forEach(card => {
    card.classList.remove('active');
  });
  element.classList.add('active');

  // Reload data with filter
  // TODO: Implement property filtering
  console.log('Selected property:', propertyId);
};

// Hero Carousel
let currentSlide = 0;
const slides = [
  "linear-gradient(rgba(115, 133, 97, 0.4), rgba(115, 133, 97, 0.6)), url('Cozy%20Cactus/82381%20Cochran%20Drive%20For%20Web/1TW_DZ5A8774web.jpg')",
  "linear-gradient(rgba(210, 99, 91, 0.4), rgba(210, 99, 91, 0.6)), url('Casa%20Moto/IMG_1268.JPG')",
  "linear-gradient(rgba(0, 135, 123, 0.4), rgba(0, 135, 123, 0.6)), url('The%20Well/1TW_4W6A0294.jpg')"
];

function setupHeroCarousel() {
  // Auto-rotate slides every 5 seconds
  setInterval(() => {
    nextSlide();
  }, 5000);
}

window.nextSlide = function() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateHeroSlide();
};

window.prevSlide = function() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateHeroSlide();
};

function updateHeroSlide() {
  const heroSlide = document.querySelector('.hero-slide');
  heroSlide.style.backgroundImage = slides[currentSlide];
}

// Utility Functions
function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString();
}

function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// Export for use in HTML
window.selectProperty = selectProperty;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
// QuickBooks Integration Functions
// Add these to dashboard-script.js

/**
 * Show/hide settings section
 */
window.showSettings = function() {
  const settingsSection = document.getElementById('settings-section');
  const allSections = document.querySelectorAll('section:not(#settings-section)');

  // Toggle visibility
  const isVisible = settingsSection.style.display !== 'none';

  if (isVisible) {
    // Hide settings, show dashboard
    settingsSection.style.display = 'none';
    allSections.forEach(section => section.style.display = 'block');
  } else {
    // Show settings, hide dashboard
    settingsSection.style.display = 'block';
    allSections.forEach(section => {
      if (!section.classList.contains('hero-section') && section.id !== 'settings-section') {
        section.style.display = 'none';
      }
    });

    // Load QB status
    checkQuickBooksStatus();
  }
};

/**
 * Check QuickBooks connection status
 */
async function checkQuickBooksStatus() {
  try {
    const qbDoc = await getDoc(doc(db, 'settings', 'quickbooks'));

    if (qbDoc.exists()) {
      const qbData = qbDoc.data();

      // Update UI to show connected state
      document.getElementById('qb-status-badge').textContent = 'Connected';
      document.getElementById('qb-status-badge').className = 'status-badge connected';

      document.getElementById('qb-connect-btn').style.display = 'none';
      document.getElementById('qb-sync-btn').style.display = 'inline-block';
      document.getElementById('qb-disconnect-btn').style.display = 'inline-block';

      document.getElementById('qb-connected-info').style.display = 'block';

      // Show last sync info
      if (qbData.lastSync) {
        const lastSyncDate = qbData.lastSync.toDate();
        document.getElementById('qb-last-sync').textContent = lastSyncDate.toLocaleString();
      }

      // Show sync results
      if (qbData.lastSyncResults) {
        const results = qbData.lastSyncResults;
        const expenseCount = results.expenses || 0;
        const revenueCount = results.revenue || 0;
        const accountCount = results.bankAccounts || 0;

        document.getElementById('qb-sync-results').innerHTML = `
          <div>✓ ${expenseCount} expenses</div>
          <div>✓ ${revenueCount} revenue transactions</div>
          <div>✓ ${accountCount} bank accounts</div>
        `;
      }

    } else {
      // Not connected
      document.getElementById('qb-status-badge').textContent = 'Not Connected';
      document.getElementById('qb-status-badge').className = 'status-badge disconnected';

      document.getElementById('qb-connect-btn').style.display = 'inline-block';
      document.getElementById('qb-sync-btn').style.display = 'none';
      document.getElementById('qb-disconnect-btn').style.display = 'none';
      document.getElementById('qb-connected-info').style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking QB status:', error);
  }
}

/**
 * Connect to QuickBooks
 */
window.connectQuickBooks = function() {
  // Redirect to QuickBooks OAuth
  window.location.href = '/quickbooks-auth';
};

/**
 * Sync QuickBooks data
 */
window.syncQuickBooks = async function() {
  const progressDiv = document.getElementById('qb-sync-progress');
  const progressFill = document.getElementById('qb-progress-fill');
  const progressText = document.getElementById('qb-progress-text');
  const syncBtn = document.getElementById('qb-sync-btn');

  try {
    // Show progress
    progressDiv.style.display = 'block';
    syncBtn.disabled = true;
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting sync...';

    // Call sync function
    const response = await fetch('/quickbooks-sync', {
      method: 'POST'
    });

    progressFill.style.width = '50%';
    progressText.textContent = 'Syncing data...';

    const result = await response.json();

    if (result.success) {
      progressFill.style.width = '100%';

      const expenseCount = result.results.expenses;
      const revenueCount = result.results.revenue;
      const accountCount = result.results.bankAccounts;

      progressText.textContent = `✓ Synced ${expenseCount} expenses, ${revenueCount} revenue, ${accountCount} accounts`;

      // Reload dashboard data
      setTimeout(() => {
        progressDiv.style.display = 'none';
        loadDashboard();
        checkQuickBooksStatus();
      }, 2000);

      alert('QuickBooks sync complete! Your dashboard has been updated.');
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('Sync error:', error);
    progressDiv.style.display = 'none';
    alert('Failed to sync QuickBooks: ' + error.message);
  } finally {
    syncBtn.disabled = false;
  }
};

/**
 * Disconnect QuickBooks
 */
window.disconnectQuickBooks = async function() {
  if (!confirm('Are you sure you want to disconnect QuickBooks? Your synced data will not be deleted.')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'settings', 'quickbooks'));
    alert('QuickBooks disconnected successfully.');
    checkQuickBooksStatus();
  } catch (error) {
    console.error('Disconnect error:', error);
    alert('Failed to disconnect: ' + error.message);
  }
};

/**
 * Export dashboard data
 */
window.exportDashboardData = async function() {
  try {
    showLoading();

    // Fetch all data
    const revenue = await getDocs(collection(db, 'revenue'));
    const expenses = await getDocs(collection(db, 'expenses'));
    const bankAccounts = await getDocs(collection(db, 'bankAccounts'));

    const exportData = {
      revenue: revenue.docs.map(doc => doc.id, ...doc.data()),
      expenses: expenses.docs.map(doc => doc.id, ...doc.data()),
      bankAccounts: bankAccounts.docs.map(doc => doc.id, ...doc.data()),
      exportedAt: new Date().toISOString()
    };

    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desert-edit-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    hideLoading();
    alert('Data exported successfully!');

  } catch (error) {
    hideLoading();
    console.error('Export error:', error);
    alert('Failed to export data: ' + error.message);
  }
};

/**
 * Clear old data
 */
window.clearOldData = async function() {
  if (!confirm('This will delete all data older than 3 years. Are you sure?')) {
    return;
  }

  try {
    showLoading();

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    // Delete old revenue
    const oldRevenue = await getDocs(
      query(collection(db, 'revenue'), where('date', '<', Timestamp.fromDate(threeYearsAgo)))
    );
    oldRevenue.forEach(async (doc) => await deleteDoc(doc.ref));

    // Delete old expenses
    const oldExpenses = await getDocs(
      query(collection(db, 'expenses'), where('date', '<', Timestamp.fromDate(threeYearsAgo)))
    );
    oldExpenses.forEach(async (doc) => await deleteDoc(doc.ref));

    hideLoading();
    alert(`Deleted ${oldRevenue.size + oldExpenses.size} old records.`);
    loadDashboard();

  } catch (error) {
    hideLoading();
    console.error('Delete error:', error);
    alert('Failed to clear old data: ' + error.message);
  }
};

// Check for QB connection callback
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('qb_connected') === 'true') {
    alert('QuickBooks connected successfully! Click "Sync Now" to import your data.');
    showSettings();
  } else if (urlParams.get('qb_error')) {
    alert('QuickBooks connection failed: ' + urlParams.get('qb_error'));
  }
});

