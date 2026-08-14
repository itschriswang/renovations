import type { APIRoute } from 'astro';
import { business } from '../lib/business';
import { checkSpam, deliver } from '../lib/enquiry';

export const prerender = false;

/** The gated asset. One field, same spam handling, same CSV fallback. */

const BASE = import.meta.env.BASE_URL;
const page = (path: string) => `${BASE}/${path}`.replace(/\/{2,}/g, '/');
const seeOther = (path: string) =>
  new Response(null, { status: 303, headers: { Location: page(path) } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther('checklist?error=malformed');
  }

  const spam = checkSpam(form);
  if (spam.spam) {
    console.log(`CHECKLIST_SPAM rejected: ${spam.reason}`);
    return seeOther('checklist/sent');
  }

  const email = String(form.get('email') ?? '').trim();
  if (!EMAIL.test(email)) return seeOther('checklist?error=email');

  await deliver(
    {
      name: '(checklist request)',
      email,
      phone: '',
      suburb: '',
      projectType: '',
      budget: '',
      message: `Requested: ${business.gatedAsset.title}`,
      receivedAt: new Date().toISOString(),
      source: 'checklist',
    },
    {
      to: business.contact.enquiryInbox,
      subject: `Checklist request — ${email}`,
    },
  );

  return seeOther('checklist/sent');
};

export const GET: APIRoute = () => seeOther('checklist');
