// Usage: node run.js <slug>
// Example: node run.js palm-springs-vs-scottsdale

import { generatePinImage } from './generate-image.js';
import { generatePinCopy } from './generate-copy.js';
import { postPin } from './post-pins.js';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node run.js <slug>');
  process.exit(1);
}

async function run() {
  console.log(`\nProcessing: ${slug}\n`);

  // 1. Generate pin image
  console.log('Step 1/3: Generating pin image...');
  const imagePath = await generatePinImage(slug);

  // 2. Generate pin copy
  console.log('Step 2/3: Generating pin copy with Claude...');
  const pins = await generatePinCopy(slug);

  // 3. Get post URL
  const { data } = matter(fs.readFileSync(
    path.join(REPO_ROOT, 'content', 'blog', `${slug}.md`), 'utf8'
  ));
  const link = `https://indigopalm.co/blog/${slug}/`;

  // 4. Post pins
  const dryRun = !process.env.PINTEREST_ACCESS_TOKEN;
  if (dryRun) {
    console.log('\nStep 3/3: DRY RUN (no PINTEREST_ACCESS_TOKEN set)\n');
    console.log('Would post these pins:\n');
    pins.forEach((p, i) => {
      console.log(`Pin ${i + 1} [${p.board}]`);
      console.log(`  Title: ${p.title}`);
      console.log(`  Description: ${p.description}`);
      console.log(`  Link: ${link}\n`);
    });
    console.log(`Image: ${imagePath}`);
    return;
  }

  console.log('Step 3/3: Posting to Pinterest...');
  const results = [];
  for (const pin of pins) {
    try {
      const result = await postPin({
        title: pin.title,
        description: pin.description,
        boardName: pin.board,
        imagePath,
        link,
      });
      results.push(result);
      // Space out requests to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Failed to post pin: ${err.message}`);
    }
  }

  console.log(`\nDone. Posted ${results.filter(Boolean).length}/${pins.length} pins for ${slug}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
