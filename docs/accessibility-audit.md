# Accessibility audit

**Target:** WCAG 2.2 Level AA
**Date:** 14 August 2026
**Build audited:** static build of `main`, 31 pages
**Auditor:** automated tooling plus manual keyboard and simulation testing

This is an honest audit, which means it includes a section on what has **not**
been tested and cannot be signed off yet. Passing every automated check is
roughly a third of accessibility, and any document that stops there is
marketing rather than an audit.

---

## 1. Summary

| | |
| --- | --- |
| Automated violations (axe-core, WCAG 2.0/2.1/2.2 A + AA) | **0** across 15 page types × 4 viewport widths |
| Lighthouse accessibility score | **100** on all 12 audited pages |
| Keyboard operable throughout | Yes, verified manually |
| Works with JavaScript disabled | Yes, including the enquiry form |
| Works at 200% zoom without horizontal scroll | Yes |
| Respects `prefers-reduced-motion` | Yes, degrades to opacity only |
| **Outstanding issues** | **None found by testing so far.** See §6 for what has not been tested. |

Re-run the automated half at any time:

```bash
npm run build:static && npm run preview   # in one terminal
npm run audit                             # in another
```

---

## 2. What was tested, and how

**Automated.** axe-core 4.x via Playwright, using the tag set
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`, against every distinct page
type at 375px, 640px, 768px and 1440px. 640px is included because it is
1280px at 200% zoom, which is what SC 1.4.10 Reflow actually asks about.

**Manual.** Keyboard traversal of every interactive element; focus visibility
on both light and dark surfaces; the enquiry form with scripting disabled;
reduced-motion simulation; and the motion layer under four separate conditions.

**Not automated, and deliberately so.** Alt text quality, heading logic,
link text in context and reading order were reviewed by hand. No tool can
tell you that `alt="kitchen"` is a worse description than `alt="the same view
with the dividing wall removed and the kitchen rebuilt along the left"`.

---

## 3. Findings, by criterion

### Perceivable

**1.1.1 Non-text Content.** Every image carries alt text describing *the work*
rather than the room, which is the standard the brief set and a higher one than
the criterion requires. The generated temporary images each carry alt text
naming the shot they await. Decorative frames in the hero sequence are
`alt=""` and `aria-hidden`, because they are the same view as frame one and
announcing sixteen of them would be noise.

**1.3.1 Info and Relationships.** Headings are sequential on every page — two
skips were found during the audit and fixed: the estimator island's `h3`
elements followed the page `h1` with no `h2` between them, and the projects
index had the same problem via its card headings. Both sections now carry a
visually hidden `h2`. Form fields use real `<label for>`; the budget question
is a `<fieldset>` with a `<legend>`; related facts use `<dl>`.

**1.4.3 Contrast (Minimum).** All 55 text and non-text colour pairings are
verified against the token values **at build time**, and the style tile prints
the measured ratio for each. Text can land on any of five light surfaces —
paper, raised, sunk, and the two washes — so every text tone is solved
numerically against the darkest of them rather than adjusted by eye against the
lightest. One value is then safe everywhere and no surface needs an override.
Body text on paper is 16.15:1; the lowest passing text pairing is 4.57:1
(captions on a sunk panel) against a 4.5:1 requirement.

Three real defects were found here and fixed. `.surface-dark a` has specificity
(0,1,1) and beat `.button--primary` at (0,1,0), so the primary call-to-action
button rendered its fill colour as text on the same fill inside dark panels;
buttons now hold their own colour on dark surfaces. Separately, four panels
invented a tinted surface with `color-mix(... 8-10%, transparent)` — a value
nobody had solved — and one of them dropped a duration label to below 4.5:1;
those now use the two verified washes. The gradient on the booking panel is
verified across its whole ramp, not only at its two ends: the worst point is
the coral end at 4.83:1.

**1.4.4 Resize Text / 1.4.10 Reflow.** The type scale interpolates in `rem`,
not `px`, so it responds to the reader's own text-size setting. No horizontal
scrolling at 320px or at 200% zoom. Three overflow defects were found during
the build and fixed: grid children defaulting to `min-width: auto` (110px of
overflow at 375px), an oversized specimen line, and a fixed-width bar chart.

**1.4.11 Non-text Contrast.** Input borders clear 3:1 on every light surface
(3.37:1 on paper, 3.07:1 on the sunk panel, which is the worst case). The
primary button's coral fill is itself 3.04:1 against the sunk panel, so the
control's own boundary is legible and not only its label. The focus ring clears
5.03:1 on paper and switches to amber on dark surfaces, where the deep coral
would not carry.

