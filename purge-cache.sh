#!/bin/bash
# Purge Cloudflare cache for indigopalm.co
# Requires CLOUDFLARE_API_TOKEN set in the environment (never hardcode it here).

CLOUDFLARE_ZONE_ID="669c6881604295a9e32aa10f1c800e5c"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN is not set. Export it before running this script:"
  echo "   export CLOUDFLARE_API_TOKEN=\"your-token-here\""
  exit 1
fi

echo "Purging Cloudflare cache for indigopalm.co..."

response=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

success=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['success'])" 2>/dev/null)

if [ "$success" = "True" ]; then
  echo "✅ Cache purged successfully!"
  echo "Wait 10-30 seconds, then hard refresh your browser (Cmd+Shift+R)"
else
  echo "❌ Cache purge failed:"
  echo "$response" | python3 -m json.tool
fi
