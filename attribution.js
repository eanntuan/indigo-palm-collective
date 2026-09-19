// First-touch attribution capture. Runs on every page; writes once per browser
// (never overwrites) so "how did this guest find us" survives however many
// pages they click through before booking. Read back and submitted with the
// booking request in booking-flow.js.
(function () {
  var KEY = 'ip_attribution';
  try {
    if (localStorage.getItem(KEY)) return;
    var params = new URLSearchParams(location.search);
    var data = {
      firstTouchAt: new Date().toISOString(),
      landingPage: location.pathname,
      referrer: document.referrer || null,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term'),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage unavailable (private mode, blocked storage) — skip silently
  }
})();
