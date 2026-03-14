// Generate reviews report for dashboard
import fs from 'fs';

const reviewsPath = '/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/reviews.json';
const listingsPath = '/Users/etuan/Desktop/Airbnb/Airbnb_data_request_10Jan2026_GMT/json/listings.json';

console.log('📊 Generating Reviews Report for Dashboard...\n');

try {
  const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
  const listingsData = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));

  // Map listings
  const listingMap = {};
  listingsData.forEach(listing => {
    if (listing.listing) {
      const address = listing.listing.publicAddress || listing.listing.name || '';
      let propertyName = 'Unknown';

      if (address.includes('Cochran')) propertyName = 'Cozy Cactus';
      else if (address.includes('Villa')) propertyName = 'Casa Moto';
      else if (address.includes('Indian')) propertyName = 'PS Retreat';
      else if (address.includes('Wells')) propertyName = 'The Well';

      listingMap[listing.listing.id] = {
        name: propertyName,
        address: listing.listing.publicAddress || ''
      };
    }
  });

  // Process reviews
  const reviewsByProperty = {};
  const themesByProperty = {};

  reviewsData.forEach(reviewGroup => {
    if (reviewGroup.reviewsReceived) {
      reviewGroup.reviewsReceived.forEach(reviewItem => {
        const review = reviewItem.review;
        if (!review || !review.hasSubmitted) return;

        const propertyId = review.bookableId || review.entityId;
        const property = listingMap[propertyId] || { name: 'Cozy Cactus', address: '' };
        const propertyName = property.name;

        if (!reviewsByProperty[propertyName]) {
          reviewsByProperty[propertyName] = [];
          themesByProperty[propertyName] = {
            positive: {},
            negative: {},
            categoryAverages: {
              VALUE: [],
              CHECKIN: [],
              LOCATION: [],
              COMMUNICATION: [],
              CLEANLINESS: [],
              ACCURACY: []
            }
          };
        }

        // Extract category ratings
        const categoryRatings = {};
        if (reviewItem.reviewCategoryRatings) {
          reviewItem.reviewCategoryRatings.forEach(cat => {
            categoryRatings[cat.ratingCategory] = cat.ratingV2;
            if (themesByProperty[propertyName].categoryAverages[cat.ratingCategory]) {
              themesByProperty[propertyName].categoryAverages[cat.ratingCategory].push(cat.ratingV2);
            }
          });
        }

        const reviewDate = new Date(review.submittedAt || review.createdAt);

        reviewsByProperty[propertyName].push({
          date: reviewDate,
          rating: review.rating,
          comment: review.comment || '',
          privateFeedback: review.privateFeedback || '',
          categoryRatings: categoryRatings
        });

        // Extract themes
        const comment = (review.comment || '').toLowerCase();
        const privateFeedback = (review.privateFeedback || '').toLowerCase();

        // Positive themes
        const positiveKeywords = [
          'clean', 'responsive', 'communication', 'stocked', 'beautiful',
          'comfortable', 'spacious', 'perfect', 'great', 'amazing',
          'love', 'wonderful', 'excellent', 'recommend', 'hot tub',
          'amenities', 'labeled', 'easy'
        ];

        positiveKeywords.forEach(keyword => {
          if (comment.includes(keyword)) {
            themesByProperty[propertyName].positive[keyword] =
              (themesByProperty[propertyName].positive[keyword] || 0) + 1;
          }
        });

        // Negative themes from private feedback
        const negativeKeywords = [
          'issue', 'problem', 'broken', 'difficult', 'dirty', 'needs',
          'improvement', 'fix', 'repair', 'replace', 'missing'
        ];

        negativeKeywords.forEach(keyword => {
          if (privateFeedback.includes(keyword)) {
            themesByProperty[propertyName].negative[keyword] =
              (themesByProperty[propertyName].negative[keyword] || 0) + 1;
          }
        });
      });
    }
  });

  // Calculate statistics
  const stats = {};
  for (const [propertyName, reviews] of Object.entries(reviewsByProperty)) {
    reviews.sort((a, b) => b.date - a.date);

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Calculate category averages
    const categoryAvgs = {};
    for (const [cat, ratings] of Object.entries(themesByProperty[propertyName].categoryAverages)) {
      if (ratings.length > 0) {
        categoryAvgs[cat] = (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2);
      }
    }

    // Top positive themes
    const topPositive = Object.entries(themesByProperty[propertyName].positive)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Top issues
    const topNegative = Object.entries(themesByProperty[propertyName].negative)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    stats[propertyName] = {
      totalReviews: reviews.length,
      avgRating: avgRating.toFixed(2),
      categoryAvgs,
      topPositive,
      topNegative,
      recentReviews: reviews.slice(0, 10)
    };
  }

  // Generate JSON for dashboard
  const outputData = {
    reviewsByProperty,
    themesByProperty,
    stats,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    '/Users/etuan/Desktop/Airbnb/desert-edit-deploy/reviews-data.json',
    JSON.stringify(outputData, null, 2)
  );

  console.log('✅ Reviews report generated!');
  console.log('\n📊 Summary:');
  for (const [propertyName, stat] of Object.entries(stats)) {
    console.log('\n' + propertyName + ':');
    console.log('  Total Reviews: ' + stat.totalReviews);
    console.log('  Average Rating: ' + stat.avgRating + ' ⭐');
    console.log('  Top Themes: ' + stat.topPositive.slice(0, 5).map(t => t[0]).join(', '));
  }

  console.log('\n📄 Data saved to: reviews-data.json');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
