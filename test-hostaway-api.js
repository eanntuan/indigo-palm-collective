/**
 * Hostaway API Test Script
 * Tests API credentials and fetches pricing data
 */

const HOSTAWAY_API_KEY = '9bfe8a6fa09359d8e4cbcd932f160841c6b97e7361547c771dbc33ab251be94e';
const HOSTAWAY_ACCOUNT_ID = '45747';

// Property IDs
const COZY_CACTUS_ID = 123646;
const CASA_MOTO_ID = 123633;

// Test dates (Feb 20-22, 2026)
const CHECK_IN = '2026-02-20';
const CHECK_OUT = '2026-02-22';

/**
 * Test 1: Fetch listing details
 */
async function testListingDetails(listingId, name) {
  console.log(`\n🔍 Testing ${name} (ID: ${listingId})...`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(
      `https://api.hostaway.com/v1/listings/${listingId}`,
      {
        headers: {
          'Authorization': `Bearer ${HOSTAWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return null;
    }

    const data = await response.json();
    console.log('✅ Listing details fetched successfully!');
    console.log('\nListing Info:');
    console.log(`- Name: ${data.result?.name || 'N/A'}`);
    console.log(`- City: ${data.result?.city || 'N/A'}`);
    console.log(`- Base Price: $${data.result?.basePrice || 'N/A'}`);
    console.log(`- Currency: ${data.result?.currency || 'N/A'}`);
    console.log(`- Max Guests: ${data.result?.maxGuests || 'N/A'}`);
    console.log(`- Min Nights: ${data.result?.minNights || 'N/A'}`);

    return data.result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 2: Fetch pricing for specific dates
 */
async function testPricing(listingId, name) {
  console.log(`\n💰 Testing Pricing for ${name} (${CHECK_IN} to ${CHECK_OUT})...`);
  console.log('='.repeat(60));

  try {
    // Hostaway calendar endpoint to get rates
    const response = await fetch(
      `https://api.hostaway.com/v1/listings/${listingId}/calendar?startDate=${CHECK_IN}&endDate=${CHECK_OUT}`,
      {
        headers: {
          'Authorization': `Bearer ${HOSTAWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return null;
    }

    const data = await response.json();
    console.log('✅ Pricing data fetched successfully!');

    if (data.result && Array.isArray(data.result)) {
      console.log('\nDaily Rates (PriceLabs Dynamic Pricing):');
      data.result.forEach(day => {
        console.log(`- ${day.date}: $${day.price} ${day.isAvailable ? '✓ Available' : '✗ Blocked'}`);
      });

      // Calculate total
      const availableDays = data.result.filter(d => d.isAvailable);
      const total = availableDays.reduce((sum, day) => sum + parseFloat(day.price || 0), 0);
      console.log(`\n📊 Total for ${availableDays.length} nights: $${total.toFixed(2)}`);
    }

    return data.result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 3: Check API permissions
 */
async function testAPIPermissions() {
  console.log('\n🔐 Testing API Permissions...');
  console.log('='.repeat(60));

  try {
    // Try to fetch account info to see what we can access
    const response = await fetch(
      'https://api.hostaway.com/v1/listings',
      {
        headers: {
          'Authorization': `Bearer ${HOSTAWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ API key has read access to listings');
    console.log(`\n📋 Found ${data.result?.length || 0} properties accessible with this API key`);

    if (data.result && Array.isArray(data.result)) {
      console.log('\nAccessible Properties:');
      data.result.forEach(listing => {
        console.log(`- ${listing.name} (ID: ${listing.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 HOSTAWAY API TEST');
  console.log('='.repeat(60));
  console.log('Account ID:', HOSTAWAY_ACCOUNT_ID);
  console.log('API Key:', HOSTAWAY_API_KEY.substring(0, 20) + '...');
  console.log('Test Dates:', CHECK_IN, 'to', CHECK_OUT);

  // Test API permissions first
  await testAPIPermissions();

  // Test Cozy Cactus
  await testListingDetails(COZY_CACTUS_ID, 'Cozy Cactus');
  await testPricing(COZY_CACTUS_ID, 'Cozy Cactus');

  // Test Casa Moto
  await testListingDetails(CASA_MOTO_ID, 'Casa Moto');
  await testPricing(CASA_MOTO_ID, 'Casa Moto');

  console.log('\n\n✨ Tests Complete!');
  console.log('='.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. If pricing shows dynamic rates → PriceLabs integration works! ✓');
  console.log('2. If pricing shows same rate every day → May need to check PriceLabs connection');
  console.log('3. If tests fail → API key might need regeneration from PM');
}

// Run the tests
runTests().catch(console.error);
