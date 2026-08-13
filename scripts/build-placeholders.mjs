#!/usr/bin/env node
/**
 * Generates temporary images from the table in content/shotlist.md.
 *
 *   npm run shots
 *
 * These are NOT stock photography and NOT photographs of anyone's house. Each
 * one is a procedurally drawn scene — sky, ground, building mass, window
 * openings, light — composed from the site's own material palette at the exact
 * aspect ratio the layout needs, and labelled with the shot it is waiting for.
 *
 * The reason they are drawn rather than sourced: a real photograph of somebody
 * else's house on a builder's website reads as a claim about work they did.
 * That is a misrepresentation risk even as a placeholder, and it is exactly
 * what the "no stock photography" rule in the brief exists to prevent. These
 * carry the visual weight of a photograph so the layouts can be judged, while
 * remaining obviously not photographs at any real size.
 *
 * Output: src/assets/shots/<id>.svg
 *
 * To replace one with a real photograph, drop the real file into
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

/** Materials, straight from the design tokens. */
const M = {
  skyHigh: '#B9C6CC',
  skyLow: '#DCD8CC',
  duskHigh: '#3A4048',
  duskLow: '#8C6A4A',
  brick: '#8A4B33',
  brickLit: '#A2664A',
  brickShade: '#6B3826',
  render: '#E4DCCE',
  renderLit: '#F1EADD',
  renderShade: '#C6BCA9',
  roof: '#4F4B47',
  roofLit: '#5E5954',
  glass: '#2F3A3D',
  glassLit: '#F0C98A',
  lawn: '#7C8060',
  lawnDry: '#98936E',
  concrete: '#B4AEA4',
  timber: '#A97F4E',
  timberDark: '#7C5C38',
  soil: '#6E5233',
  monument: '#33363A',
  ink: '#1B1917',
  paper: '#F4EFE7',
  marking: '#D2662E',
};

/* ------------------------------------------------------------------ utils */

/** Deterministic PRNG so a given shot id always draws the same scene. */
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(a, b, t) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x, y) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

/** Pull colour toward grey. Used to make "before" frames read as un-renovated. */
function desaturate(hex, amount) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  const c = (v) =>
    Math.round(v + (grey - v) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (ch) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch],
  );
}

const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(w)}" height="${Math.round(
    h,
  )}" fill="${fill}"${extra}/>`;

const poly = (points, fill) =>
  `<polygon points="${points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(' ')}" fill="${fill}"/>`;

/* ----------------------------------------------------------------- scenes */

/**
 * A before/after pair has to be the SAME view — that is the entire point of
 * the comparison. Both halves of a pair therefore seed from one key, so they
 * draw identical geometry and differ only in tone. It also means the
 * comparison slider can be built and judged against these.
 */
function pairKey(id) {
  return id.replace(/-(before|after)-/, '-pair-');
}

/**
 * Which scene to draw. Chosen from the shot brief rather than the id, because
 * the brief is where the actual subject is described.
 */
function sceneFor(id, brief) {
  const t = `${id} ${brief}`.toLowerCase();
  if (t.includes('sequence')) return 'dusk';
  if (/\bstreet\b|footpath|suburb-|lined with/.test(t)) return 'street';
  if (/director|team|portrait|owners in their/.test(t)) return 'portrait';
  if (/sewer|footing|trench|spray paint|set-out|excavat|slab|marked out|inspection pit/.test(t))
    return 'ground';
  if (/kitchen|living|dining|hall|ceiling|bathroom|bench|stair|interior|wall oven|eaves/.test(t))
    return 'interior';
  if (/elevation|garden|roof|scaffold|extension|house|workshop|lot|block/.test(t))
    return 'exterior';
  return 'abstract';
}

/** Tone: "before" frames are duller and flatter, "after" brighter and warmer. */
function toneFor(id) {
  if (id.includes('-before-')) return { desat: 0.42, light: -0.1 };
  if (id.includes('-after-')) return { desat: 0, light: 0.08 };
  return { desat: 0.08, light: 0 };
}

