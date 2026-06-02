import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const src = join(publicDir, 'icon-master.png');

const icons = [
  { size: 32,  out: 'favicon-32x32.png' },
  { size: 180, out: 'apple-touch-icon.png' },
  { size: 192, out: 'icon-192.png' },
  { size: 512, out: 'icon-512.png' },
];

for (const { size, out } of icons) {
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, out));
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log('\nAll icons generated.');
