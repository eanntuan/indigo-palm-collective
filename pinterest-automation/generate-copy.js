import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// 2 boards per post — avoids spam signals on a growing account
const BOARD_RULES = {
  'Travel Guide':     ['Palm Springs Travel Guide', 'BLOGS| Palm Springs Travel & Airbnb Tips'],
  'Local Guide':      ['Palm Springs Travel Guide', 'BLOGS| Palm Springs Travel & Airbnb Tips'],
  'Coachella':        ['Coachella Accommodation', 'BLOGS| Palm Springs Travel & Airbnb Tips'],
  'Festival':         ['Coachella Accommodation', 'Family Vacation Ideas'],
  'Vacation Rental':  ['Cozy Cactus Indigo Stay', 'BLOGS| Palm Springs Travel & Airbnb Tips'],
  'Vacation Rental Design': ['Terra Luz | Palm Springs Luxury Airbnb', 'BLOGS| Palm Springs Travel & Airbnb Tips'],
  'Family Travel':    ['Family Vacation Ideas', 'Palm Springs Travel Guide'],
  default:            ['BLOGS| Palm Springs Travel & Airbnb Tips', 'Palm Springs Travel Guide'],
};

function boardsForSection(articleSection) {
  for (const [key, boards] of Object.entries(BOARD_RULES)) {
    if (key !== 'default' && articleSection && articleSection.toLowerCase().includes(key.toLowerCase())) {
      return boards;
    }
  }
  return BOARD_RULES.default;
}

export async function generatePinCopy(slug) {
  const mdPath = path.join(REPO_ROOT, 'content', 'blog', `${slug}.md`);
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { data } = matter(raw);

  const boards = boardsForSection(data.articleSection);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You write Pinterest pin copy for Indigo Palm Collective, a vacation rental brand in Palm Springs and Indio, CA (near Coachella). Properties: Cozy Cactus and Terra Luz in Indio, The Sundune in Palm Springs.

Voice: specific, honest, desert-local. No hollow adjectives. Short punchy descriptions ending with a soft CTA.

Blog post:
Title: ${data.title}
Excerpt: ${data.excerpt}
Keywords: ${(data.keywords || []).join(', ')}

Generate exactly 2 Pinterest pins with different angles (e.g. practical + aspirational, or local + listicle).
Pin 1 goes to board: ${boards[0]}
Pin 2 goes to board: ${boards[1]}

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "title": "40-60 char keyword-rich title",
    "description": "150-250 char conversational description ending with soft CTA like 'Full guide at the link.'",
    "angle": "practical|aspirational|local|property|listicle",
    "board": "${boards[0]}"
  },
  {
    "title": "different 40-60 char title",
    "description": "different 150-250 char description ending with soft CTA",
    "angle": "practical|aspirational|local|property|listicle",
    "board": "${boards[1]}"
  }
]`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw_text = message.content[0].text.trim();
  const text = raw_text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const pins = JSON.parse(text);

  console.log(`Generated ${pins.length} pins for ${slug} → boards: ${boards.join(', ')}`);
  return pins;
}
