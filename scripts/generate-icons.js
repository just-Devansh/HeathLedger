import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

// For apple-touch-icon: iOS applies its own corner radius, so use full background
const svgNoRound = svgBuffer.toString().replace(/rx="\d+"/, 'rx="0"');

const icons = [
  { buffer: svgBuffer, size: 32,  out: 'favicon-32x32.png' },
  { buffer: svgBuffer, size: 192, out: 'icon-192.png' },
  { buffer: svgBuffer, size: 512, out: 'icon-512.png' },
  { buffer: Buffer.from(svgNoRound), size: 180, out: 'apple-touch-icon.png' },
];

for (const { buffer, size, out } of icons) {
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, out));
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log('\nAll icons generated.');
