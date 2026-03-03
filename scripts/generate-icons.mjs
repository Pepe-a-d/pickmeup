import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#000000"/>
  <g transform="translate(256,256)" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="-110" cy="60" r="50" stroke-width="18"/>
    <circle cx="110"  cy="60" r="50" stroke-width="18"/>
    <path d="M-110,60 L-60,-20 L40,-20 L110,60" stroke-width="16"/>
    <path d="M-30,-20 L10,-70 L70,-70 L90,-20" stroke-width="14"/>
    <path d="M-60,-20 L40,-20" stroke-width="20" stroke-linecap="round"/>
    <path d="M70,-70 L100,-55 M100,-55 L108,-42" stroke-width="12"/>
    <circle cx="10" cy="-90" r="18" fill="#ffffff" stroke="none"/>
  </g>
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
