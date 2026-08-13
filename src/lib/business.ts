import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';

/**
 * Loads and validates content/business.yaml.
 *
 * The validation is the point. business.yaml is the file a non-developer
 * edits, so a typo there should fail the build with a readable message rather
 * than render an empty licence number on the trust strip.
 */

const section = z.object({ title: z.string(), detail: z.string() });

const costBand = z.object({
  id: z.string(),
  name: z.string(),
  low: z.number().int(),
  high: z.number().int(),
  typicalWeeks: z.tuple([z.number().int(), z.number().int()]),
  summary: z.string(),
  movers: z.array(section).min(1),
});

const councilSchema = z.object({
  id: z.string(),
  name: z.string(),
  daWeeks: z.tuple([z.number().int(), z.number().int()]),
  cdcWeeks: z.tuple([z.number().int(), z.number().int()]),
  preDaMeeting: z.boolean(),
  notes: z.string(),
  url: z.string().url(),
});

const schema = z.object({
  identity: z.object({
    name: z.string(),
    legalName: z.string(),
    abn: z.string(),
    descriptor: z.string(),
    positioning: z.string(),
    differentiator: z.string(),
    differentiatorLong: z.string(),
    established: z.number().int(),
    teamSize: z.number().int(),
  }),
  credentials: z.object({
    licence: z.object({
      number: z.string(),
      authority: z.string(),
      holder: z.string(),
      verifyUrl: z.string().url(),
      label: z.string(),
    }),
    insurance: z.array(
      z.object({
        name: z.string(),
        abbr: z.string(),
        detail: z.string(),
        note: z.string().optional(),
      }),
    ),
    memberships: z.array(
      z.object({ name: z.string(), abbr: z.string(), memberNumber: z.string() }),
    ),
    warranty: z.object({
      structuralYears: z.number().int(),
      defectsYears: z.number().int(),
      summary: z.string(),
    }),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    phoneLink: z.string(),
    address: z.object({
      street: z.string(),
      suburb: z.string(),
      state: z.string(),
      postcode: z.string(),
      country: z.string(),
    }),
    geo: z.object({ latitude: z.number(), longitude: z.number() }),
    bookingUrl: z.string(),
    enquiryInbox: z.string().email(),
    hours: z.array(z.object({ days: z.string(), opens: z.string(), closes: z.string() })),
    responsePromise: z.object({
      caller: z.string(),
      callerRole: z.string(),
      fromNumber: z.string(),
      windowHours: z.number(),
      windowText: z.string(),
      afterHoursText: z.string(),
    }),
  }),
  serviceArea: z.object({
    suburbs: z.array(
      z.object({
        name: z.string(),
        slug: z.string(),
        postcode: z.string(),
        council: z.string(),
      }),
    ),
  }),
  councils: z.array(councilSchema),
  projectValue: z.object({
    minimum: z.number().int(),
    maximum: z.number().int(),
    belowMinimumResponse: z.object({
      heading: z.string(),
      body: z.string(),
      suggestions: z.array(z.string()),
      referralNote: z.string(),
    }),
  }),
  costBands: z.object({
    reviewed: z.coerce.date(),
    gstInclusive: z.boolean(),
    disclaimer: z.string(),
    bands: z.array(costBand).min(1),
  }),
  process: z.object({
    stages: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          duration: z.string(),
          weeks: z.number().int(),
          what: z.string(),
          owns: z.string(),
          deliverable: z.string(),
        }),
      )
      .min(1),
  }),
  reviews: z.object({
    googleRating: z.number(),
    googleReviewCount: z.number().int(),
    googleProfileUrl: z.string(),
    lastSynced: z.coerce.date(),
  }),
  gatedAsset: z.object({
    title: z.string(),
    description: z.string(),
    file: z.string(),
    pages: z.number().int(),
  }),
  site: z.object({
    url: z.string().url(),
    locale: z.string(),
    copyrightHolder: z.string(),
  }),
});

const file = path.resolve(process.cwd(), 'content/business.yaml');
const parsed = schema.safeParse(parse(fs.readFileSync(file, 'utf8')));

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`content/business.yaml is not valid:\n${problems}\n`);
}

export const business = parsed.data;
export type Business = typeof business;
export type CostBand = z.infer<typeof costBand>;
export type Council = z.infer<typeof councilSchema>;

/** Look up a council by the id used in business.yaml and in content frontmatter. */
export function council(id: string): Council {
  const found = business.councils.find((c) => c.id === id);
  if (!found) {
    throw new Error(
      `Unknown council id "${id}". Valid ids: ${business.councils.map((c) => c.id).join(', ')}`,
    );
  }
  return found;
}

/** Look up a published cost band by id. */
export function costBandById(id: string): CostBand {
  const found = business.costBands.bands.find((b) => b.id === id);
  if (!found) {
    throw new Error(
      `Unknown cost band id "${id}". Valid ids: ${business.costBands.bands
        .map((b) => b.id)
        .join(', ')}`,
    );
  }
  return found;
}

/** The suburb entries for a given council. */
export function suburbsInCouncil(councilId: string) {
  return business.serviceArea.suburbs.filter((s) => s.council === councilId);
}

/**
 * The enquiry budget bands. Everything below projectValue.minimum is a single
 * band that routes to the referral response rather than into the pipeline —
 * filtering unqualified leads is worth more than raw enquiry volume.
 */
export const budgetBands = [
  { id: 'under-60k', label: 'Under $60,000', qualified: false },
  { id: '60-100k', label: '$60,000 to $100,000', qualified: true },
  { id: '100-200k', label: '$100,000 to $200,000', qualified: true },
  { id: '200-350k', label: '$200,000 to $350,000', qualified: true },
  { id: '350-500k', label: '$350,000 to $500,000', qualified: true },
  { id: 'over-500k', label: 'Over $500,000', qualified: true },
  { id: 'unsure', label: 'I genuinely do not know yet', qualified: true },
] as const;

export type BudgetBandId = (typeof budgetBands)[number]['id'];
