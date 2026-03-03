import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="114" fill="#000"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="#fff" stroke-width="24"/>
  <line x1="256" y1="160" x2="256" y2="352" stroke="#fff" stroke-width="24" stroke-linecap="round"/>
  <line x1="160" y1="256" x2="352" y2="256" stroke="#fff" stroke-width="24" stroke-linecap="round"/>
</svg>`;

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(PUBLIC, name));
  console.log(`✓ ${name}`);
}
console.log('Done — icons in /public');
