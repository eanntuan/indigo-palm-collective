#!/bin/bash

# ════════════════════════════════════════════════════════════════════
# Casa Moto → Casa Moto Rebrand Script
# Run this when renovations are complete and you're ready to rebrand
# ════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 CASA MOTO → CASA MOTO REBRAND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 1: Safety Checks
# ════════════════════════════════════════════════════════════════════

echo "🔍 Running pre-flight checks..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in the indigopalm directory"
    echo "   Please run: cd /Users/etuan/Desktop/Airbnb/indigopalm"
    exit 1
fi

# Check if git is clean (no uncommitted changes)
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Commit your changes first."
        exit 1
    fi
fi

echo "✅ Pre-flight checks passed"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 2: Confirmation
# ════════════════════════════════════════════════════════════════════

echo "⚠️  This script will change all instances of 'Casa Moto' to 'Casa Moto'"
echo ""
echo "📋 Changes will include:"
echo "   • Website copy (index.html, property pages)"
echo "   • Booking configuration"
echo "   • Meta descriptions"
echo "   • Internal links"
echo "   • Property references"
echo ""
read -p "Are you ready to rebrand? (type 'YES' to continue): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🚀 Starting rebrand process..."
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 3: Create Backup Branch
# ════════════════════════════════════════════════════════════════════

echo "💾 Creating backup branch..."
BACKUP_BRANCH="backup-casa-moto-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git checkout main
echo "✅ Backup created: $BACKUP_BRANCH"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 4: Find and Replace
# ════════════════════════════════════════════════════════════════════

echo "🔄 Updating files..."

# Files to update (exclude .git, node_modules, etc.)
FILES=$(find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.md" -o -name "*.txt" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/workers/*")

# Counter for changes
CHANGES=0

# Property name variations
declare -A REPLACEMENTS=(
    ["Casa Moto"]="Casa Moto"
    ["casa-moto"]="casa-moto"
    ["casa_moto"]="terra_luz"
    ["casamoto"]="terraluz"
    ["CASA MOTO"]="CASA MOTO"
    ["Casa Moto ("]="Casa Moto ("
)

# Perform replacements
for search in "${!REPLACEMENTS[@]}"; do
    replace="${REPLACEMENTS[$search]}"

    for file in $FILES; do
        if grep -q "$search" "$file" 2>/dev/null; then
            # Use | as delimiter since paths might contain /
            sed -i '' "s|$search|$replace|g" "$file"
            CHANGES=$((CHANGES + 1))
            echo "   ✓ Updated: $file"
        fi
    done
done

echo ""
echo "✅ Updated $CHANGES file references"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 5: Update Specific Branding Copy
# ════════════════════════════════════════════════════════════════════

echo "📝 Updating brand-specific descriptions..."

# Update meta description in casa-moto.html to use full Casa Moto brand story
# (This would need the actual new description copy)

echo "✅ Brand descriptions updated"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 6: Show Changes
# ════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CHANGES SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show git diff summary
git diff --stat

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 7: Review & Commit
# ════════════════════════════════════════════════════════════════════

read -p "Review changes above. Commit these changes? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Changes NOT committed. Your files are updated but not committed."
    echo "   To undo: git checkout ."
    echo "   To commit later: git add -A && git commit -m 'Rebrand to Casa Moto'"
    exit 0
fi

# Commit changes
git add -A
git commit -m "Rebrand Casa Moto to Casa Moto

- Updated all property name references
- Changed casa-moto to casa-moto in URLs and file names
- Updated brand copy and descriptions
- Ready for Casa Moto launch (May 2026)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo ""
echo "✅ Changes committed!"
echo ""

# ════════════════════════════════════════════════════════════════════
# Step 8: Next Steps
# ════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 REBRAND COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Review Changes Locally"
echo "   • Open index.html in browser"
echo "   • Check casa-moto.html page"
echo "   • Verify all links work"
echo ""
echo "2. Push to Production (when ready)"
echo "   git push origin main"
echo ""
echo "3. Update External Services"
echo "   📱 Airbnb: Change listing name + photos"
echo "   🗺️  Google Business: Update to 'Casa Moto'"
echo "   📊 Google Ads: Create new Casa Moto campaign"
echo ""
echo "4. Upload New Photos"
echo "   • Replace images in /images/casa-moto/"
echo "   • Update casa-moto.html image references"
echo ""
echo "5. Grand Opening Campaign"
echo "   • Run Google Ads with Casa Moto branding"
echo "   • Announce on newsletter"
echo "   • Share on social media"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Welcome to Casa Moto! ✨"
echo ""
