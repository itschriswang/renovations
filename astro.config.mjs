// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
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

/**
 * Two build modes.
 *
 * STATIC_ONLY=1 produces a pure static site in dist/ with no server at all —
 * that is what the GitHub Pages preview publishes, and what `astro preview`
 * and the accessibility audit run against.
 *
 * Without it the Vercel adapter is added and the three form handlers are
 * injected as on-demand routes. Every page is still prerendered; only the API
 * endpoints run as functions.
 *
 * The handlers live in src/api rather than src/pages/api precisely so they can
 * be left out. A file under src/pages is always a route, and a route marked
 * `prerender = false` fails a build that has no adapter.
 */
const staticOnly = process.env.STATIC_ONLY === '1';

/** @type {import('astro').AstroIntegration} */
const formHandlers = {
  name: 'stonelane:form-handlers',
  hooks: {
    'astro:config:setup': ({ injectRoute, logger }) => {
      if (staticOnly) {
        logger.warn('STATIC_ONLY build: form handlers omitted, forms will not submit');
        return;
      }
      for (const name of ['enquiry', 'checklist', 'estimate']) {
        injectRoute({
          pattern: `/api/${name}`,
          entrypoint: `./src/api/${name}.ts`,
          prerender: false,
        });
      }
    },
  },
};

export default defineConfig({
  ...(staticOnly ? {} : { adapter: vercel() }),
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
    formHandlers,
    sitemap({
      // Internal references and post-submission pages are all noindex, so none
      // of them belongs in the sitemap. Everything else does.
      filter: (page) => {
        const basePath = (base ?? '/').replace(/\/$/, '');
        const path = new URL(page).pathname.replace(/\/$/, '');
        // Compare paths relative to the base, so this holds whether the site
        // is served from a domain root or a subdirectory.
        const rel = path.startsWith(basePath) ? path.slice(basePath.length) : path;
        return !/\/(style-tile|shots|thank-you|not-a-fit|sent)$/.test(rel);
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
