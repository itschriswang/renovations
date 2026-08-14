/**
 * Staggered reveals.
 *
 * One IntersectionObserver, one attribute, no animation library. The rules
 * from the brief fall out of the mechanism rather than being enforced on top
 * of it:
 *
 *   Nothing animates twice      — the element is unobserved once revealed, and
 *                                 `data-revealed` is never removed.
 *   Nothing animates on scroll up — there is no reverse path. Scrolling back
 *                                 past a revealed element does nothing at all.
 *
 * Easing, duration, distance and stagger all come from the tokens in
 * tokens.css. This file sets no visual values.
 *
 * Roughly 700 bytes, and it is the only script most pages load.
 */

const STAGGER_CAP = 6;

export function initReveals(root: ParentNode = document): void {
  const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  // Everything is visible by default; only start hiding once we know the
  // observer will run. Setting this before observing avoids a flash of
  // already-hidden content if the script is slow.
  document.documentElement.dataset.motion = 'ready';

  // Index within a group so siblings arrive one after another rather than
  // together. Capped, or a long list gets a comically late final item.
  const groups = new Map<Element, number>();
  for (const el of targets) {
    const parent = el.parentElement ?? document.body;
    const next = groups.get(parent) ?? 0;
    groups.set(parent, next + 1);
    el.style.setProperty('--reveal-index', String(Math.min(next, STAGGER_CAP)));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.dataset.revealed = '';
        // One shot. Never observed again, so it can never replay.
        observer.unobserve(el);
      }
    },
    {
      // Fire slightly before the element reaches the viewport, so the motion
      // reads as the page settling rather than as a delayed pop.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0,
    },
  );

  for (const el of targets) observer.observe(el);
}

/**
 * Anything already in view on load is revealed immediately with no transition,
 * so the first screen never animates in front of someone who has only just
 * arrived. Reveals are for content they scroll to.
 */
export function revealAboveTheFold(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  for (const el of targets) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.dataset.revealed = '';
      el.style.transitionDuration = '0ms';
      requestAnimationFrame(() => el.style.removeProperty('transition-duration'));
    }
  }
}