**1.4.12 Text Spacing.** Line height 1.65 on body text, paragraph spacing from
the space scale, and no fixed-height text containers, so user stylesheets that
increase spacing do not clip anything.

### Operable

**2.1.1 Keyboard / 2.1.2 No Keyboard Trap.** Everything is reachable and
operable by keyboard. The mobile navigation is a native `<details>` disclosure
rather than a scripted menu, so it is keyboard operable with no JavaScript at
all. No custom widget captures focus.

One defect found and fixed: the horizontally scrolling tables were
unreachable by keyboard, because a scroll container with no focusable children
cannot be scrolled without a pointer. They are now a `ScrollRegion` component
carrying `tabindex="0"`, `role="region"` and an accessible name.

**2.4.1 Bypass Blocks.** A skip link is the first tab stop on every page,
visible on focus, verified automatically on every audited route.

**2.4.3 Focus Order.** DOM order matches visual order. The asymmetric grid
places content with named grid lines rather than reordering it, specifically so
these cannot diverge.

**2.4.7 Focus Visible.** A 3px outline with a 2px offset, never removed.
`:focus:not(:focus-visible)` suppresses the ring only where the custom ring
replaces it.

**2.4.11 Focus Not Obscured (2.2, new).** The header does not use
`position: sticky`, so no focused element can be hidden behind it. This is
worth stating because sticky headers are the most common way sites fail this
new criterion.

**2.5.8 Target Size (Minimum) (2.2, new).** Interactive targets are at least
44×44px — comfortably above the 24×24px the criterion requires. Radio and
checkbox rows get their height from the label, not the control.

**2.3.3 Animation from Interactions (AAA, met anyway).** Under
`prefers-reduced-motion` the reveal distance and stagger both drop to zero,
which turns every reveal into a plain cross-fade rather than removing the
feedback entirely, and the hero sequence does not run at all — no frames are
fetched and the animation library is never imported.

### Understandable

**3.1.1 Language of Page.** `lang="en-AU"` on every page. Australian English
throughout, with GST-inclusive pricing stated wherever a figure appears.

**3.2.1 On Focus / 3.2.2 On Input.** Nothing changes context on focus or on
input. Choosing an under-minimum budget reveals an explanation in place; it
does not navigate, submit, or move focus.

**3.3.1 Error Identification / 3.3.2 Labels or Instructions.** Required fields
are marked in the label text, not by colour or an asterisk alone. Hints are
associated with `aria-describedby`. Client validation is the browser's own,
and the server repeats every check.

**3.3.7 Redundant Entry (2.2, new).** No information is asked for twice.

**3.3.8 Accessible Authentication (2.2, new).** There is no authentication,
and — relevant to this criterion — **no captcha**. Spam is handled by a
honeypot field and a timing check, both server-side. A captcha is an
accessibility tax charged to every visitor to solve a problem caused by none of
them, and it fails hardest exactly the people this site is written for.

### Robust

**4.1.2 Name, Role, Value.** Native elements throughout. The only ARIA used is
`aria-current`, `aria-describedby`, `aria-labelledby`, `aria-live` on the
estimator output, and `role="region"` on scroll containers — all of it
supplementing native semantics rather than replacing them.

**4.1.3 Status Messages.** The estimator's result is an `<output>` with
`aria-live="polite"`, so the recalculated range is announced without moving
focus.

---

## 4. Defects found and fixed during this build

Recorded because an audit that lists nothing found is usually an audit that
looked at nothing.

| # | Defect | Criterion | Status |
| --- | --- | --- | --- |
| 1 | Primary button rendered its fill colour as text on the same fill inside dark panels, from a specificity collision | 1.4.3 | Fixed |
| 2 | Horizontally scrolling tables unreachable by keyboard | 2.1.1 | Fixed |
| 3 | 110px horizontal overflow at 375px from grid children's default `min-width: auto` | 1.4.10 | Fixed |
| 4 | Specimen line and space-scale bars overflowing at 375px | 1.4.10 | Fixed |
| 5 | `.mono` failed contrast on dark surfaces — Astro's scoped styles are unlayered and beat `@layer components` | 1.4.3 | Fixed |
| 6 | Estimator headings skipped from `h1` to `h3` | 1.3.1 | Fixed |
| 7 | Projects index headings skipped from `h1` to `h3` | 1.3.1 | Fixed |
| 8 | Navigation unreachable without JavaScript at wide widths, where the disclosure toggle is hidden | 2.1.1 | Fixed |
| 9 | Primary navigation laid out at zero width and overflowed off the right of the viewport: Chromium now wraps a closed `<details>`'s children in `::details-content` with `content-visibility: hidden`, which `display: flex` on the panel no longer reaches past | 1.3.2, 2.4.3 | Fixed |
| 10 | Four panels invented an unverified tinted surface with `color-mix`; one dropped a label to below 4.5:1 | 1.4.3 | Fixed |
| 11 | Display headings inherited body leading (1.65) because Tailwind's paired `--text-*--line-height` only applies through the generated utility class, not through `var()` | — | Fixed |

