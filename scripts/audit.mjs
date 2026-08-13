#!/usr/bin/env node
/**
 * Accessibility and layout audit against the local preview server.
 *
 *   npm run build
 *   npm run preview          # in another terminal
 *   npm run audit            # all known routes
 *   npm run audit -- /costs  # one route
 *
 * Checks, at four viewport widths:
 *   - axe-core against WCAG 2.0/2.1/2.2 A and AA
 *   - horizontal overflow (a page that scrolls sideways fails 1.4.10 Reflow)
 *   - the first tab stop is the skip link, and its focus ring is visible
 *
 * 640px stands in for 1280px at 200% zoom, which is what WCAG 1.4.10 asks for.
 *
 * Exits non-zero if anything fails, so it can gate a deploy.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const WIDTHS = [375, 640, 768, 1440];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const routes = process.argv.slice(2).filter((a) => a.startsWith('/'));
const ROUTES = routes.length > 0 ? routes : ['/style-tile'];

const launch = { args: ['--force-color-profile=srgb'] };
if (!existsSync(chromium.executablePath())) {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  launch.executablePath = readdirSync(root)
    .filter((d) => d.startsWith('chromium-'))
    .map((d) => join(root, d, 'chrome-linux', 'chrome'))
    .find((p) => existsSync(p));
}

const browser = await chromium.launch(launch);
let failures = 0;

for (const route of ROUTES) {
  console.log(`\n${route}`);
  console.log('─'.repeat(60));

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    const overflows = overflow.scroll > overflow.client;

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    const ok = !overflows && results.violations.length === 0;
    if (!ok) failures += 1;

    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${String(width).padStart(4)}px  ` +
        `axe ${results.violations.length} violations / ${results.passes.length} passing` +
        (overflows ? `  · OVERFLOW ${overflow.scroll}px in ${overflow.client}px` : ''),
    );

    for (const v of results.violations) {
      console.log(`          [${v.impact}] ${v.id}: ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`            ${node.html.slice(0, 100)}`);
      }
    }

    await context.close();
  }

  // Keyboard entry point
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      text: el.textContent?.trim().slice(0, 40) ?? '',
      hasOutline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
    };
  });
  const skipOk = first?.text.toLowerCase().includes('skip') && first.hasOutline;
  if (!skipOk) failures += 1;
  console.log(
    `  ${skipOk ? 'PASS' : 'FAIL'}  keyboard  first tab stop: "${first?.text}"` +
      `${first?.hasOutline ? ' with visible focus ring' : ' — NO VISIBLE FOCUS RING'}`,
  );
  await context.close();
}

await browser.close();

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
