import puppeteer from 'puppeteer';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function toBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function titleFontSize(title) {
  if (title.length < 30) return 82;
  if (title.length < 50) return 72;
  if (title.length < 70) return 60;
  return 50;
}

export async function generatePinImage(slug) {
  const mdPath = path.join(REPO_ROOT, 'content', 'blog', `${slug}.md`);
  if (!fs.existsSync(mdPath)) throw new Error(`Post not found: ${mdPath}`);

  const { data } = matter(fs.readFileSync(mdPath, 'utf8'));
  const { title, heroImage, excerpt } = data;

  const imgPath = path.join(REPO_ROOT, heroImage.replace(/^\//, ''));
  if (!fs.existsSync(imgPath)) throw new Error(`Hero image not found: ${imgPath}`);

  const heroSrc = toBase64(imgPath);
  const logoSrc = toBase64(path.join(REPO_ROOT, 'android-chrome-512x512.png'));

  const templatePath = path.join(__dirname, 'template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace('{{HERO_IMAGE}}', heroSrc)
    .replace('{{LOGO_SRC}}', logoSrc)
    .replace('{{TITLE}}', title.replace(/"/g, '&quot;'))
    .replace('{{SUBTITLE}}', (excerpt || '').replace(/"/g, '&quot;'))
    .replace('{{TITLE_SIZE}}', titleFontSize(title));

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new',
    executablePath: fs.existsSync(chromePath) ? chromePath : puppeteer.executablePath(),
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  const outputDir = path.join(__dirname, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${slug}.png`);

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1000, height: 1500 },
  });

  await browser.close();
  console.log(`Image generated: ${outputPath}`);
  return outputPath;
}
