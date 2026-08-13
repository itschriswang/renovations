import fs from 'node:fs';
import path from 'node:path';

/**
 * Parses the table in content/shotlist.md.
 *
 * That file is the photographer's brief, the source for the generated
 * temporary images, and the data behind the internal contact sheet at /shots.
 * One manifest, three uses — so a shot cannot exist in one place and not
 * another.
 */

export interface Shot {
  id: string;
  ratio: string;
  frames: number;
  usedOn: string;
  brief: string;
  alt: string;
  priority: number;
  /** Every generated file id for this row: one, or one per frame. */
  frameIds: string[];
}

const file = path.resolve(process.cwd(), 'content/shotlist.md');

function parse(md: string): Shot[] {
  const rows: Shot[] = [];
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
    if (cells.length < 7) continue;
    const [id, ratio, frames, usedOn, brief, alt, priority] = cells as string[];
    if (id === 'ID' || /^-+$/.test(id!)) continue;

    const count = Number(frames) || 1;
    rows.push({
      id: id!,
      ratio: ratio!,
      frames: count,
      usedOn: usedOn!,
      brief: brief!,
      alt: alt!,
      priority: Number(priority) || 2,
      frameIds:
        count > 1
          ? Array.from({ length: count }, (_, i) => `${id}-${String(i + 1).padStart(2, '0')}`)
          : [id!],
    });
  }
  return rows;
}

export const shotlist: Shot[] = parse(fs.readFileSync(file, 'utf8'));

export const shotCount = shotlist.reduce((n, s) => n + s.frames, 0);
export const launchCritical = shotlist.filter((s) => s.priority === 1);
