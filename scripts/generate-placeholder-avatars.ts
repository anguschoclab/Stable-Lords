/**
 * Placeholder avatar asset generator.
 *
 * Produces simple 256x256 transparent PNGs in public/avatars/layers/ so the
 * avatar system has a complete catalog without requiring AI-generated art.
 * The shapes are intentionally primitive (silhouettes / colored blocks) and
 * are meant to be replaced by real pixel-art later.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

import { logger } from '@/utils/logger';

const SIZE = 256;
const OUT_DIR = path.resolve(import.meta.dirname, '../public/avatars/layers');

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

function transparent(): Color {
  return { r: 0, g: 0, b: 0, a: 0 };
}

function hexToColor(hex: string): Color {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: 255,
  };
}

type PixelBuffer = Uint8ClampedArray;

function createBuffer(width: number, height: number): PixelBuffer {
  return new Uint8ClampedArray(width * height * 4);
}

function setPixel(buf: PixelBuffer, width: number, x: number, y: number, c: Color): void {
  if (x < 0 || x >= width || y < 0 || y >= width) return;
  const i = (y * width + x) * 4;
  if (c.a === 255) {
    buf[i] = c.r;
    buf[i + 1] = c.g;
    buf[i + 2] = c.b;
    buf[i + 3] = c.a;
  } else if (c.a > 0) {
    const alpha = c.a / 255;
    buf[i] = Math.round(c.r * alpha + buf[i] * (1 - alpha));
    buf[i + 1] = Math.round(c.g * alpha + buf[i + 1] * (1 - alpha));
    buf[i + 2] = Math.round(c.b * alpha + buf[i + 2] * (1 - alpha));
    buf[i + 3] = Math.round(alpha * 255 + (buf[i + 3] / 255) * (1 - alpha) * 255);
  }
}

function fillRect(
  buf: PixelBuffer,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
  c: Color
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(buf, width, x + dx, y + dy, c);
    }
  }
}

function fillCircle(
  buf: PixelBuffer,
  width: number,
  cx: number,
  cy: number,
  r: number,
  c: Color
): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        setPixel(buf, width, x, y, c);
      }
    }
  }
}

function writeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc32 = makeCrc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32 >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// PNG CRC32 table
let crcTable: number[] | null = null;
function makeCrcTable(): number[] {
  if (crcTable) return crcTable;
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  crcTable = table;
  return table;
}

function makeCrc32(buf: Buffer): number {
  const table = makeCrcTable();
  let c = -1;
  for (let n = 0; n < buf.length; n++) {
    c = table[(c ^ buf[n]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

function writePng(buf: PixelBuffer, width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace
  const ihdr = writeChunk('IHDR', ihdrData);

  // Raw image data: each row starts with filter byte 0, then RGBA pixels.
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const o = y * rowSize + 1 + x * 4;
      raw[o] = buf[i];
      raw[o + 1] = buf[i + 1];
      raw[o + 2] = buf[i + 2];
      raw[o + 3] = buf[i + 3];
    }
  }
  const compressed = deflateSync(raw, { level: 9 });
  const idat = writeChunk('IDAT', compressed);
  const iend = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function savePng(name: string, buf: PixelBuffer): void {
  const filePath = path.join(OUT_DIR, name);
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const png = writePng(buf, SIZE, SIZE);
  writeFileSync(filePath, png);
}

function baseHead(gender: AvatarGender, age: AvatarAgeGroup, c: Color): PixelBuffer {
  const buf = createBuffer(SIZE, SIZE);
  const faceY = age === 'young' ? 70 : age === 'elder' ? 60 : 65;
  const faceH = age === 'young' ? 120 : 130;
  const faceW = gender === 'fem' ? 95 : 105;
  const cx = SIZE / 2;
  const cy = faceY + faceH / 2;
  fillCircle(buf, SIZE, cx, cy, faceW / 2, c);
  fillRect(buf, SIZE, cx - 25, faceY + faceH - 10, 50, 45, c);
  return buf;
}

type AvatarGender = 'masc' | 'fem' | 'neutral';
type AvatarAgeGroup = 'young' | 'adult' | 'middle' | 'elder';

const skinTones: Record<string, string> = {
  light: '#f5d0b0',
  medium: '#c58c65',
  olive: '#8d5524',
  dark: '#5c3a21',
  deep: '#3b2417',
};

const hairColors: Record<string, string> = {
  black: '#1a1a1a',
  brown: '#4a3020',
  blonde: '#e6c86e',
  red: '#a0301e',
  gray: '#8a8a8a',
};

function generateBaseAssets(): void {
  const genders: AvatarGender[] = ['masc', 'fem', 'neutral'];
  const ages: AvatarAgeGroup[] = ['young', 'adult', 'middle', 'elder'];
  for (const age of ages) {
    for (const gender of genders) {
      const buf = baseHead(gender, age, hexToColor('#e0ac84'));
      savePng(`base/${age}_${gender}_01.png`, buf);
    }
  }
}

function generateSkinToneAssets(): void {
  for (const [name, hex] of Object.entries(skinTones)) {
    const buf = createBuffer(SIZE, SIZE);
    fillCircle(buf, SIZE, SIZE / 2, 130, 55, hexToColor(hex));
    savePng(`skinTone/${name}_01.png`, buf);
  }
}

function generateEyes(): void {
  const colors: Record<string, string> = {
    brown: '#5c3a21',
    blue: '#3b82f6',
    green: '#22c55e',
    gray: '#6b7280',
  };
  for (const [name, hex] of Object.entries(colors)) {
    const buf = createBuffer(SIZE, SIZE);
    const c = hexToColor(hex);
    fillCircle(buf, SIZE, 108, 125, 6, c);
    fillCircle(buf, SIZE, 148, 125, 6, c);
    savePng(`eyes/${name}_01.png`, buf);
  }
}

function generateMouths(): void {
  const neutral = createBuffer(SIZE, SIZE);
  fillRect(neutral, SIZE, 118, 155, 20, 4, hexToColor('#5c3a21'));
  savePng('mouth/neutral_01.png', neutral);

  const grim = createBuffer(SIZE, SIZE);
  fillRect(grim, SIZE, 116, 155, 8, 3, hexToColor('#5c3a21'));
  fillRect(grim, SIZE, 132, 157, 8, 3, hexToColor('#5c3a21'));
  savePng('mouth/grim_01.png', grim);

  const smirk = createBuffer(SIZE, SIZE);
  fillRect(smirk, SIZE, 118, 155, 22, 3, hexToColor('#5c3a21'));
  savePng('mouth/smirk_01.png', smirk);
}

function generateHair(): void {
  const styles = ['short', 'long', 'braids', 'balding', 'mohawk'];
  for (const style of styles) {
    for (const [colorName, hex] of Object.entries(hairColors)) {
      const buf = createBuffer(SIZE, SIZE);
      const c = hexToColor(hex);
      if (style === 'short') {
        fillCircle(buf, SIZE, SIZE / 2, 90, 60, c);
        clearCenter(buf, SIZE / 2, 110, 50, 40);
      } else if (style === 'long') {
        fillCircle(buf, SIZE, SIZE / 2, 85, 65, c);
        fillRect(buf, SIZE, 85, 120, 86, 90, c);
        clearCenter(buf, SIZE / 2, 110, 50, 40);
      } else if (style === 'braids') {
        fillCircle(buf, SIZE, SIZE / 2, 90, 62, c);
        fillRect(buf, SIZE, 90, 130, 15, 80, c);
        fillRect(buf, SIZE, 151, 130, 15, 80, c);
        clearCenter(buf, SIZE / 2, 110, 50, 40);
      } else if (style === 'balding') {
        fillCircle(buf, SIZE, SIZE / 2, 95, 35, c);
        fillRect(buf, SIZE, 95, 70, 66, 20, c);
      } else if (style === 'mohawk') {
        fillRect(buf, SIZE, 118, 50, 20, 80, c);
      }
      savePng(`hair/${colorName}_${style}_01.png`, buf);
    }
  }
}

function clearCenter(buf: PixelBuffer, cx: number, cy: number, w: number, h: number): void {
  for (let y = cy - h / 2; y < cy + h / 2; y++) {
    for (let x = cx - w / 2; x < cx + w / 2; x++) {
      setPixel(buf, SIZE, x, y, transparent());
    }
  }
}

function generateFacialHair(): void {
  const buf = createBuffer(SIZE, SIZE);
  fillRect(buf, SIZE, 118, 150, 20, 6, hexToColor('#1a1a1a'));
  savePng('facialHair/stubble_01.png', buf);

  const beard = createBuffer(SIZE, SIZE);
  fillRect(beard, SIZE, 108, 150, 40, 25, hexToColor('#1a1a1a'));
  savePng('facialHair/beard_black_01.png', beard);

  const mustache = createBuffer(SIZE, SIZE);
  fillRect(mustache, SIZE, 108, 152, 40, 6, hexToColor('#4a3020'));
  savePng('facialHair/mustache_01.png', mustache);

  const goatee = createBuffer(SIZE, SIZE);
  fillRect(goatee, SIZE, 122, 158, 12, 22, hexToColor('#1a1a1a'));
  savePng('facialHair/goatee_01.png', goatee);
}

function generateMarkings(): void {
  const scarCheek = createBuffer(SIZE, SIZE);
  fillRect(scarCheek, SIZE, 95, 140, 18, 3, hexToColor('#8a4b4b'));
  savePng('markings/scar_cheek_01.png', scarCheek);

  const scarBrow = createBuffer(SIZE, SIZE);
  fillRect(scarBrow, SIZE, 100, 110, 22, 3, hexToColor('#8a4b4b'));
  savePng('markings/scar_brow_01.png', scarBrow);

  const eyepatch = createBuffer(SIZE, SIZE);
  fillRect(eyepatch, SIZE, 98, 118, 20, 18, hexToColor('#1a1a1a'));
  savePng('markings/eyepatch_left_01.png', eyepatch);

  const bruise = createBuffer(SIZE, SIZE);
  fillCircle(bruise, SIZE, 105, 138, 8, hexToColor('#5c2a2a'));
  savePng('markings/bruise_01.png', bruise);

  const wrinkles = createBuffer(SIZE, SIZE);
  fillRect(wrinkles, SIZE, 110, 112, 36, 2, hexToColor('#5c3a21'));
  fillRect(wrinkles, SIZE, 112, 118, 32, 2, hexToColor('#5c3a21'));
  savePng('markings/wrinkles_01.png', wrinkles);

  const warpaint = createBuffer(SIZE, SIZE);
  fillRect(warpaint, SIZE, 95, 120, 8, 18, hexToColor('#1a1a1a'));
  fillRect(warpaint, SIZE, 153, 120, 8, 18, hexToColor('#1a1a1a'));
  savePng('markings/warpaint_black_01.png', warpaint);
}

function generateAccessories(): void {
  const glasses = createBuffer(SIZE, SIZE);
  fillCircle(glasses, SIZE, 108, 125, 10, hexToColor('#1a1a1a'));
  fillCircle(glasses, SIZE, 148, 125, 10, hexToColor('#1a1a1a'));
  fillRect(glasses, SIZE, 118, 124, 20, 2, hexToColor('#1a1a1a'));
  savePng('accessories/glasses_round_01.png', glasses);

  const headband = createBuffer(SIZE, SIZE);
  fillRect(headband, SIZE, 80, 85, 96, 12, hexToColor('#a0301e'));
  savePng('accessories/headband_red_01.png', headband);

  const circlet = createBuffer(SIZE, SIZE);
  fillRect(circlet, SIZE, 80, 88, 96, 6, hexToColor('#d4af37'));
  savePng('accessories/circlet_gold_01.png', circlet);

  const bandana = createBuffer(SIZE, SIZE);
  fillRect(bandana, SIZE, 80, 95, 96, 14, hexToColor('#3b82f6'));
  savePng('accessories/bandana_01.png', bandana);
}

function generateClothing(): void {
  const tunic = createBuffer(SIZE, SIZE);
  fillRect(tunic, SIZE, 70, 180, 116, 76, hexToColor('#3b82f6'));
  savePng('clothing/tunic_blue_01.png', tunic);

  const leather = createBuffer(SIZE, SIZE);
  fillRect(leather, SIZE, 68, 180, 120, 76, hexToColor('#5c3a21'));
  fillRect(leather, SIZE, 100, 180, 56, 76, hexToColor('#3e2716'));
  savePng('clothing/armor_leather_01.png', leather);

  const plate = createBuffer(SIZE, SIZE);
  fillRect(plate, SIZE, 70, 180, 116, 76, hexToColor('#6b7280'));
  fillRect(plate, SIZE, 80, 190, 96, 56, hexToColor('#9ca3af'));
  savePng('clothing/armor_plate_01.png', plate);

  const robe = createBuffer(SIZE, SIZE);
  fillRect(robe, SIZE, 75, 180, 106, 76, hexToColor('#15803d'));
  savePng('clothing/robe_green_01.png', robe);

  const light = createBuffer(SIZE, SIZE);
  fillRect(light, SIZE, 80, 180, 96, 76, hexToColor('#a16207'));
  savePng('clothing/gambeson_01.png', light);

  // Tag variants for style-based selection
  const heavyPlate = createBuffer(SIZE, SIZE);
  fillRect(heavyPlate, SIZE, 65, 180, 126, 76, hexToColor('#374151'));
  fillRect(heavyPlate, SIZE, 90, 185, 76, 66, hexToColor('#6b7280'));
  savePng('clothing/armor_plate_02.png', heavyPlate);

  const lightTunic = createBuffer(SIZE, SIZE);
  fillRect(lightTunic, SIZE, 85, 180, 86, 76, hexToColor('#d97706'));
  savePng('clothing/tunic_orange_01.png', lightTunic);

  const defensiveRobe = createBuffer(SIZE, SIZE);
  fillRect(defensiveRobe, SIZE, 70, 180, 116, 76, hexToColor('#1e3a5f'));
  savePng('clothing/robe_blue_01.png', defensiveRobe);
}

function generateShoulders(): void {
  const bare = createBuffer(SIZE, SIZE);
  fillRect(bare, SIZE, 50, 190, 40, 30, hexToColor('#e0ac84'));
  fillRect(bare, SIZE, 166, 190, 40, 30, hexToColor('#e0ac84'));
  savePng('shoulders/bare_01.png', bare);

  const pauldron = createBuffer(SIZE, SIZE);
  fillRect(pauldron, SIZE, 45, 185, 50, 45, hexToColor('#6b7280'));
  fillRect(pauldron, SIZE, 161, 185, 50, 45, hexToColor('#6b7280'));
  savePng('shoulders/pauldron_steel_01.png', pauldron);

  const cloak = createBuffer(SIZE, SIZE);
  fillRect(cloak, SIZE, 35, 180, 186, 76, hexToColor('#4a3020'));
  savePng('shoulders/cloak_fur_01.png', cloak);

  const spiked = createBuffer(SIZE, SIZE);
  fillRect(spiked, SIZE, 45, 185, 50, 40, hexToColor('#374151'));
  fillRect(spiked, SIZE, 161, 185, 50, 40, hexToColor('#374151'));
  for (let i = 0; i < 4; i++) {
    fillRect(spiked, SIZE, 50 + i * 10, 180, 4, 10, hexToColor('#9ca3af'));
    fillRect(spiked, SIZE, 166 + i * 10, 180, 4, 10, hexToColor('#9ca3af'));
  }
  savePng('shoulders/spiked_pauldron_01.png', spiked);
}

function generateManifest(): void {
  const manifestPath = path.join(OUT_DIR, '..', 'index.json');
  const categories: Record<string, { src: string; category: string; tags: string[] }[]> = {};

  function scan(dir: string, prefix: string): void {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scan(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith('.png')) {
        const category = prefix.split('/')[0] ?? 'unknown';
        const base = entry.name.replace('.png', '');
        const parts = base.split('_');
        const tags = parts.slice(0, -1);
        const src = `/avatars/layers/${prefix}${entry.name}`;
        categories[category] ??= [];
        categories[category].push({ src, category, tags });
      }
    }
  }

  scan(OUT_DIR, '');
  writeFileSync(manifestPath, `${JSON.stringify({ categories }, null, 2)}\n`);
  logger.log(`Wrote avatar manifest with ${Object.keys(categories).length} categories.`);
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  generateBaseAssets();
  generateSkinToneAssets();
  generateEyes();
  generateMouths();
  generateHair();
  generateFacialHair();
  generateMarkings();
  generateAccessories();
  generateClothing();
  generateShoulders();

  generateManifest();
  logger.log('Placeholder avatar assets generated.');
}

main();
