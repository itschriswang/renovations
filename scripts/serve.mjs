#!/usr/bin/env node
/**
 * Static file server with gzip, for measuring a build the way a host serves it.
 *
 *   npm run serve:dist
 *
 * `astro preview` is the right tool for checking behaviour; this exists for
 * measurement. Lighthouse's simulated 4G model is transfer-size bound, so
 * serving 74 kB of uncompressed HTML and CSS instead of ~18 kB gzipped moves
 * reported LCP by about 300ms. It also resolves `/contact` to `contact.html`,
 * which is what `trailingSlash: 'never'` produces and what GitHub Pages does.
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';

const ROOT = process.argv[2];
const PORT = Number(process.argv[3] ?? 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = join(ROOT, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  // /contact is both a directory (contact/thank-you.html) and a page
  // (contact.html) under trailingSlash:'never', so the sibling .html has to win
  // when the directory has no index of its own.
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (existsSync(join(file, 'index.html'))) file = join(file, 'index.html');
    else if (existsSync(file + '.html')) file += '.html';
  } else if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
  if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  const ext = extname(file);
  const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream' };
  headers['cache-control'] = file.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=600';
  const gz = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gz) headers['content-encoding'] = 'gzip';
  else headers['content-length'] = statSync(file).size;
  res.writeHead(200, headers);
  const stream = createReadStream(file);
  if (gz) stream.pipe(createGzip()).pipe(res); else stream.pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('serving', ROOT, 'on', PORT));