function drawExterior(w, h, rnd, tone, dusk = false, t = 0) {
  const g = [];
  const horizon = h * (0.6 + rnd() * 0.08);
  const skyHi = dusk ? mix(M.skyHigh, M.duskHigh, t) : M.skyHigh;
  const skyLo = dusk ? mix(M.skyLow, M.duskLow, t) : M.skyLow;

  g.push(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${desaturate(skyHi, tone.desat)}"/>
    <stop offset="1" stop-color="${desaturate(skyLo, tone.desat)}"/>
  </linearGradient></defs>`);
  g.push(rect(0, 0, w, horizon, 'url(#sky)'));

  // ground
  const ground = dusk ? mix(M.lawn, '#2A2E26', t) : M.lawn;
  g.push(rect(0, horizon, w, h - horizon, desaturate(ground, tone.desat)));
  g.push(rect(0, horizon, w, (h - horizon) * 0.14, desaturate(M.lawnDry, tone.desat), ' opacity="0.5"'));

  // house mass
  const hw = w * (0.52 + rnd() * 0.2);
  const hx = w * (0.06 + rnd() * 0.14);
  const wallTop = horizon - h * (0.24 + rnd() * 0.12);
  const wallH = horizon - wallTop;
  const isBrick = rnd() > 0.35;
  let wall = isBrick ? M.brick : M.render;
  let wallLit = isBrick ? M.brickLit : M.renderLit;
  let wallShade = isBrick ? M.brickShade : M.renderShade;
  if (dusk) {
    wall = mix(wall, M.monument, t * 0.8);
    wallLit = mix(wallLit, M.monument, t * 0.75);
    wallShade = mix(wallShade, '#1B1D1F', t * 0.85);
  }

  // roof
  const eave = wallTop;
  const ridge = eave - h * (0.08 + rnd() * 0.07);
  const roofCol = dusk ? mix(M.roof, '#232629', t) : M.roof;
  g.push(
    poly(
      [
        [hx - w * 0.02, eave],
        [hx + hw * 0.5, ridge],
        [hx + hw + w * 0.02, eave],
      ],
      desaturate(roofCol, tone.desat),
    ),
  );

  // main face and a return wall in shadow
  g.push(rect(hx, eave, hw, wallH, desaturate(wallLit, tone.desat)));
  const returnW = w * (0.1 + rnd() * 0.08);
  g.push(rect(hx + hw, eave + h * 0.03, returnW, wallH - h * 0.03, desaturate(wallShade, tone.desat)));

  // windows
  const lit = dusk && t > 0.3;
  const winCount = 2 + Math.floor(rnd() * 3);
  const winW = hw / (winCount * 2.1);
  const winH = wallH * 0.42;
  for (let i = 0; i < winCount; i += 1) {
    const wx = hx + hw * 0.1 + i * (hw * 0.8) / winCount;
    const wy = eave + wallH * 0.24;
    const col = lit ? M.glassLit : dusk ? mix(M.glass, '#14181A', t) : M.glass;
    g.push(rect(wx, wy, winW, winH, desaturate(col, lit ? 0 : tone.desat)));
    if (lit) g.push(rect(wx, wy + winH, winW * 1.6, h * 0.03, M.glassLit, ' opacity="0.18"'));
  }

  // foreground shadow band, gives the frame depth
  g.push(rect(0, h * 0.9, w, h * 0.1, M.ink, ' opacity="0.1"'));
  return g.join('\n');
}

function drawInterior(w, h, rnd, tone) {
  const g = [];
  const dull = tone.desat > 0.2;
  // One-point perspective: a back wall inset from the frame, with ceiling,
  // floor and side walls running to it. Enough depth to read as a room.
  const ceilY = h * (0.1 + rnd() * 0.05);
  const floorY = h * (0.7 + rnd() * 0.05);
  const inset = w * (0.16 + rnd() * 0.08);
  const backTop = h * (0.2 + rnd() * 0.04);
  const backBot = h * (0.62 + rnd() * 0.04);

  const wall = desaturate(dull ? M.renderShade : M.render, tone.desat);
  const wallLit = desaturate(dull ? M.render : M.renderLit, tone.desat);

  // ceiling
  g.push(rect(0, 0, w, floorY, wall));
  g.push(poly([[0, 0], [w, 0], [w - inset, backTop], [inset, backTop]], desaturate(dull ? M.renderShade : M.render, tone.desat + 0.1)));
  // side walls, the left one in shadow
  g.push(poly([[0, 0], [inset, backTop], [inset, backBot], [0, h]], desaturate(M.renderShade, tone.desat + 0.12)));
  g.push(poly([[w, 0], [w - inset, backTop], [w - inset, backBot], [w, h]], wallLit));
  // back wall
  g.push(rect(inset, backTop, w - inset * 2, backBot - backTop, wall));

  // window on the back wall, with light
  const ww = (w - inset * 2) * (0.34 + rnd() * 0.2);
  const wx = inset + (w - inset * 2) * (0.1 + rnd() * 0.45);
  const wy = backTop + (backBot - backTop) * 0.16;
  const wh = (backBot - backTop) * 0.52;
  g.push(rect(wx, wy, ww, wh, dull ? '#C8CEC9' : '#F2ECDF'));
  g.push(rect(wx, wy, ww, wh * 0.34, '#FFFFFF', ' opacity="0.4"'));
  g.push(
    `<rect x="${Math.round(wx)}" y="${Math.round(wy)}" width="${Math.round(ww)}" height="${Math.round(wh)}" fill="none" stroke="${desaturate(M.monument, tone.desat)}" stroke-width="${Math.max(2, Math.round(w * 0.004))}"/>`,
  );

  // floor, and the light falling across it
  g.push(poly([[0, h], [inset, backBot], [w - inset, backBot], [w, h]], desaturate(dull ? M.concrete : M.timber, tone.desat)));
  g.push(
    poly([[wx, backBot], [wx + ww, backBot], [wx + ww * 1.6, h], [wx - ww * 0.4, h]], '#FFFFFF').replace(
      'fill="#FFFFFF"',
      `fill="#FFFFFF" opacity="${dull ? 0.05 : 0.13}"`,
    ),
  );

  // bench or cabinetry against the left wall
  const bw = w * (0.26 + rnd() * 0.14);
  const bh = h * (0.14 + rnd() * 0.05);
  const bx = inset * 0.6;
  g.push(rect(bx, backBot - bh, bw, bh + h * 0.06, desaturate(dull ? M.timberDark : M.monument, tone.desat)));
  g.push(rect(bx, backBot - bh, bw, h * 0.016, desaturate(dull ? M.renderShade : M.concrete, tone.desat)));

  // the wall the whole job is usually about, only present in the "before"
  if (dull) {
    const dx = w * (0.56 + rnd() * 0.1);
    g.push(rect(dx, backTop, w * 0.16, backBot - backTop, desaturate(M.renderShade, tone.desat + 0.15)));
  }

  g.push(rect(0, 0, w, h * 0.05, M.ink, ' opacity="0.06"'));
  return g.join('\n');
}

function drawGround(w, h, rnd, tone) {
  const g = [];
  g.push(rect(0, 0, w, h, desaturate(M.soil, tone.desat)));
  g.push(rect(0, 0, w, h * 0.3, desaturate(M.lawnDry, tone.desat)));
  g.push(rect(0, h * 0.28, w, h * 0.06, M.ink, ' opacity="0.12"'));

  // spoil / disturbed ground
  for (let i = 0; i < 5; i += 1) {
    const y = h * (0.4 + rnd() * 0.5);
    g.push(rect(w * rnd() * 0.8, y, w * (0.1 + rnd() * 0.25), h * 0.03, M.ink, ' opacity="0.08"'));
  }
  // the marking line — the thing these shots are always about
  const y1 = h * (0.42 + rnd() * 0.1);
  const y2 = h * (0.72 + rnd() * 0.1);
  g.push(
    `<line x1="0" y1="${Math.round(y1)}" x2="${w}" y2="${Math.round(y2)}" stroke="${M.marking}" stroke-width="${Math.round(h * 0.018)}" stroke-dasharray="${Math.round(w * 0.05)} ${Math.round(w * 0.03)}"/>`,
  );
  return g.join('\n');
}

function drawStreet(w, h, rnd, tone) {
  const g = [];
  const horizon = h * 0.62;
  g.push(`<defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${desaturate(M.skyHigh, tone.desat)}"/>
    <stop offset="1" stop-color="${desaturate(M.skyLow, tone.desat)}"/>
  </linearGradient></defs>`);
  g.push(rect(0, 0, w, horizon, 'url(#sky2)'));
  g.push(rect(0, horizon, w, h - horizon, desaturate(M.concrete, tone.desat)));
  g.push(rect(0, horizon + (h - horizon) * 0.45, w, (h - horizon) * 0.55, desaturate(M.monument, tone.desat + 0.2)));

  // houses receding along the street
  let x = -w * 0.05;
  let i = 0;
  while (x < w) {
    const hw = w * (0.16 + rnd() * 0.1);
    const scale = 1 - i * 0.06;
    const top = horizon - h * (0.2 + rnd() * 0.08) * Math.max(scale, 0.4);
    const brick = rnd() > 0.4;
    g.push(poly([[x, top], [x + hw * 0.5, top - h * 0.06], [x + hw, top]], desaturate(M.roof, tone.desat)));
    g.push(rect(x, top, hw, horizon - top, desaturate(brick ? M.brickLit : M.render, tone.desat)));
    g.push(rect(x + hw * 0.2, top + (horizon - top) * 0.3, hw * 0.22, (horizon - top) * 0.3, desaturate(M.glass, tone.desat)));
    x += hw + w * 0.02;
    i += 1;
  }
  g.push(rect(0, h * 0.92, w, h * 0.08, M.ink, ' opacity="0.1"'));
  return g.join('\n');
}

function drawPortrait(w, h, rnd, tone) {
  const g = [];
  g.push(rect(0, 0, w, h, desaturate(M.renderShade, tone.desat)));
  g.push(rect(0, 0, w * 0.4, h, desaturate(M.render, tone.desat)));
  // figure mass
  const cx = w * (0.44 + rnd() * 0.12);
  const headR = w * 0.11;
  const headY = h * 0.3;
  g.push(rect(cx - w * 0.2, headY + headR * 1.3, w * 0.4, h, desaturate(M.monument, tone.desat)));
  g.push(
    `<circle cx="${Math.round(cx)}" cy="${Math.round(headY)}" r="${Math.round(headR)}" fill="${desaturate(M.timber, tone.desat)}"/>`,
  );
  g.push(rect(0, h * 0.88, w, h * 0.12, M.ink, ' opacity="0.1"'));
  return g.join('\n');
}

function drawAbstract(w, h, rnd, tone) {
  const g = [];
  const base = [M.render, M.concrete, M.timber, M.brickLit][Math.floor(rnd() * 4)];
  g.push(rect(0, 0, w, h, desaturate(base, tone.desat)));
  const bands = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < bands; i += 1) {
    const y = (h / bands) * i + h * rnd() * 0.08;
    g.push(rect(0, y, w, h / bands, i % 2 ? M.ink : M.paper, ` opacity="${(0.04 + rnd() * 0.07).toFixed(2)}"`));
  }
  g.push(rect(w * 0.08, h * 0.18, w * 0.3, h * 0.64, desaturate(M.monument, tone.desat), ' opacity="0.55"'));
  return g.join('\n');
}

/* -------------------------------------------------------------- composite */

function svg({ id, ratio, w, h, brief, frame, frames, sceneBrief }) {
  // Seed from the pair key so a before and an after draw the same view.
  const rnd = seeded(pairKey(id));
  const tone = toneFor(id);
  const isSequence = frames > 1;
  const t = isSequence ? (frame - 1) / (frames - 1) : 0;
  const scene = sceneFor(id, sceneBrief ?? brief);

  let body;
  if (scene === 'dusk') body = drawExterior(w, h, rnd, tone, true, t);
  else if (scene === 'interior') body = drawInterior(w, h, rnd, tone);
  else if (scene === 'ground') body = drawGround(w, h, rnd, tone);
  else if (scene === 'street') body = drawStreet(w, h, rnd, tone);
  else if (scene === 'portrait') body = drawPortrait(w, h, rnd, tone);
  else if (scene === 'exterior') body = drawExterior(w, h, rnd, tone);
  else body = drawAbstract(w, h, rnd, tone);

  // Caption bar. These have to stay unmistakably placeholders.
  const barH = Math.max(Math.round(h * 0.11), 44);
  const meta = Math.round(Math.min(w, h) * 0.026);
  const label = isSequence ? `${id} · frame ${frame} of ${frames}` : id;
  const shortBrief = brief.length > 92 ? `${brief.slice(0, 92)}…` : brief;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(
    `Temporary placeholder awaiting photography: ${brief}`,
  )}">
${body}
<rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="${M.ink}" opacity="0.88"/>
<text x="${Math.round(w * 0.02)}" y="${h - barH + meta * 1.5}" font-family="ui-monospace, Menlo, monospace" font-size="${meta}" fill="${M.paper}">${escapeXml(label)} · ${ratio} · ${w}×${h}</text>
<text x="${Math.round(w * 0.02)}" y="${h - barH + meta * 3}" font-family="ui-monospace, Menlo, monospace" font-size="${Math.round(meta * 0.85)}" fill="${M.paper}" opacity="0.72">AWAITING PHOTOGRAPHY — ${escapeXml(shortBrief)}</text>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${M.ink}" stroke-opacity="0.2"/>
</svg>
`;
}

/* ------------------------------------------------------------------- main */

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

  // An "after" brief only ever says "identical position, lens and time of day
  // to before-NN", which carries no subject at all. Resolve the scene from the
  // matching "before" brief so both halves of a pair draw the same view.
  const briefById = new Map(rows.map((r) => [r.id, r.brief]));
  const sceneBriefFor = (row) => {
    if (!row.id.includes('-after-')) return row.brief;
    const before = briefById.get(row.id.replace('-after-', '-before-'));
    return before ? `${before} ${row.brief}` : row.brief;
  };

  let written = 0;
  let skipped = 0;
  let bytes = 0;
  const scenes = {};

  for (const row of rows) {
    const [w, h] = RATIOS[row.ratio];
    const sceneBrief = sceneBriefFor(row);
    for (let frame = 1; frame <= row.frames; frame += 1) {
      const id = row.frames > 1 ? `${row.id}-${String(frame).padStart(2, '0')}` : row.id;
      if (real.has(id)) {
        skipped += 1;
        continue;
      }
      const out = svg({ ...row, id, w, h, frame, frames: row.frames, sceneBrief });
      fs.writeFileSync(path.join(OUT, `${id}.svg`), out);
      const scene = sceneFor(id, sceneBrief);
      scenes[scene] = (scenes[scene] ?? 0) + 1;
      bytes += out.length;
      written += 1;
    }
  }

  console.log(`  ${rows.length} rows in shotlist.md`);
  console.log(`  ${written} temporary images written to src/assets/shots/ (${(bytes / 1024).toFixed(0)} kB total)`);
  console.log(`  scenes: ${Object.entries(scenes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  if (skipped) console.log(`  ${skipped} skipped — real photography already in place`);
}

main();
