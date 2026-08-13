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

export default defineConfig({
  site: business.site.url,
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
      // not public pages.
      filter: (page) => !/\/(style-tile|shots)$/.test(page.replace(/\/$/, '')),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
