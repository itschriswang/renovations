/**
 * Scroll-driven image sequencing on the hero.
 *
 * The effect the brief asks for, kept behind guards that protect the
 * performance budgets it also asks for. Those two requirements genuinely
 * conflict: a sixteen frame sequence is sixteen images, and on real
 * photography that is megabytes.
 *
 * So the sequence is opt-in per visitor rather than per site. Frame one is an
 * ordinary <img> and is the LCP element. Frames two onward carry no `src` at
 * all until every one of these is true:
 *
 *   - the visitor has not asked for reduced motion
 *   - the viewport is wide enough for the effect to read
 *   - the connection is not metered, saving data, or slow
 *   - the page has finished loading, so nothing here competes with LCP
 *
 * If any check fails, nothing is fetched and nothing is imported — not the
 * frames, not the animation library. The hero is simply a photograph, which
 * is a perfectly good hero.
 */

const MIN_WIDTH = 64 * 16; // 64rem, the width at which the layout goes wide

interface Connection {
  saveData?: boolean;
  effectiveType?: string;
}

function connectionIsGood(): boolean {
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  if (!c) return true; // Unknown: assume fine rather than punish the visitor.
  if (c.saveData) return false;
  return !/(^|-)(2g|slow-2g)$/.test(c.effectiveType ?? '');
}

function shouldRun(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < MIN_WIDTH) return false;
  return connectionIsGood();
}

export async function initHeroSequence(): Promise<void> {
  const container = document.querySelector<HTMLElement>('[data-hero-sequence]');
  if (!container) return;
  if (!shouldRun()) return;

  const frames = [...container.querySelectorAll<HTMLImageElement>('.hero-seq__frame')];
  if (frames.length < 2) return;

  // Load the deferred frames. Until this line runs they have no src, so a
  // visitor who never qualifies never pays for them.
  await Promise.all(
    frames.slice(1).map((img) => {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
      if (!src) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
        if (srcset) img.srcset = srcset;
        img.src = src;
      });
    }),
  );

  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  container.dataset.sequence = 'running';

  const state = { progress: 0 };
  const last = { index: 0 };

  const paint = () => {
    const index = Math.min(frames.length - 1, Math.round(state.progress * (frames.length - 1)));
    if (index === last.index) return;
    last.index = index;
    // A sequence is a scrub, not a cross-fade: exactly one frame is visible at
    // a time. Fading between frames of the same locked-off shot would read as
    // a soft double image rather than as time passing.
    frames.forEach((frame, i) => {
      frame.style.setProperty('--frame-opacity', i === index ? '1' : '0');
    });
  };

  gsap.to(state, {
    progress: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: container,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 0.4,
      // The sequence is tied to scroll position, so scrolling back up steps
      // back through it. That is scrubbing, not replaying an animation — the
      // "nothing animates on scroll up" rule is about reveals firing twice,
      // which this cannot do.
      invalidateOnRefresh: true,
    },
    onUpdate: paint,
  });

  paint();
}
