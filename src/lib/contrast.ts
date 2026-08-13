/**
 * WCAG 2.2 contrast maths.
 *
 * Used by the style tile so the ratios printed next to every colour are
 * measured at build time rather than typed in by hand and left to drift, and
 * by the pre-launch accessibility check.
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

/** Contrast ratio between two hex colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
}

export type ContrastUse = 'body' | 'large' | 'non-text';

const MINIMUM: Record<ContrastUse, number> = {
  // 1.4.3 Contrast (Minimum), AA
  body: 4.5,
  // Large text is 18.66px bold or 24px regular and over
  large: 3,
  // 1.4.11 Non-text Contrast — borders, focus rings, control boundaries
  'non-text': 3,
};

export function meetsAA(a: string, b: string, use: ContrastUse = 'body'): boolean {
  return contrastRatio(a, b) >= MINIMUM[use];
}

export function formatRatio(a: string, b: string): string {
  return `${contrastRatio(a, b).toFixed(2)}:1`;
}

export { MINIMUM as CONTRAST_MINIMUM };
