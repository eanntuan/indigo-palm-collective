#!/usr/bin/env bash
# Read-only smoke check of https://indigopalm.co. Never creates a booking or charges a card.
set -u
BASE="${BASE:-https://indigopalm.co}"
fail=0
check() { # name, ok(0/1), detail
  if [ "$2" = 0 ]; then echo "PASS  $1"; else echo "FAIL  $1  ($3)"; fail=1; fi
}

code=$(curl -s -o /tmp/pay.html -w '%{http_code}' "$BASE/pay/")
check "pay page loads" $([ "$code" = 200 ] && echo 0 || echo 1) "HTTP $code"
grep -q "Complete your booking" /tmp/pay.html; check "pay page has its heading" $? "heading missing"
grep -q "squarecdn.com\|web.squarecdn" /tmp/pay.html || grep -q "loadSquare" /tmp/pay.html; check "pay page loads the Square card form" $? "no Square SDK reference"

body=$(curl -s -w '\n%{http_code}' "$BASE/api/autopay/config?id=smoke&t=smoke")
code=${body##*$'\n'}; json=${body%$'\n'*}
check "autopay config rejects a bad link with JSON (not an error page)" $([ "$code" = 403 -o "$code" = 404 -o "$code" = 400 ] && echo "$json" | grep -q '"success":false' && echo 0 || echo 1) "HTTP $code: ${json:0:120}"

for p in ps-retreat cozy-cactus terra-luz; do
  code=$(curl -s -o /tmp/av.json -w '%{http_code}' "$BASE/api/availability?property=$p")
  check "availability responds for $p" $([ "$code" = 200 ] && echo 0 || echo 1) "HTTP $code"
done

code=$(curl -s -o /tmp/pr.json -w '%{http_code}' "$BASE/api/pricing?property=ps-retreat&checkIn=2027-06-01&checkOut=2027-06-05")
check "pricing responds for ps-retreat" $([ "$code" = 200 ] && echo 0 || echo 1) "HTTP $code"
if [ "$code" = 200 ]; then
  grep -q '"total"' /tmp/pr.json; check "pricing returns a total" $? "no total in response"
fi

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/autopay/enroll" -H 'Content-Type: application/json' -d '{"id":"smoke","t":"smoke","sourceId":"x","plan":"full"}')
check "pay endpoint refuses a bogus booking (does not charge)" $([ "$code" = 403 -o "$code" = 404 -o "$code" = 400 ] && echo 0 || echo 1) "HTTP $code"

for page in / /book-direct/ /booking-flow/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$page")
  check "page $page loads" $([ "$code" = 200 ] && echo 0 || echo 1) "HTTP $code"
done

exit $fail
