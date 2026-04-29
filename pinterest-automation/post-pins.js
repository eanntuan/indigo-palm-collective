import fs from 'fs';

const PINTEREST_API = 'https://api.pinterest.com/v5';

// Board name → ID mapping (populated by get-boards.js)
let BOARD_IDS = {};
try {
  const boardsFile = new URL('./boards.json', import.meta.url);
  BOARD_IDS = JSON.parse(fs.readFileSync(boardsFile, 'utf8'));
} catch {
  // boards.json not yet generated — run get-boards.js first
}

export async function postPin({ title, description, boardName, imagePath, link }) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error('PINTEREST_ACCESS_TOKEN not set');

  const boardId = BOARD_IDS[boardName];
  if (!boardId) {
    console.warn(`Board ID not found for "${boardName}" — skipping pin. Run get-boards.js to populate boards.json.`);
    return null;
  }

  const imageData = fs.readFileSync(imagePath).toString('base64');

  const body = {
    title,
    description,
    link,
    board_id: boardId,
    media_source: {
      source_type: 'image_base64',
      content_type: 'image/png',
      data: imageData,
    },
  };

  const res = await fetch(`${PINTEREST_API}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest API error ${res.status}: ${err}`);
  }

  const pin = await res.json();
  console.log(`Posted pin: ${pin.id} → board "${boardName}"`);
  return pin;
}
