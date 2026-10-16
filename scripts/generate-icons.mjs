// @ts-nocheck
/**
 * مولّد الأيقونات — يعمل بدون أي حزم خارجية (يستخدم zlib المدمجة في Node).
 * يرسم علامة هندسية إسلامية بسيطة (سداسي + دائرة) خضراء/ذهبية، ويصدّرها PNG.
 *
 * التشغيل:  node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "icons");

const GREEN = [0x1f, 0x5d, 0x4c];
const GREEN_DARK = [0x15, 0x3f, 0x34];
const GOLD = [0xc9, 0xa2, 0x4b];
const IVORY = [0xfb, 0xf8, 0xf1];

/* ------------------------------- رسم أساسي ------------------------------- */

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }
  blend(x, y, [r, g, b], a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 4;
    const inv = 1 - a;
    this.data[i] = r * a + this.data[i] * inv;
    this.data[i + 1] = g * a + this.data[i + 1] * inv;
    this.data[i + 2] = b * a + this.data[i + 2] * inv;
    this.data[i + 3] = Math.min(255, a * 255 + this.data[i + 3] * inv);
  }
  fillAll(color) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.blend(x, y, color, 1);
  }
  fillRect(x0, y0, x1, y1, color) {
    for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) this.blend(x, y, color, 1);
  }
  fillCircle(cx, cy, r, color) {
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.blend(x, y, color, 1);
      }
  }
  fillPolygon(pts, color) {
    const ys = pts.map((p) => p[1]);
    const xs = pts.map((p) => p[0]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    const minX = Math.floor(Math.min(...xs));
    const maxX = Math.ceil(Math.max(...xs));
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) if (pointInPolygon(x + 0.5, y + 0.5, pts)) this.blend(x, y, color, 1);
  }
  strokePolygon(pts, width, color) {
    const ys = pts.map((p) => p[1]);
    const xs = pts.map((p) => p[0]);
    const minY = Math.floor(Math.min(...ys) - width);
    const maxY = Math.ceil(Math.max(...ys) + width);
    const minX = Math.floor(Math.min(...xs) - width);
    const maxX = Math.ceil(Math.max(...xs) + width);
    const half = width / 2;
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const d = distToPolygon(x + 0.5, y + 0.5, pts);
        if (d <= half) this.blend(x, y, color, 1);
      }
  }
  strokeCircle(cx, cy, r, width, color) {
    const outer = r + width / 2;
    const inner = r - width / 2;
    for (let y = Math.floor(cy - outer); y <= cy + outer; y++)
      for (let x = Math.floor(cx - outer); x <= cx + outer; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d >= inner && d <= outer) this.blend(x, y, color, 1);
      }
  }
  /** اختزال بصري (box filter) للحصول على حواف ناعمة. */
  downsample(factor) {
    const w = this.w / factor;
    const h = this.h / factor;
    const out = new Canvas(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let sy = 0; sy < factor; sy++)
          for (let sx = 0; sx < factor; sx++) {
            const i = ((y * factor + sy) * this.w + (x * factor + sx)) * 4;
            r += this.data[i];
            g += this.data[i + 1];
            b += this.data[i + 2];
            a += this.data[i + 3];
          }
        const n = factor * factor;
        const oi = (y * w + x) * 4;
        out.data[oi] = r / n;
        out.data[oi + 1] = g / n;
        out.data[oi + 2] = b / n;
        out.data[oi + 3] = a / n;
      }
    return out;
  }
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distToPolygon(px, py, pts) {
  let min = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    min = Math.min(min, distToSegment(px, py, pts[j][0], pts[j][1], pts[i][0], pts[i][1]));
  }
  return min;
}

/* ------------------------------- ترميز PNG ------------------------------- */

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(canvas) {
  const { w, h, data } = canvas;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter type 0
    for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = data[y * w * 4 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------ رسم العلامة ------------------------------ */

function hexagon(cx, cy, r) {
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (90 + 60 * k);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** يرسم أيقونة مربّعة كاملة (خلفية ممتلئة لتناسب maskable). */
function drawIcon(size, ss = 4) {
  const S = size * ss;
  const c = new Canvas(S, S);
  const cx = S / 2;
  const cy = S / 2;

  // خلفية متدرّجة يدويًا: أخضر داكن في الأعلى إلى أخضر المصدر
  for (let y = 0; y < S; y++) {
    const t = y / S;
    const col = [
      Math.round(GREEN_DARK[0] * (1 - t) + GREEN[0] * t),
      Math.round(GREEN_DARK[1] * (1 - t) + GREEN[1] * t),
      Math.round(GREEN_DARK[2] * (1 - t) + GREEN[2] * t),
    ];
    c.fillRect(0, y, S, y + 1, col);
  }

  const outerR = S * 0.33;
  const innerR = S * 0.21;
  const stroke = S * 0.022;

  c.strokePolygon(hexagon(cx, cy, outerR), stroke, GOLD);
  c.strokePolygon(hexagon(cx, cy, innerR), stroke * 0.85, GOLD);
  c.fillCircle(cx, cy, S * 0.055, GOLD);
  // قوس الهلال داخل السداسي الداخلي
  c.fillCircle(cx, cy, S * 0.03, IVORY);

  return c.downsample(ss);
}

/** صورة معاينة اجتماعية (1200×630) بنمط هندسي متكرر. */
function drawSocial(width, height, ss = 2) {
  const S = { w: width * ss, h: height * ss };
  const c = new Canvas(S.w, S.h);

  for (let y = 0; y < S.h; y++) {
    const t = y / S.h;
    const col = [
      Math.round(GREEN_DARK[0] * (1 - t) + GREEN[0] * t),
      Math.round(GREEN_DARK[1] * (1 - t) + GREEN[1] * t),
      Math.round(GREEN_DARK[2] * (1 - t) + GREEN[2] * t),
    ];
    c.fillRect(0, y, S.w, y + 1, col);
  }

  // نمط سداسيات خفيف
  const step = S.h / 4;
  for (let gy = -1; gy < 6; gy++) {
    for (let gx = -1; gx < 12; gx++) {
      const ox = gx * step * 1.05 + (gy % 2 === 0 ? 0 : step * 0.52);
      const oy = gy * step * 0.9;
      c.strokePolygon(hexagon(ox, oy, step * 0.34), Math.max(1, S.h * 0.004), [0x2e, 0x7d, 0x68]);
    }
  }

  // علامة مركزية كبيرة
  const cx = S.w / 2;
  const cy = S.h / 2;
  const outerR = S.h * 0.28;
  c.strokePolygon(hexagon(cx, cy, outerR), S.h * 0.018, GOLD);
  c.strokePolygon(hexagon(cx, cy, outerR * 0.64), S.h * 0.015, GOLD);
  c.fillCircle(cx, cy, S.h * 0.05, GOLD);
  c.fillCircle(cx, cy, S.h * 0.026, IVORY);

  return c.downsample(ss);
}

/* --------------------------------- التنفيذ -------------------------------- */

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [192, 512]) {
  const png = encodePNG(drawIcon(size));
  writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png`);
}

const apple = encodePNG(drawIcon(180));
writeFileSync(resolve(OUT_DIR, "apple-touch-icon.png"), apple);
console.log("✓ apple-touch-icon.png");

const social = encodePNG(drawSocial(1200, 630));
writeFileSync(resolve(OUT_DIR, "social-preview.png"), social);
console.log("✓ social-preview.png");
