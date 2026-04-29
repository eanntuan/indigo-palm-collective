// Run once after getting Pinterest access token to populate boards.json
// Usage: PINTEREST_ACCESS_TOKEN=xxx node get-boards.js

const PINTEREST_API = 'https://api.pinterest.com/v5';

async function getBoards() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    console.error('Set PINTEREST_ACCESS_TOKEN first');
    process.exit(1);
  }

  const res = await fetch(`${PINTEREST_API}/boards?page_size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

  const { items } = await res.json();
  const map = {};
  items.forEach(b => {
    map[b.name] = b.id;
    console.log(`${b.id}  ${b.name}`);
  });

  const { writeFileSync } = await import('fs');
  writeFileSync(new URL('./boards.json', import.meta.url), JSON.stringify(map, null, 2));
  console.log('\nSaved to boards.json');
}

getBoards().catch(console.error);
