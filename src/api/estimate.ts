import type { APIRoute } from 'astro';
import { business } from '../lib/business';
import { checkSpam, deliver } from '../lib/enquiry';

export const prerender = false;

/**
 * "Email me this estimate."
 *
 * The only place on the site where an email address is attached to a cost
 * figure — and it is entirely optional, because the figure is already on the
 * screen before this form exists.
 */

const BASE = import.meta.env.BASE_URL;
const page = (path: string) => `${BASE}/${path}`.replace(/\/{2,}/g, '/');
const seeOther = (path: string) =>
  new Response(null, { status: 303, headers: { Location: page(path) } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EstimatePayload {
  input?: Record<string, unknown>;
  result?: { low?: number; high?: number; bandName?: string; weeks?: [number, number] };
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther('estimator?error=malformed');
  }

  const spam = checkSpam(form);
  if (spam.spam) {
    console.log(`ESTIMATE_SPAM rejected: ${spam.reason}`);
    return seeOther('estimator/sent');
  }

  const email = String(form.get('email') ?? '').trim();
  if (!EMAIL.test(email)) return seeOther('estimator?error=email');

  // The payload comes from the browser, so it is treated as untrusted text:
  // parsed defensively, and only known numeric fields are read out of it.
  let summary = 'Estimate details could not be read.';
  try {
    const raw = String(form.get('estimate') ?? '');
    if (raw.length < 4000) {
      const parsed = JSON.parse(raw) as EstimatePayload;
      const r = parsed.result;
      if (r && Number.isFinite(r.low) && Number.isFinite(r.high)) {
        const fmt = new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          maximumFractionDigits: 0,
        });
        summary = [
          `Project: ${String(r.bandName ?? 'unspecified').slice(0, 80)}`,
          `Range:   ${fmt.format(r.low!)} to ${fmt.format(r.high!)} (GST inclusive)`,
          `On site: ${r.weeks?.[0] ?? '?'} to ${r.weeks?.[1] ?? '?'} weeks`,
          '',
          'Answers given:',
          ...Object.entries(parsed.input ?? {}).map(
            ([k, v]) => `  ${k}: ${String(v).slice(0, 60)}`,
          ),
        ].join('\n');
      }
    }
  } catch {
    // Keep the default summary. A malformed payload is not worth failing over
    // — somebody still asked for their estimate.
  }

  await deliver(
    {
      name: '(estimate request)',
      email,
      phone: '',
      suburb: '',
      projectType: '',
      budget: '',
      message: `${summary}\n\nThis is an estimate, not a quote.`,
      receivedAt: new Date().toISOString(),
      source: 'estimator',
    },
    { to: business.contact.enquiryInbox, subject: `Estimate sent to ${email}` },
  );

  return seeOther('estimator/sent');
};

export const GET: APIRoute = () => seeOther('estimator');
