import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';

/** Loads and validates content/approvals.yaml. See business.ts for the rationale. */

const schema = z.object({
  intro: z.string(),
  pathways: z
    .array(
      z.object({
        id: z.enum(['exempt', 'cdc', 'da']),
        name: z.string(),
        who: z.string(),
        timeframe: z.string(),
        summary: z.string(),
        typical: z.array(z.string()).min(1),
        catch: z.string(),
      }),
    )
    .length(3),
  standards: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        plain: z.string(),
        figure: z.string(),
        watch: z.string(),
      }),
    )
    .min(1),
  secondaryDwelling: z.object({
    intro: z.string(),
    rules: z.array(z.object({ name: z.string(), figure: z.string(), plain: z.string() })).min(1),
    practical: z.string(),
  }),
  responsibilities: z
    .array(z.object({ step: z.string(), who: z.string(), detail: z.string() }))
    .min(1),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(3),
  verified: z.object({
    instrument: z.string(),
    date: z.coerce.date().nullable(),
    by: z.string().nullable(),
  }),
});

const file = path.resolve(process.cwd(), 'content/approvals.yaml');
const parsed = schema.safeParse(parse(fs.readFileSync(file, 'utf8')));

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`content/approvals.yaml is not valid:\n${problems}\n`);
}

export const approvals = parsed.data;
