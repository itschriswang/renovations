/**
 * Enquiry handling: validation, spam checks, delivery and the CSV fallback.
 *
 * Kept out of the route handlers so the rules are readable in one place and
 * testable without an HTTP request.
 */

export interface Enquiry {
  name: string;
  email: string;
  phone: string;
  suburb: string;
  projectType: string;
  budget: string;
  message: string;
  receivedAt: string;
  source: string;
}

export type SpamVerdict = { spam: false } | { spam: true; reason: string };

/**
 * Two checks, neither of which asks a human to solve a puzzle.
 *
 * A captcha is an accessibility tax charged to every visitor to stop a problem
 * caused by none of them, and the people it fails hardest are exactly the ones
 * this site is for. These two catch the overwhelming majority of automated
 * submissions at zero cost to a real person.
 */
export function checkSpam(form: FormData, now = Date.now()): SpamVerdict {
  // 1. Honeypot. Hidden off-screen and from assistive tech, and labelled
  //    "leave this blank". Only a machine filling every field completes it.
  const honeypot = String(form.get('company') ?? '').trim();
  if (honeypot.length > 0) return { spam: true, reason: 'honeypot filled' };

  // 2. Timing. The form stamps when it was rendered. A person cannot read the
  //    questions and answer them in under three seconds; a script can.
  const started = Number(form.get('started'));
  if (!Number.isFinite(started)) return { spam: true, reason: 'missing timestamp' };

  const elapsed = now - started;
  if (elapsed < 3000) return { spam: true, reason: `submitted in ${elapsed}ms` };
  // A stamp from a day ago is a replayed or scraped form, not a slow reader.
  if (elapsed > 24 * 60 * 60 * 1000) return { spam: true, reason: 'stale timestamp' };

  return { spam: false };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  enquiry?: Enquiry;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(form: FormData, source = 'contact'): ValidationResult {
  const get = (k: string) => String(form.get(k) ?? '').trim();
  const errors: string[] = [];

  const name = get('name');
  const email = get('email');
  const phone = get('phone');
  const suburb = get('suburb');
  const budget = get('budget');

  if (!name) errors.push('name is required');
  if (!email) errors.push('email is required');
  else if (!EMAIL.test(email)) errors.push('email does not look like an email address');
  if (!phone) errors.push('phone is required');
  if (!suburb) errors.push('suburb is required');
  if (!budget) errors.push('budget band is required');

  // Anything longer than this is a paste of somebody's entire life story or an
  // injection attempt. Either way it is not going into an email unchecked.
  if (get('message').length > 5000) errors.push('message is too long');

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    enquiry: {
      name,
      email,
      phone,
      suburb,
      projectType: get('projectType') || 'not specified',
      budget,
      message: get('message'),
      receivedAt: new Date().toISOString(),
      source,
    },
  };
}

/** RFC 4180 escaping. A suburb called "Ryde, NSW" must not become two columns. */
function csvCell(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export const CSV_HEADER =
  'received_at,source,name,email,phone,suburb,project_type,budget,message';

export function toCsvRow(e: Enquiry): string {
  return [
    e.receivedAt,
    e.source,
    e.name,
    e.email,
    e.phone,
    e.suburb,
    e.projectType,
    e.budget,
    e.message.replace(/\r?\n/g, ' '),
  ]
    .map(csvCell)
    .join(',');
}

export function toEmailBody(e: Enquiry): string {
  return [
    `Name:         ${e.name}`,
    `Email:        ${e.email}`,
    `Phone:        ${e.phone}`,
    `Suburb:       ${e.suburb}`,
    `Project type: ${e.projectType}`,
    `Budget band:  ${e.budget}`,
    `Received:     ${e.receivedAt}`,
    `Source:       ${e.source}`,
    '',
    'Message:',
    e.message || '(none)',
  ].join('\n');
}

/**
 * Delivery.
 *
 * Email first. If the provider is not configured or the call fails, the
 * enquiry is written to the log as a CSV row so it can still be recovered —
 * a lead that reaches nobody because a third-party API had an outage is worse
 * than any amount of ugliness in a log file.
 *
 * The CSV row is emitted for EVERY enquiry, successful or not, so the log is a
 * complete record rather than only a record of failures.
 */
export interface DeliveryResult {
  emailed: boolean;
  error?: string;
}

export async function deliver(
  e: Enquiry,
  opts: { to: string; subject: string },
): Promise<DeliveryResult> {
  // Always emit the CSV row first, before anything that can fail.
  console.log(`ENQUIRY_CSV ${toCsvRow(e)}`);

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;

  if (!key || !from) {
    const error = 'email not configured (RESEND_API_KEY / ENQUIRY_FROM unset)';
    console.warn(`ENQUIRY_FALLBACK ${error} — recovered from the CSV row above`);
    return { emailed: false, error };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        reply_to: e.email,
        subject: opts.subject,
        text: toEmailBody(e),
      }),
    });

    if (!response.ok) {
      const detail = `${response.status} ${await response.text()}`.slice(0, 300);
      console.warn(`ENQUIRY_FALLBACK email send failed: ${detail}`);
      return { emailed: false, error: detail };
    }

    return { emailed: true };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    console.warn(`ENQUIRY_FALLBACK email threw: ${detail}`);
    return { emailed: false, error: detail };
  }
}
