// Copies every email the Worker sends into the host's real Gmail "Sent" folder.
//
// Resend sends the mail; this then INSERTS a copy into Gmail with the SENT label
// (Gmail API users.messages.insert, scope gmail.insert). It never sends anything.
// If it fails, the guest email has already gone out and the error is only logged.
//
// Worker secrets (see GMAIL_SENT_SETUP.md): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// GOOGLE_REFRESH_TOKEN. Without all three this module does nothing and the Worker
// falls back to BCC'ing the host.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INSERT_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';

export const gmailSentConfigured = (env) =>
  !!(env && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64url = (s) => b64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const wrap76 = (s) => s.replace(/(.{76})/g, '$1\r\n');
// Header values: strip CR/LF so a guest-supplied value can never inject headers.
const clean = (v) => String(v).replace(/[\r\n]+/g, ' ').trim();
const list = (v) => [].concat(v || []).map(clean).filter(Boolean).join(', ');
const encodeWord = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

export function buildRawMessage({ from, to, cc, subject, html, reply_to }, now = new Date()) {
  const headers = [
    `From: ${clean(from)}`,
    `To: ${list(to)}`,
  ];
  if (cc) headers.push(`Cc: ${list(cc)}`);
  if (reply_to) headers.push(`Reply-To: ${list(reply_to)}`);
  headers.push(
    `Subject: ${encodeWord(clean(subject || ''))}`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${now.getTime()}.${Math.random().toString(36).slice(2, 10)}@indigopalm.co>`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  );
  return headers.join('\r\n') + '\r\n\r\n' + wrap76(b64(html || ''));
}

let cached = { token: null, exp: 0 };

async function accessToken(env) {
  if (cached.token && Date.now() < cached.exp - 60_000) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) throw new Error(`Google token refresh failed (${res.status}) ${j.error || ''}`);
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

// Never throws: the guest email has already been sent by the time this runs.
export async function copyToGmailSent(env, message) {
  if (!gmailSentConfigured(env)) return false;
  try {
    const token = await accessToken(env);
    const res = await fetch(INSERT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: b64url(buildRawMessage(message)), labelIds: ['SENT'] }),
    });
    if (!res.ok) {
      if (res.status === 401) cached = { token: null, exp: 0 };
      console.error('Gmail Sent copy failed', res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error('Gmail Sent copy failed', e);
    return false;
  }
}

export const _resetGmailTokenCache = () => { cached = { token: null, exp: 0 }; };

// Admin-only diagnostic: runs the token refresh and one real insert and reports exactly
// where it fails. Never returns tokens or secrets.
export async function diagnoseGmailSent(env) {
  const out = { configured: gmailSentConfigured(env), have: {
    GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN: !!env.GOOGLE_REFRESH_TOKEN,
  } };
  if (!out.configured) return out;
  const rt = String(env.GOOGLE_REFRESH_TOKEN);
  out.refreshTokenLooksRight = rt.startsWith('1//');
  out.refreshTokenLength = rt.length;
  out.hasWhitespace = { id: /\s/.test(env.GOOGLE_CLIENT_ID), secret: /\s/.test(env.GOOGLE_CLIENT_SECRET), token: /\s/.test(rt) };
  _resetGmailTokenCache();
  let token;
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: rt, grant_type: 'refresh_token' }),
    });
    const j = await res.json().catch(() => ({}));
    out.token = { status: res.status, ok: res.ok && !!j.access_token, error: j.error || null, error_description: j.error_description || null, scope: j.scope || null };
    token = j.access_token;
  } catch (e) { out.token = { ok: false, error: String(e.message || e) }; }
  if (!token) return out;
  try {
    const raw = buildRawMessage({
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>', to: 'guest-test@example.com',
      subject: 'Test: Gmail Sent copy from the Worker', html: '<p>If you can read this in Sent, the Gmail Sent copy works.</p>',
    });
    const res = await fetch(INSERT_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: b64url(raw), labelIds: ['SENT'] }),
    });
    out.insert = { status: res.status, ok: res.ok, body: (await res.text()).slice(0, 400) };
  } catch (e) { out.insert = { ok: false, error: String(e.message || e) }; }
  return out;
}
