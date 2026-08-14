// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { parse } from 'yaml';

// The canonical URL lives in content/business.yaml with everything else, so
// there is exactly one place to change it.
const business = parse(fs.readFileSync('./content/business.yaml', 'utf8'));

// A host can override the URL and mount the site in a subdirectory. GitHub
// Pages serves a project site from /<repo>/ rather than a domain root, so the
// preview deployment sets these; the real deployment sets neither and the
// values from business.yaml apply unchanged.
const site = process.env.SITE_URL ?? business.site.url;
const base = process.env.BASE_PATH ?? undefined;

export default defineConfig({
  site,
  base,
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Inline small stylesheets to remove a render-blocking request on first
    // load. Anything large still ships as its own cacheable file.
    inlineStylesheets: 'auto',
  },
  // Prefetch on hover only. Prefetching everything in the viewport would blow
  // the data budget on mobile for no measurable benefit at this page count.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      // The style tile and the contact sheet are internal design references,
      // both noindex, so neither belongs in the sitemap. Everything else does.
      filter: (page) => {
        const basePath = (base ?? '/').replace(/\/$/, '');
        const path = new URL(page).pathname.replace(/\/$/, '');
        // Compare paths relative to the base, so this holds whether the site
        // is served from a domain root or a subdirectory.
        const rel = path.startsWith(basePath) ? path.slice(basePath.length) : path;
        return !/\/(style-tile|shots)$/.test(rel);
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
