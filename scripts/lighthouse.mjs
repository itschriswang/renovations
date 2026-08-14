#!/usr/bin/env node
/**
 * Lighthouse sweep against a locally served build.
 *
 *   npm run build:static
 *   npm run serve:dist            # in another terminal
 *   npm run lighthouse -- / /costs /estimator
 *
 * Serve the build with `npm run serve:dist` rather than a bare file server.
 * Lighthouse's simulated 4G model is transfer-size bound, so an uncompressed
 * server reports an LCP roughly 300ms worse than any real host would — that is
 * a measurement of the test rig, not of the site.
 *
 * Prints one row per route and exits after reporting anything under budget:
 * 95+ in all four categories, LCP under 1.8s, CLS under 0.05.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';

const OUT = process.argv[2];
const ROUTES = process.argv.slice(3);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--remote-debugging-port=9222'],
});
const rows = [];
for (const route of ROUTES) {
  const url = `http://127.0.0.1:4321${route}`;
  const r = await lighthouse(url, { port: 9222, output: 'json', logLevel: 'error' });
  const c = r.lhr.categories;
  const a = r.lhr.audits;
  const name = route.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '_') || 'home';
  writeFileSync(`${OUT}/${name}.json`, r.report);
  rows.push({
    route,
    perf: Math.round(c.performance.score * 100),
    a11y: Math.round(c.accessibility.score * 100),
    bp: Math.round(c['best-practices'].score * 100),
    seo: Math.round(c.seo.score * 100),
    lcp: ((a['largest-contentful-paint']?.numericValue ?? 0) / 1000).toFixed(2),
    cls: (a['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3),
    tbt: Math.round(a['total-blocking-time']?.numericValue ?? 0),
  });
}
await browser.close();
const pad = (v, n) => String(v).padStart(n);
console.log('route'.padEnd(38), 'perf a11y  bp  seo    LCP    CLS   TBT');
for (const r of rows)
  console.log(
    r.route.padEnd(38),
    pad(r.perf, 4), pad(r.a11y, 4), pad(r.bp, 3), pad(r.seo, 4),
    pad(r.lcp + 's', 6), pad(r.cls, 6), pad(r.tbt + 'ms', 6),
  );
const bad = rows.filter((r) => r.perf < 95 || r.a11y < 95 || r.bp < 95 || r.seo < 95 || +r.lcp > 1.8 || +r.cls > 0.05);
console.log(bad.length ? `\n${bad.length} route(s) under budget` : '\nAll routes within budget.');
