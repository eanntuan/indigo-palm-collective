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

# Liveness endpoint (public, returns only {"ok":true}).
code=$(curl -s -o /tmp/ping.json -w '%{http_code}' "$BASE/api/ping")
check "api ping responds ok" $([ "$code" = 200 ] && tr -d ' \n' < /tmp/ping.json | grep -q '"ok":true' && echo 0 || echo 1) "HTTP $code: $(head -c 120 /tmp/ping.json 2>/dev/null)"

# www host also loads (follows redirects, e.g. www -> apex).
code=$(curl -s -L -o /dev/null -w '%{http_code}' "https://www.${BASE#https://}/")
check "www host loads" $([ "$code" = 200 ] && echo 0 || echo 1) "HTTP $code"

# TLS certificate must have at least MIN_CERT_DAYS days left (read-only handshake).
MIN_CERT_DAYS="${MIN_CERT_DAYS:-14}"
HOST="${BASE#https://}"; HOST="${HOST%%/*}"
enddate=$(openssl s_client -connect "$HOST:443" -servername "$HOST" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed -n 's/^notAfter=//p')
end_epoch=""
[ -n "$enddate" ] && end_epoch=$(date -d "$enddate" +%s 2>/dev/null || true)
if [ -z "$end_epoch" ]; then
  check "TLS certificate expiry" 1 "could not read or parse certificate end date (got: '${enddate:-nothing}')"
else
  days=$(( (end_epoch - $(date +%s)) / 86400 ))
  check "TLS certificate has at least $MIN_CERT_DAYS days left" $([ "$days" -ge "$MIN_CERT_DAYS" ] && echo 0 || echo 1) "$days days left (expires $enddate)"
fi

exit $fail
