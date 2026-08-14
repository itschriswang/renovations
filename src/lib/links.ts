/**
 * Every internal link goes through here.
 *
 * The site can be served from a domain root or from a subdirectory (the
 * preview host serves it from /<repo>/), and BASE_URL has no trailing slash
 * because trailingSlash is "never". Joining by hand produces "/renovationsabout"
 * exactly once before anyone notices, so it is done in one place instead.
 */

const BASE = import.meta.env.BASE_URL;

export function href(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${BASE}/${path}`.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
}

/** True when `path` is the page currently being rendered. */
export function isCurrent(path: string, pathname: string): boolean {
  const a = href(path).replace(/\/$/, '');
  const b = pathname.replace(/\/$/, '');
  return a === b;
}

/** True when `path` is the current page or an ancestor of it. */
export function isWithin(path: string, pathname: string): boolean {
  const a = href(path).replace(/\/$/, '');
  const b = pathname.replace(/\/$/, '');
  return a === b || b.startsWith(`${a}/`);
}

export const routes = {
  home: '/',
  projects: '/projects',
  project: (slug: string) => `/projects/${slug}`,
  costs: '/costs',
  estimator: '/estimator',
  approvals: '/approvals',
  process: '/process',
  about: '/about',
  contact: '/contact',
  thanks: '/contact/thank-you',
  checklist: '/checklist',
  suburb: (slug: string) => `/renovations/${slug}`,
} as const;

/** The primary navigation, in the order a renovating owner needs it. */
export const primaryNav = [
  { label: 'Projects', path: routes.projects },
  { label: 'What it costs', path: routes.costs },
  { label: 'Cost estimator', path: routes.estimator },
  { label: 'Approvals', path: routes.approvals },
  { label: 'How it runs', path: routes.process },
  { label: 'About', path: routes.about },
];
