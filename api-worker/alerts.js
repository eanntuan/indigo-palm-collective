// Alerting and health helpers, kept in their own file so index.js / autopay.js
// only need a few wiring lines.
//
//   pushAlert(env, deps, title, body)  push to the host's subscribed device; never throws
//   recordHeartbeat(env)               stamp the last successful daily cron run in KV
//   handlePing()                       GET /api/ping   public, {ok:true} only
//   handleHealth(request, env, deps)   GET /api/health admin-key guarded, counts only (no PII)

export const HEARTBEAT_KEY = 'heartbeat:daily';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

// Best-effort push. A missing subscription, a push-service error or a thrown
// exception is logged and swallowed: alerting must never break a charge flow.
export async function pushAlert(env, deps, title, body, url = '/inbox') {
  try {
    if (!deps || typeof deps.sendWebPush !== 'function') return false;
    return !!(await deps.sendWebPush(env, { title, body, url }));
  } catch (e) {
    console.error('Push alert failed', e && e.message ? e.message : e);
    return false;
  }
}

export async function recordHeartbeat(env, nowMs = Date.now()) {
  try {
    await env.BOOKINGS.put(HEARTBEAT_KEY, JSON.stringify({ at: new Date(nowMs).toISOString() }));
  } catch (e) { console.error('Heartbeat write failed', e); }
}

export function handlePing() {
  return json({ ok: true });
}

export async function handleHealth(request, env, deps) {
  if (!deps.isAdminAuthorized(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  let lastRun = null;
  try {
    const raw = await env.BOOKINGS.get(HEARTBEAT_KEY);
    lastRun = raw ? (JSON.parse(raw).at || null) : null;
  } catch (e) { console.error('Heartbeat read failed', e); }

  const counts = { scheduled: 0, failed: 0, needs_attention: 0 };
  let cursor;
  do {
    const page = await env.BOOKINGS.list({ prefix: 'autopay:', cursor });
    for (const k of page.keys) {
      try {
        const raw = await env.BOOKINGS.get(k.name);
        const status = raw ? JSON.parse(raw).status : null;
        if (status in counts) counts[status]++;
      } catch { /* skip unreadable record */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const ageHours = lastRun ? Math.round((Date.now() - Date.parse(lastRun)) / 36e5 * 10) / 10 : null;
  return json({ ok: true, dailyJob: { lastRun, ageHours }, autopay: counts });
}
