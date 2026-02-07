#!/bin/bash

# 🚀 Indigo Palm Collective Deployment Script
# Run this after purchasing indigopalm.co domain

echo "🌴 Deploying Indigo Palm Collective to indigopalm.co"
echo "✅ Domain purchased through Cloudflare"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null
then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

echo "✅ Netlify CLI ready"
echo ""

# Link site
echo "🔗 Linking to Netlify..."
netlify link

echo ""
echo "📦 Deploying to production..."
netlify deploy --prod

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Your site is now live at:"
echo "🌐 https://indigopalm.co"
echo ""
echo "Next steps:"
echo "1. Visit your site and verify everything looks good"
echo "2. Update social media profiles"
echo "3. Update booking platform URLs"
echo "4. Celebrate! 🎉"
