#!/usr/bin/env node
/**
 * Screenshots a page from the local preview server.
 *
 *   npm run build && npm run preview   # in one terminal
 *   node scripts/screenshot.mjs /style-tile out.png [--width 1440]
 *
 * Used for design review and for the accessibility and performance passes.
 * Not part of the production build.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [route = '/', out = 'screenshot.png', ...rest] = process.argv.slice(2);
const widthArg = rest.indexOf('--width');
const width = widthArg >= 0 ? Number(rest[widthArg + 1]) : 1440;
const base = process.env.PREVIEW_URL ?? 'http://localhost:4321';

// Use the browser that is already on the machine rather than downloading one.
// The npm package's expected build number may not match what is installed, so
// fall back to whichever chromium is actually present.
const launch = { args: ['--force-color-profile=srgb'] };
if (!existsSync(chromium.executablePath())) {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  const found = readdirSync(root)
    .filter((d) => d.startsWith('chromium-'))
    .map((d) => join(root, d, 'chrome-linux', 'chrome'))
    .find((p) => existsSync(p));
  if (!found) throw new Error(`No chromium found under ${root}`);
  launch.executablePath = found;
}

const browser = await chromium.launch(launch);
const page = await browser.newPage({
  viewport: { width, height: 1000 },
  deviceScaleFactor: 2,
});

await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, fullPage: true });

const computed = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  const heading = document.querySelector('h1');
  const h = heading ? getComputedStyle(heading) : null;
  return {
    bodyFamily: body.fontFamily.split(',')[0]?.replace(/"/g, ''),
    bodySize: body.fontSize,
    bodyBackground: body.backgroundColor,
    headingFamily: h?.fontFamily.split(',')[0]?.replace(/"/g, ''),
    headingSize: h?.fontSize,
    loadedFonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  };
});

console.log(`${route} -> ${out} (${width}px)`);
console.log(JSON.stringify(computed, null, 2));

await browser.close();
