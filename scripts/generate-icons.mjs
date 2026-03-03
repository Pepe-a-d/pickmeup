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
  <circle cx="152" cy="312" r="72" fill="none" stroke="#fff" stroke-width="20"/>
  <circle cx="152" cy="312" r="12" fill="#fff"/>
  <circle cx="360" cy="312" r="72" fill="none" stroke="#fff" stroke-width="20"/>
  <circle cx="360" cy="312" r="12" fill="#fff"/>
  <path d="M152 312 L210 200 L290 200 L360 312" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M200 200 L240 140 L310 140 L340 200" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M330 155 L375 175" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
  <path d="M175 295 L130 330" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
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
