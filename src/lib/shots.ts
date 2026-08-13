import type { ImageMetadata } from 'astro';

/**
 * Resolves a shot ID from content/shotlist.md to whatever image file is
 * actually sitting in src/assets/shots.
 *
 * Content files only ever name a shot ID. That means swapping a generated
 * placeholder for a real photograph is a file drop, not a content edit:
 *
 *   src/assets/shots/carlingford-hero.svg   <- generated placeholder
 *   src/assets/shots/carlingford-hero.jpg   <- the real thing
 *
 * Delete the .svg and the .jpg is picked up on the next build, resized and
 * served as AVIF and WebP with no change to any MDX file.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/shots/*.{svg,jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const byId = new Map<string, ImageMetadata>();
const placeholderIds = new Set<string>();

for (const [filePath, mod] of Object.entries(modules)) {
  const file = filePath.split('/').pop() ?? '';
  const id = file.replace(/\.[^.]+$/, '');
  const isSvg = file.endsWith('.svg');

  // A real photograph always wins over a placeholder with the same ID, so a
  // half-finished swap never silently shows the placeholder.
  if (byId.has(id) && isSvg) continue;

  byId.set(id, mod.default);
  if (isSvg) placeholderIds.add(id);
  else placeholderIds.delete(id);
}

export function shot(id: string): ImageMetadata {
  const found = byId.get(id);
  if (!found) {
    throw new Error(
      `Unknown shot ID "${id}".\n` +
        `Add a row for it to content/shotlist.md and run \`npm run shots\`, ` +
        `or drop a real photograph at src/assets/shots/${id}.jpg.`,
    );
  }
  return found;
}

/** True while this shot is still a generated colour block awaiting photography. */
export function isPlaceholder(id: string): boolean {
  return placeholderIds.has(id);
}

/** Every shot still awaiting a real photograph. Used by the pre-launch report. */
export function pendingShots(): string[] {
  return [...placeholderIds].sort();
}

/** Frame IDs for the scroll-driven hero sequence, in order. */
export function sequenceFrames(baseId: string): string[] {
  return [...byId.keys()]
    .filter((id) => id.startsWith(`${baseId}-`) && /-\d{2}$/.test(id))
    .sort();
}
