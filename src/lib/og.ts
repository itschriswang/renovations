import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { business } from './business';

/**
 * Sharing images, rendered at build time.
 *
 * Uses the site's own typefaces and palette, so a link pasted into a message
 * looks like the site rather than like a generic card. Text is laid out by
 * satori and rasterised by resvg — no browser, no screenshot service.
 *
 * The fonts are the committed TTF subsets in src/assets/og-fonts, which exist
 * precisely so this can run in CI without Python or a font installed on the
 * machine.
 */

const WIDTH = 1200;
const HEIGHT = 630;

const fontDir = path.resolve(process.cwd(), 'src/assets/og-fonts');
const display = fs.readFileSync(path.join(fontDir, 'gabarito-variable.ttf'));
const text = fs.readFileSync(path.join(fontDir, 'schibsted-grotesk-variable.ttf'));

const PAPER = '#f7f3ec';
const INK = '#1f1d1a';
const INK_MUTED = '#5c554c';
const BRICK = '#9a4a2c';
const GUM = '#b69160';

export interface OgOptions {
  /** The large line. Kept short — this is read at thumbnail size. */
  title: string;
  /** One line of context above the title. */
  eyebrow?: string;
  /** Up to three short facts along the bottom. */
  facts?: { label: string; value: string }[];
}

/** satori takes a React-element-shaped object; building it by hand avoids JSX here. */
const el = (type: string, props: Record<string, unknown>) => ({ type, props });

export async function renderOgImage({ title, eyebrow, facts = [] }: OgOptions): Promise<Buffer> {
  const svg = await satori(
    el('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: PAPER,
        padding: '64px 72px',
        // The brick rule along the top is the same device the pages use to
        // open a section, so the card reads as part of the site.
        borderTop: `16px solid ${BRICK}`,
      },
      children: [
        el('div', {
          style: { display: 'flex', flexDirection: 'column' },
          children: [
            eyebrow
              ? el('div', {
                  style: {
                    fontFamily: 'Schibsted Grotesk',
                    fontSize: 26,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 20,
                  },
                  children: eyebrow,
                })
              : null,
            el('div', {
              style: {
                fontFamily: 'Gabarito',
                fontSize: title.length > 46 ? 84 : 104,
                lineHeight: 1,
                letterSpacing: '-0.005em',
                color: INK,
                // satori has no text-wrap: balance, so long titles simply wrap
                // on width. The size step above keeps four lines from
                // overflowing the card.
                maxWidth: 980,
              },
              children: title,
            }),
          ].filter(Boolean),
        }),

        el('div', {
          style: {
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderTop: `2px solid ${GUM}`,
            paddingTop: 24,
          },
          children: [
            el('div', {
              style: { display: 'flex', gap: 48 },
              children: facts.slice(0, 3).map((f) =>
                el('div', {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    el('div', {
                      style: {
                        fontFamily: 'Schibsted Grotesk',
                        fontSize: 20,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: INK_MUTED,
                      },
                      children: f.label,
                    }),
                    el('div', {
                      style: {
                        fontFamily: 'Gabarito',
                        fontSize: 40,
                        color: INK,
                      },
                      children: f.value,
                    }),
                  ],
                }),
              ),
            }),
            el('div', {
              style: {
                fontFamily: 'Gabarito',
                fontSize: 40,
                color: BRICK,
              },
              children: business.identity.name,
            }),
          ],
        }),
      ],
    }) as Parameters<typeof satori>[0],
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Gabarito', data: display, weight: 600, style: 'normal' },
        { name: 'Schibsted Grotesk', data: text, weight: 400, style: 'normal' },
      ],
    },
  );

  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
}

export const OG_SIZE = { width: WIDTH, height: HEIGHT };
