#!/usr/bin/env node
/**
 * Flattens a built page into a single self-contained HTML fragment.
 *
 *   node scripts/inline.mjs dist/style-tile.html out.html
 *
 * Inlines every stylesheet and embeds both woff2 faces as data URIs, then
 * returns just the title and the body content — no doctype, html, head or
 * body wrapper.
 *
 * Used to publish a page somewhere that has no server and blocks external
 * requests. It is a viewing aid, not part of the deploy: the real site is
 * served by Astro with the fonts as separate cacheable files, which is faster.
 */

import fs from 'node:fs';
import path from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/inline.mjs <built.html> <out.html>');
  process.exit(1);
}

const distDir = path.dirname(path.resolve(input));
let html = fs.readFileSync(input, 'utf8');

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Untitled';

/** Read an asset referenced by an absolute site path such as /fonts/x.woff2 */
function readAsset(sitePath) {
  const file = path.join(distDir, sitePath.replace(/^\//, ''));
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

function embedFonts(css) {
  return css.replace(/url\((['"]?)(\/[^)'"]+\.woff2)\1\)/g, (whole, _q, url) => {
    const data = readAsset(url);
    if (!data) {
      console.warn(`  missing font: ${url}`);
      return whole;
    }
    console.log(`  embedded ${url} (${(data.length / 1024).toFixed(1)} kB)`);
    return `url(data:font/woff2;base64,${data.toString('base64')})`;
  });
}

// Collect stylesheets in document order: inline <style> blocks and <link>s.
const parts = [];
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const head = headMatch?.[1] ?? '';

for (const m of head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) parts.push(m[1]);

for (const m of head.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)) {
  const href = m[0].match(/href="([^"]+)"/)?.[1];
  if (!href) continue;
  const data = readAsset(href);
  if (data) {
    console.log(`  inlined ${href} (${(data.length / 1024).toFixed(1)} kB)`);
    parts.push(data.toString('utf8'));
  }
}

const css = embedFonts(parts.join('\n'));

// Body content only. Drop scripts — nothing on this page needs them, and the
// artifact host blocks external requests anyway.
let body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '';
body = body.replace(/<script[\s\S]*?<\/script>/g, '');

fs.writeFileSync(output, `<title>${title}</title>\n<style>\n${css}\n</style>\n${body}\n`);

const size = fs.statSync(output).size;
console.log(`  wrote ${output} (${(size / 1024).toFixed(0)} kB)`);
