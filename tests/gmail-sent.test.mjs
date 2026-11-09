// Unit tests for the Gmail Sent-folder copy. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRawMessage, gmailSentConfigured } from '../api-worker/gmail-sent.js';

const b64d = (s) => Buffer.from(s.replace(/\r\n/g, ''), 'base64').toString('utf8');

test('only configured when all three Google secrets exist', () => {
  assert.equal(gmailSentConfigured({}), false);
  assert.equal(gmailSentConfigured({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' }), false);
  assert.equal(gmailSentConfigured({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b', GOOGLE_REFRESH_TOKEN: 'c' }), true);
});

test('raw message has proper headers and a base64 UTF-8 HTML body', () => {
  const raw = buildRawMessage({
    from: 'Bookings <bookings@indigopalm.co>', to: 'g@example.com', cc: ['a@x.com', 'b@x.com'],
    subject: 'Your stay \u2013 caf\u00e9', html: '<p>Hola \u00e9\u00f1 \ud83c\udf34</p>',
  }, new Date('2026-11-09T12:00:00Z'));
  const [head, body] = raw.split('\r\n\r\n');
  assert.match(head, /^From: Bookings <bookings@indigopalm\.co>/m);
  assert.match(head, /^To: g@example\.com/m);
  assert.match(head, /^Cc: a@x\.com, b@x\.com/m);
  assert.match(head, /^Content-Type: text\/html; charset=UTF-8/m);
  assert.match(head, /^Subject: =\?UTF-8\?B\?/m);
  assert.equal(b64d(body), '<p>Hola \u00e9\u00f1 \ud83c\udf34</p>');
});

test('header injection through guest-supplied values is neutralised', () => {
  const raw = buildRawMessage({ from: 'a@b.com', to: 'x@y.com\r\nBcc: evil@z.com', subject: 'Hi\r\nBcc: evil@z.com', html: 'x' });
  const head = raw.split('\r\n\r\n')[0];
  assert.doesNotMatch(head, /^Bcc:/m);
});

import { diagnoseGmailSent } from '../api-worker/gmail-sent.js';

test('diagnostic reports a bad refresh token without leaking secrets', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Bad Request' }), { status: 400 });
  try {
    const out = await diagnoseGmailSent({ GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'SECRET-VALUE', GOOGLE_REFRESH_TOKEN: '04abc' });
    assert.equal(out.refreshTokenLooksRight, false);
    assert.equal(out.token.ok, false);
    assert.equal(out.token.error, 'invalid_grant');
    assert.doesNotMatch(JSON.stringify(out), /SECRET-VALUE|04abc/);
  } finally { globalThis.fetch = real; }
});
