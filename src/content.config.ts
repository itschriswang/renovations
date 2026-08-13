import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content lives in /content at the repository root rather than inside /src,
 * so it reads as content rather than as source. Astro's content layer loads
 * from anywhere, so this costs nothing.
 *
 * Images are referenced by SHOT ID (see content/shotlist.md), never by file
 * path. `heroShot: carlingford-hero` resolves to whichever file is sitting in
 * src/assets/shots — the generated .svg placeholder today, a .jpg the day the
 * photography lands. Nothing in the content files changes when they swap.
 */
const shotId = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Shot IDs are lowercase, numbers and hyphens only')
  .describe('An ID from the table in content/shotlist.md');

const houseType = z.enum([
  'brick veneer',
  'weatherboard',
  'fibro',
  'project home',
  'double brick',
  'mixed',
]);

const approvalPath = z.enum(['cdc', 'da', 'exempt']);

/**
 * A before/after pair. The lens, position and time of day are recorded because
 * we publish them on the page — a comparison the reader cannot verify is a
 * sales trick, and juries and owners both spot it.
 */
const comparison = z.object({
  label: z.string(),
  before: shotId,
  after: shotId,
  beforeAlt: z.string(),
  afterAlt: z.string(),
  lens: z.string().describe('e.g. "24mm, f/8"'),
  position: z.string().describe('e.g. "Tripod marked on the dining room floor, 1.5m height"'),
  timeOfDay: z.string().describe('e.g. "Both frames 10:40am, overcast"'),
});

/** A titled block of prose. Used for the narrative sections of a case study. */
const section = z.object({
  heading: z.string(),
  body: z.string(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    // One line, used on cards and in search results.
    summary: z.string(),
    // Meta description. Keep under 160 characters.
    description: z.string(),

    suburb: reference('suburbs'),
    council: z.string().describe('A council id from business.yaml'),
    houseType,
    eraBuilt: z.string().describe('e.g. "1974"'),

    // Must match a cost band id in business.yaml so the case study and the
    // published bands can never drift apart.
    projectType: z.string(),
    costBand: z.object({
      low: z.number().int(),
      high: z.number().int(),
      // Always state this. GST inclusive throughout the site.
      gstInclusive: z.boolean().default(true),
    }),
    durationWeeks: z.number().int(),
    approvalPath,
    approvalNote: z.string().optional(),
    trades: z.array(z.string()).min(1),

    // The four narrative beats every case study is built from. One honest
    // problem per project beats ten glossy shots.
    constraint: section,
    decision: section,
    wentWrong: section.extend({
      resolution: z.string(),
      // What it cost the client. Usually nothing. Say so plainly.
      costToClient: z.string(),
    }),
    outcome: section,

    heroShot: shotId,
    heroAlt: z.string(),
    constraintShot: shotId.optional(),
    constraintAlt: z.string().optional(),
    detailShot: shotId.optional(),
    detailAlt: z.string().optional(),
    processShot: shotId.optional(),
    processAlt: z.string().optional(),
    comparisons: z.array(comparison).default([]),

    testimonial: reference('testimonials').optional(),

    publishDate: z.coerce.date(),
    featured: z.boolean().default(false),
    order: z.number().int().default(99),
    draft: z.boolean().default(false),
  }),
});

const suburbs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/suburbs' }),
  schema: z.object({
    name: z.string(),
    postcode: z.string(),
    council: z.string().describe('A council id from business.yaml'),
    description: z.string(),

    // The opening paragraph on the landing page. Written about the housing
    // stock, not about us.
    intro: z.string(),
    housingStock: z.string(),
    // What is specific about renovating here. This is what makes the page
    // worth ranking rather than a template with the suburb name swapped in.
    localNotes: z.array(section).min(1),

    // Drives FAQPage schema. Three to six entries.
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(3),

    shot: shotId,
    shotAlt: z.string(),

    // Optional: pin specific projects to the top of this suburb's page.
    // Anything not listed still appears, matched on the project's suburb.
    featuredProjects: z.array(reference('projects')).default([]),

    publishDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/testimonials' }),
  schema: z.object({
    // First name and surname initial only, unless written consent says
    // otherwise. Never invent or paraphrase a real review.
    name: z.string(),
    suburb: z.string(),
    projectType: z.string(),
    quote: z.string(),
    date: z.coerce.date(),
    source: z.enum(['google', 'direct', 'email']),
    // False until someone has checked it against the original. Every
    // unverified testimonial is reported by the pre-launch check, and the
    // placeholders currently in this collection are all false.
    verified: z.boolean().default(false),
    project: reference('projects').optional(),
  }),
});

export const collections = { projects, suburbs, testimonials };
