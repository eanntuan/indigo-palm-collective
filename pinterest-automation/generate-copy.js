import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const BOARDS = [
  { id: null, name: 'Palm Springs Travel Guide' },
  { id: null, name: 'Blogs — Palm Springs Travel / Airbnb Tips' },
  { id: null, name: 'Cozy Cactus Indigo Stay' },
  { id: null, name: 'Coachella Accommodation' },
  { id: null, name: 'Family Vacation Ideas' },
];

export async function generatePinCopy(slug) {
  const mdPath = path.join(REPO_ROOT, 'content', 'blog', `${slug}.md`);
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { data, content } = matter(raw);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You write Pinterest pin copy for Indigo Palm Collective, a vacation rental brand in Palm Springs and Indio, CA (near Coachella). Properties: Cozy Cactus and Terra Luz in Indio, The Sundune in Palm Springs.

Voice: specific, honest, desert-local. No hollow adjectives. Short punchy descriptions that end with a soft CTA.

Blog post to generate pins for:
Title: ${data.title}
Excerpt: ${data.excerpt}
Keywords: ${(data.keywords || []).join(', ')}

Generate exactly 5 Pinterest pins. Each pin targets a different angle: practical tip, emotional/aspirational, local knowledge, property-specific, listicle.

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "title": "40-60 char keyword-rich title",
    "description": "150-250 char conversational description ending with soft CTA like 'Full guide at the link.' or 'Details at the link.'",
    "angle": "practical|aspirational|local|property|listicle",
    "board": "one of: Palm Springs Travel Guide | Blogs — Palm Springs Travel / Airbnb Tips | Cozy Cactus Indigo Stay | Coachella Accommodation | Family Vacation Ideas"
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

  console.log(`Generated ${pins.length} pin descriptions for ${slug}`);
  return pins;
}
