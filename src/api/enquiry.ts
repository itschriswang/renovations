import type { APIRoute } from 'astro';
import { business, budgetBands } from '../lib/business';
import { checkSpam, deliver, validateEnquiry } from '../lib/enquiry';

export const prerender = false;

/**
 * The enquiry handler.
 *
 * It answers with a redirect rather than JSON, because the form is a plain
 * HTML POST that must work with JavaScript disabled. A 303 sends the browser
 * to a real page, which also means a refresh cannot resubmit the form.
 */

const BASE = import.meta.env.BASE_URL;
const page = (path: string) => `${BASE}/${path}`.replace(/\/{2,}/g, '/');

const seeOther = (path: string) =>
  new Response(null, { status: 303, headers: { Location: page(path) } });

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther('contact?error=malformed');
  }

  // Spam first, before anything is parsed or sent anywhere.
  const spam = checkSpam(form);
  if (spam.spam) {
    // Answer exactly as a success would. Telling a bot why it was rejected
    // just tells whoever wrote it what to change.
    console.log(`ENQUIRY_SPAM rejected: ${spam.reason}`);
    return seeOther('contact/thank-you');
  }

  const result = validateEnquiry(form, 'contact');
  if (!result.valid || !result.enquiry) {
    console.warn(`ENQUIRY_INVALID ${result.errors.join('; ')}`);
    return seeOther('contact?error=incomplete');
  }

  const enquiry = result.enquiry;

  // The qualifier. Anything below the minimum is answered with a referral
  // rather than entering the pipeline — filtering unqualified leads is worth
  // more than raw enquiry volume, and a good referral comes back in three
  // years as a bigger job.
  const band = budgetBands.find((b) => b.id === enquiry.budget);
  if (band && !band.qualified) {
    console.log(`ENQUIRY_BELOW_MINIMUM ${enquiry.suburb} ${enquiry.budget}`);
    // Still delivered, because we would rather make the referral personally
    // than have somebody bounce off a page.
    await deliver(enquiry, {
      to: business.contact.enquiryInbox,
      subject: `Referral — ${enquiry.name}, ${enquiry.suburb} (under minimum)`,
    });
    return seeOther('contact/not-a-fit');
  }

  const delivery = await deliver(enquiry, {
    to: business.contact.enquiryInbox,
    subject: `Enquiry — ${enquiry.name}, ${enquiry.suburb}, ${enquiry.budget}`,
  });

  // A delivery failure is not shown to the sender: the CSV row is already in
  // the log, so the enquiry is not lost, and telling somebody their message
  // may not have arrived invites them to send it again or go elsewhere.
  if (!delivery.emailed) {
    console.error(`ENQUIRY_UNDELIVERED ${enquiry.email} — recover from ENQUIRY_CSV above`);
  }

  return seeOther('contact/thank-you');
};

/** A GET here means somebody followed a link to the endpoint. Send them back. */
export const GET: APIRoute = () => seeOther('contact');
