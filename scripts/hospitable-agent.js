#!/usr/bin/env node
/**
 * Hospitable Guest Messaging Agent
 *
 * Pulls unresponded conversations from Hospitable, drafts replies using Claude,
 * and lets you approve before sending.
 *
 * Usage:
 *   node scripts/hospitable-agent.js              # Review + approve drafts
 *   node scripts/hospitable-agent.js --check      # Summary of upcoming reservations
 *   node scripts/hospitable-agent.js --send       # Auto-send approved drafts (careful!)
 *
 * Setup:
 *   1. Get your Hospitable API token from app.hospitable.com → Settings → Integrations → API
 *   2. Get your Anthropic API key from console.anthropic.com
 *   3. Copy .env.example to .env and fill in values
 *   4. npm install @anthropic-ai/sdk node-fetch dotenv readline
 */

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const HOSPITABLE_TOKEN = process.env.HOSPITABLE_API_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = 'https://api.hospitable.com/v1';

if (!HOSPITABLE_TOKEN || !ANTHROPIC_API_KEY) {
  console.error('Missing HOSPITABLE_API_TOKEN or ANTHROPIC_API_KEY in .env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── Property Context ─────────────────────────────────────────────────────────

const PROPERTY_CONTEXT = `
You are drafting guest messages for The Sundune at Palm Springs, managed by Eann (she/her).
Property: 2BR/2BA condo at 5301 E Waverly Dr #184, Palm Springs, CA 92264
Managed by Brandon on-site.

Key details:
- Check-in: 4pm, Check-out: 11am
- Keyless entry, code changes per reservation
- 3 pools, spa open year-round, pools heated Nov–Apr
- Max occupancy: 4 adults
- Pets allowed ($150 per pet per stay)
- No parties, no smoking, quiet hours after 10pm
- HOA minimum stay: 4 nights
- Airport: 3 miles, Downtown PS: 5 miles, Target/Trader Joe's: 0.5 miles
- Lost pool key: $300 replacement fee
- WiFi: "The PS Retreat" (password in welcome guide)
- Welcome guide: https://bit.ly/psretreatwelcome

Voice guidelines:
- Warm and direct. First person. No em dashes.
- Short paragraphs. Specific details, not vague reassurances.
- Don't sound like a bot. Sound like Eann.
- Sign off as "Eann" (not "Eann Tuan", not "The Indigo Palm Team")
`;

// ─── Hospitable API Helpers ───────────────────────────────────────────────────

async function hospGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${HOSPITABLE_TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Hospitable API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function hospPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HOSPITABLE_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hospitable API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Get Conversations Needing Reply ──────────────────────────────────────────

async function getPendingConversations() {
  // Get properties first
  const propsRes = await hospGet('/properties?per_page=50');
  const properties = propsRes.data || [];
  const propertyIds = properties.map(p => p.id);

  if (propertyIds.length === 0) {
    console.log('No properties found.');
    return [];
  }

  // Fetch reservations with recent messages (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dateStr = sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

  const pending = [];

  for (const propId of propertyIds) {
    const prop = properties.find(p => p.id === propId);

    // Get reservations with recent message activity
    const resRes = await hospGet(
      `/reservations?properties[]=${propId}&last_message_at=${encodeURIComponent(dateStr)}&per_page=20&include=guest`
    );
    const reservations = resRes.data || [];

    for (const res of reservations) {
      if (!res.conversation_id) continue;

      // Fetch the conversation messages
      const msgRes = await hospGet(`/reservations/${res.id}/messages`);
      const messages = msgRes.data || [];

      if (messages.length === 0) continue;

      // Check if last message is from guest (not host)
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.author === 'host') continue; // Already replied

      pending.push({
        reservation: res,
        property: prop,
        messages,
        lastGuestMessage: lastMsg,
      });
    }
  }

  return pending;
}

// ─── Draft Reply with Claude ───────────────────────────────────────────────────

async function draftReply(conversation) {
  const { reservation, messages, lastGuestMessage } = conversation;
  const guest = reservation.guest;

  // Build conversation history for context
  const history = messages
    .slice(-6) // Last 6 messages for context
    .map(m => `[${m.author === 'host' ? 'You' : guest?.first_name || 'Guest'}]: ${m.body}`)
    .join('\n\n');

  const checkIn = reservation.arrival_date?.slice(0, 10);
  const checkOut = reservation.departure_date?.slice(0, 10);

  const prompt = `${PROPERTY_CONTEXT}

Current reservation:
- Guest: ${guest?.first_name} ${guest?.last_name || ''} (${guest?.location || 'location unknown'})
- Check-in: ${checkIn}, Check-out: ${checkOut}
- Nights: ${reservation.nights}
- Platform: ${reservation.platform}
- Status: ${reservation.status}

Recent conversation:
${history}

Draft a reply to the guest's last message. Be concise and helpful. Use the property details above as needed. Do not make up information you don't have.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}

// ─── Upcoming Reservations Summary ───────────────────────────────────────────

async function checkUpcoming() {
  const propsRes = await hospGet('/properties?per_page=50');
  const properties = propsRes.data || [];

  console.log('\n=== Upcoming Reservations (Next 30 Days) ===\n');

  for (const prop of properties) {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const resRes = await hospGet(
      `/reservations?properties[]=${prop.id}&start_date=${today}&end_date=${in30}&include=guest&per_page=20`
    );
    const reservations = (resRes.data || []).filter(r => r.status === 'accepted');

    if (reservations.length === 0) {
      console.log(`${prop.name || prop.public_name}: No upcoming bookings in next 30 days`);
      continue;
    }

    console.log(`${prop.name || prop.public_name}:`);
    for (const res of reservations) {
      const g = res.guest;
      console.log(`  ${res.arrival_date?.slice(0, 10)} → ${res.departure_date?.slice(0, 10)} | ${res.nights}n | ${g?.first_name || 'Guest'} ${g?.last_name || ''} | ${res.platform} | ${res.guests?.total} guests`);
    }
    console.log('');
  }
}

// ─── Interactive Review Flow ──────────────────────────────────────────────────

async function reviewAndSend(autoSend = false) {
  console.log('\nFetching conversations...\n');
  const conversations = await getPendingConversations();

  if (conversations.length === 0) {
    console.log('No conversations waiting on a reply.');
    return;
  }

  console.log(`Found ${conversations.length} conversation(s) needing a reply.\n`);

  const rl = readline.createInterface({ input, output });

  for (const convo of conversations) {
    const { reservation, lastGuestMessage } = convo;
    const guest = reservation.guest;

    console.log('─'.repeat(60));
    console.log(`Guest: ${guest?.first_name} ${guest?.last_name || ''}`);
    console.log(`Stay:  ${reservation.arrival_date?.slice(0, 10)} → ${reservation.departure_date?.slice(0, 10)}`);
    console.log(`Last message from guest:\n  "${lastGuestMessage.body}"\n`);

    console.log('Drafting reply...');
    const draft = await draftReply(convo);

    console.log('\nDraft reply:\n');
    console.log(draft);
    console.log('');

    if (autoSend) {
      await hospPost(`/reservations/${reservation.id}/messages`, { message: draft });
      console.log('Sent.');
    } else {
      const answer = await rl.question('(s)end, (e)dit, (s)kip? ').catch(() => 'skip');
      const action = answer.trim().toLowerCase();

      if (action === 's' || action === 'send') {
        await hospPost(`/reservations/${reservation.id}/messages`, { message: draft });
        console.log('Sent.\n');
      } else if (action === 'e' || action === 'edit') {
        const edited = await rl.question('Paste your edited message (one line):\n> ');
        if (edited.trim()) {
          await hospPost(`/reservations/${reservation.id}/messages`, { message: edited.trim() });
          console.log('Sent.\n');
        }
      } else {
        console.log('Skipped.\n');
      }
    }
  }

  rl.close();
  console.log('Done.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--check')) {
  checkUpcoming().catch(console.error);
} else if (args.includes('--send')) {
  reviewAndSend(true).catch(console.error);
} else {
  reviewAndSend(false).catch(console.error);
}
