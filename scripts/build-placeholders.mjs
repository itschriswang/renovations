#!/usr/bin/env node
/**
 * Generates placeholder images from the table in content/shotlist.md.
 *
 *   npm run shots
 *
 * Every row becomes a flat colour block at the exact aspect ratio the layout
 * needs, labelled with the shot it is waiting for. No stock photography, ever.
 *
 * Output: src/assets/shots/<id>.svg
 *
 * To replace a placeholder with a real photograph, drop the real file into
 * src/assets/shots/ using the same id (carlingford-hero.jpg) and delete the
 * .svg. The build resolves whichever file it finds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTLIST = path.join(ROOT, 'content', 'shotlist.md');
const OUT = path.join(ROOT, 'src', 'assets', 'shots');

/** Aspect ratio -> intrinsic pixel size the layouts are designed around. */
const RATIOS = {
  '21:9': [2560, 1097],
  '16:9': [1920, 1080],
  '3:2': [1800, 1200],
  '4:3': [1600, 1200],
  '1:1': [1400, 1400],
  '4:5': [1200, 1500],
  '1.91:1': [1200, 630],
};

/**
 * Placeholder colours are drawn from the same material palette as the design
 * tokens, so the site reads as coherent even before a single photograph lands.
 */
const MATERIALS = {
  brick: '#8A4B33',
  brickLight: '#A2664A',
  render: '#E8E1D6',
  renderWarm: '#D9CFBE',
  spottedGum: '#A97F4E',
  gumDark: '#6E5233',
  monument: '#33363A',
  concrete: '#B4AEA4',
};

/** Which material a shot gets, by what kind of shot it is. */
function materialFor(id) {
  if (id.includes('hero-sequence')) return MATERIALS.monument;
  if (id.includes('-before-')) return MATERIALS.concrete;
  if (id.includes('-after-')) return MATERIALS.render;
  if (id.includes('constraint')) return MATERIALS.gumDark;
  if (id.includes('detail')) return MATERIALS.spottedGum;
  if (id.includes('process')) return MATERIALS.monument;
  if (id.startsWith('suburb-')) return MATERIALS.renderWarm;
  if (id.startsWith('team-')) return MATERIALS.brickLight;
  if (id.includes('hero')) return MATERIALS.brick;
  if (id.includes('opener') || id.includes('cover')) return MATERIALS.concrete;
  return MATERIALS.renderWarm;
}

const INK = '#1B1917';
const PAPER = '#F4EFE7';

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Pick whichever of ink/paper has more contrast against the block. */
function inkFor(bg) {
  return luminance(bg) > 0.42 ? INK : PAPER;
}

function mix(a, b, t) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (ch) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch],
  );
}

/** Greedy wrap using an approximate average glyph width. */
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svg({ id, ratio, w, h, brief, frame, frames }) {
  const base = materialFor(id);
  // The hero sequence interpolates from late afternoon to dusk so the
  // scroll-driven sequencing is visibly working before any photograph exists.
  const isSequence = frames > 1;
  const t = isSequence ? (frame - 1) / (frames - 1) : 0;
  const bg = isSequence ? mix('#C08A5A', '#232A33', t) : base;
  const ink = inkFor(bg);

  const pad = Math.round(Math.min(w, h) * 0.06);
  const titleSize = Math.round(Math.min(w, h) * 0.052);
  const metaSize = Math.round(Math.min(w, h) * 0.028);
  const maxChars = Math.floor((w - pad * 2) / (titleSize * 0.5));
  const lines = wrap(brief, maxChars).slice(0, 4);

  // A lit window that brightens as the sequence darkens.
  const window_ =
    isSequence && t > 0.25
      ? `<rect x="${Math.round(w * 0.52)}" y="${Math.round(h * 0.42)}" width="${Math.round(
          w * 0.3,
        )}" height="${Math.round(h * 0.34)}" fill="#F0C98A" opacity="${(t * 0.85).toFixed(2)}"/>`
      : '';

  const label = isSequence ? `${id} · frame ${frame} of ${frames}` : id;

  const body = lines
    .map(
      (line, i) =>
        `<text x="${pad}" y="${
          Math.round(h / 2) + i * Math.round(titleSize * 1.25) - Math.round(((lines.length - 1) * titleSize * 1.25) / 2)
        }" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" fill="${ink}">${escapeXml(
          line,
        )}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(
    `Placeholder awaiting photography: ${brief}`,
  )}">
<rect width="${w}" height="${h}" fill="${bg}"/>
${window_}
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${ink}" stroke-opacity="0.25"/>
<text x="${pad}" y="${pad + metaSize}" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="${metaSize}" fill="${ink}" opacity="0.75">${escapeXml(
    label,
  )}</text>
${body}
<text x="${pad}" y="${h - pad}" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="${metaSize}" fill="${ink}" opacity="0.75">${ratio} · ${w}×${h} · awaiting photography</text>
</svg>
`;
}

function parseShotlist(md) {
  const rows = [];
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.length < 7) continue;
    const [id, ratio, frames, , brief] = cells;
    if (id === 'ID' || /^-+$/.test(id)) continue;
    if (!RATIOS[ratio]) {
      console.warn(`  skip    ${id}: unknown ratio "${ratio}"`);
      continue;
    }
    rows.push({ id, ratio, frames: Number(frames) || 1, brief });
  }
  return rows;
}

function main() {
  const rows = parseShotlist(fs.readFileSync(SHOTLIST, 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });

  // Only ever remove placeholders we generated. Real photography dropped into
  // this directory is never touched.
  for (const file of fs.readdirSync(OUT)) {
    if (file.endsWith('.svg')) fs.unlinkSync(path.join(OUT, file));
  }

  const real = new Set(
    fs
      .readdirSync(OUT)
      .filter((f) => !f.endsWith('.svg'))
      .map((f) => path.parse(f).name),
  );

  let written = 0;
  let skipped = 0;
  for (const row of rows) {
    const [w, h] = RATIOS[row.ratio];
    for (let frame = 1; frame <= row.frames; frame += 1) {
      const id = row.frames > 1 ? `${row.id}-${String(frame).padStart(2, '0')}` : row.id;
      if (real.has(id)) {
        skipped += 1;
        continue;
      }
      fs.writeFileSync(
        path.join(OUT, `${id}.svg`),
        svg({ ...row, id, w, h, frame, frames: row.frames }),
      );
      written += 1;
    }
  }

  console.log(`  ${rows.length} rows in shotlist.md`);
  console.log(`  ${written} placeholders written to src/assets/shots/`);
  if (skipped) console.log(`  ${skipped} skipped — real photography already in place`);
}

main();
