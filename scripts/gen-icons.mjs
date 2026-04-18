import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const svgPath = resolve(root, 'public/icon.svg');
const svg = readFileSync(svgPath);

const outputs = [
  { name: 'apple-touch-icon.png', size: 180, pad: 0 },
  { name: 'icon-192.png',          size: 192, pad: 0 },
  { name: 'icon-512.png',          size: 512, pad: 0 },
  { name: 'icon-maskable-512.png', size: 512, pad: 72 },
  { name: 'favicon-32.png',        size: 32,  pad: 0 },
  { name: 'favicon-16.png',        size: 16,  pad: 0 },
];

for (const o of outputs) {
  const target = resolve(root, 'public', o.name);
  if (o.pad > 0) {
    const inner = o.size - o.pad * 2;
    const fg = await sharp(svg, { density: 512 })
      .resize(inner, inner)
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: o.size,
        height: o.size,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    })
      .composite([{ input: fg, top: o.pad, left: o.pad }])
      .png()
      .toFile(target);
  } else {
    await sharp(svg, { density: 512 })
      .resize(o.size, o.size)
      .png()
      .toFile(target);
  }
  console.log('wrote', o.name);
}
