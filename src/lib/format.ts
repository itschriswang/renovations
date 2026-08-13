/**
 * Australian English formatting. Every number the reader sees passes through
 * here so the site is consistent about currency, GST and units.
 */

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

/** $28,000 */
export function currency(value: number): string {
  return AUD.format(value);
}

/** $28k — for headings and cards where the exact figure is noise. */
export function compact(value: number): string {
  if (value >= 1000 && value % 1000 === 0) return `$${value / 1000}k`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return currency(value);
}

/** "$28k to $55k" — we write "to" rather than an en dash, it reads better aloud. */
export function band(low: number, high: number, style: 'compact' | 'full' = 'compact'): string {
  const fmt = style === 'compact' ? compact : currency;
  return `${fmt(low)} to ${fmt(high)}`;
}

/** "5 to 8 weeks" */
export function weeks(range: [number, number]): string {
  const [low, high] = range;
  if (low === high) return `${low} ${low === 1 ? 'week' : 'weeks'}`;
  return `${low} to ${high} weeks`;
}

/** "12 March 2026" — Australian order, month spelled out to avoid ambiguity. */
export function longDate(value: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

/** "March 2026" */
export function monthYear(value: Date): string {
  return new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(value);
}

/** For <time datetime="..."> */
export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** 42 -> "42 m²". Metric throughout, with a non-breaking space. */
export function squareMetres(value: number): string {
  return `${value} m²`;
}