---

## 5. Performance, as an accessibility concern

Slow pages are an accessibility problem, not only a commercial one — they are
worst for people on old devices and metered connections, which correlates with
disability more than the industry likes to admit.

| Measure | Budget | Worst measured |
| --- | --- | --- |
| Lighthouse performance, mobile throttled | 95+ | **100** |
| Lighthouse accessibility | 95+ | **100** |
| Lighthouse best practices | 95+ | **100** |
| Largest Contentful Paint | < 1.8s | **1.66s** |
| Cumulative Layout Shift | < 0.05 | **0.000** |
| Total Blocking Time | — | **0ms** |
| JavaScript on first load | < 150 kB gz | **2.8 kB** |

Measured on 13 pages with Lighthouse's default mobile profile (simulated 4G,
4× CPU throttle), served over gzip. The compression matters and is not a
convenience: the same build measured off an uncompressed file server reports
LCP at 1.96s, because Lighthouse's simulated 4G model is transfer-size bound
and the HTML and CSS are 74 kB raw against roughly 18 kB gzipped. Every host
this site would actually go on compresses text; a measurement that does not is
measuring the test rig.

CLS is zero because every image carries intrinsic dimensions and the font
fallbacks carry ascent, descent and line-gap overrides measured from the real
font files.

`/contact/thank-you` scores 69 for SEO and `/style-tile` scores 66. In both
cases the only failing audit is `is-crawlable`: that is the `noindex` penalty
and it is correct, because a confirmation page and an internal design reference
must not be indexed. Neither is a defect and neither should be "fixed".

---

## 6. What has NOT been tested

This is the section that matters, and it is the reason this audit cannot be
called complete.

1. **No screen reader has been used.** Everything above is automated tooling
   plus keyboard testing. Nobody has listened to these pages in NVDA, JAWS or
   VoiceOver. Automated tools catch perhaps a third of real barriers, and the
   ones they miss — nonsensical reading order, alt text that is technically
   present and practically useless, a form that is operable but bewildering —
   are exactly the ones a screen reader user hits first.

2. **No disabled person has used this site.** No usability testing with
   assistive technology users has taken place. This is the single highest-value
   thing that could be done next, and it is worth more than another round of
   automated checks.

3. **Alt text describes images that do not exist yet.** Every image is a
   generated placeholder. The alt text was written from the shot brief, so when
   real photographs arrive **every alt attribute must be re-checked against the
   actual frame**. An alt attribute describing a different photograph is worse
   than none.

4. **Voice control has not been tested.** Dragon and Voice Control rely on
   visible labels matching accessible names. They should match here, because
   labels are native, but this has not been confirmed.

5. **Windows High Contrast Mode has not been tested.** Forced-colours mode can
   remove background colours and borders that carry meaning. The design leans on
   rules and tone rather than colour alone, which should survive it, but
   "should" is not "does".

6. **The cognitive load of the approvals content has not been tested.** It is
   the most valuable page on the site and also the densest. Plain-language
   review with people who are not in the building industry would likely improve
   it more than any technical change.

7. **The audit harness now scrolls the page before running axe.** Reveal
   animations meant axe was sampling elements mid-fade and reporting contrast
   failures against a partly transparent element — a measurement of the
   transition rather than of anything a reader ends up looking at. The harness
   now scrolls the whole page and waits for every reveal to reach full opacity,
   and it fails if any reveal never gets there. That is a more honest test of
   the state pages are read in, but it does mean the mid-transition state is no
   longer checked: someone who starts reading during a fade is briefly looking
   at lower contrast than the ratios above.

---

## 7. Recommended next steps, in order

1. Screen reader pass — NVDA on Windows and VoiceOver on iOS, on the homepage,
   the approvals explainer, one case study and the enquiry form.
2. Re-check every alt attribute the day real photography lands.
3. One usability session with an assistive technology user, on the enquiry
   flow specifically, since that is the page where failure costs a customer.
4. Forced-colours mode check.
5. Re-run `npm run audit` and the Lighthouse sweep after the first real
   photography, because image weight will move LCP and none of the numbers in
   §5 hold once the placeholders are replaced.
