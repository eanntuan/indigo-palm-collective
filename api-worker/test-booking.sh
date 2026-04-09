#!/bin/bash
# Quick test: creates a real booking in KV and returns a Square payment link
# Usage: ./test-booking.sh [property] [email]
# Defaults: cozy-cactus, indigopalmco@gmail.com

PROPERTY=${1:-cozy-cactus}
EMAIL=${2:-indigopalmco@gmail.com}
CHECK_IN=$(date -v+7d +%Y-%m-%d)
CHECK_OUT=$(date -v+10d +%Y-%m-%d)

echo "Creating test booking..."
echo "  Property: $PROPERTY"
echo "  Dates:    $CHECK_IN → $CHECK_OUT"
echo "  Email:    $EMAIL"
echo ""

RESULT=$(curl -s -X POST https://indigopalm.co/api/booking \
  -H "Content-Type: application/json" \
  -d "{
    \"property\": \"$PROPERTY\",
    \"propertyId\": \"$PROPERTY\",
    \"checkIn\": \"$CHECK_IN\",
    \"checkOut\": \"$CHECK_OUT\",
    \"guests\": 2,
    \"name\": \"Test Guest\",
    \"email\": \"$EMAIL\",
    \"phone\": \"5551234567\",
    \"pricing\": { \"total\": 500, \"baseRate\": 450, \"cleaningFee\": 50 }
  }")

BOOKING_ID=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('bookingId',''))" 2>/dev/null)
TOKEN=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',''))" 2>/dev/null)

if [ "$SUCCESS" != "True" ] || [ -z "$BOOKING_ID" ]; then
  echo "Booking failed:"
  echo "$RESULT" | python3 -m json.tool
  exit 1
fi

echo "Booking created: $BOOKING_ID"
echo "Auto-approving..."

APPROVE=$(curl -s -X POST https://indigopalm.co/api/approve \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"$BOOKING_ID\", \"token\": \"$TOKEN\"}")

echo "$APPROVE" | python3 -m json.tool

PAYMENT_URL=$(echo "$APPROVE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('paymentLink') or d.get('paymentUrl',''))" 2>/dev/null)
if [ -n "$PAYMENT_URL" ]; then
  echo ""
  echo "Opening payment link..."
  open "$PAYMENT_URL"
else
  echo "No payment URL returned — check approve response above."
fi
