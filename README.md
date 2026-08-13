# Stonelane Renovations — the website

This file is written for you, not for a developer. It covers the four things
you will actually want to do:

1. [Change the business details](#1-change-the-business-details)
2. [Change the cost bands](#2-change-the-cost-bands)
3. [Add a project](#3-add-a-project)
4. [Add a suburb](#4-add-a-suburb)

Plus [swapping in real photographs](#5-swap-in-a-real-photograph) and
[what to do before launch](#6-before-launch).

---

## The one rule

**Everything you edit lives in the `content` folder.** You never need to open
anything in `src`. If you find yourself in `src`, you have gone too far.

```
content/
  business.yaml      ← name, licence, phone, cost bands, process, councils
  TODO.md            ← every invented placeholder still on the site
  shotlist.md        ← the photographer's brief
  projects/          ← one file per case study
  suburbs/           ← one file per suburb landing page
  testimonials/      ← one file per testimonial
```

These are plain text files. You can edit them in anything — GitHub's web
editor, VS Code, even TextEdit. They use two formats:

- **YAML** (`business.yaml`) — `name: value`, one per line. Indentation matters:
  use spaces, never tabs.
- **MDX** (everything in `projects`, `suburbs`, `testimonials`) — a block of
  settings between two `---` lines at the top, then normal writing below it.

If you break something, the site will refuse to build and tell you which file
and which line. It will not publish a broken page.

---

## 1. Change the business details

Open `content/business.yaml`. Change the value, save, done — it updates the
header, the footer, the trust strip, every suburb page, the enquiry
confirmation and the structured data Google reads.

The most common ones:

| To change | Look for |
| --- | --- |
| Phone number | `contact.phone` **and** `contact.phoneLink` |
| Email | `contact.email` and `contact.enquiryInbox` |
| Workshop address | `contact.address` |
| Licence number | `credentials.licence.number` |
| Insurance and memberships | `credentials.insurance`, `credentials.memberships` |
| Warranty terms | `credentials.warranty` |
| Who calls back, and how fast | `contact.responsePromise` |
| Calendar booking link | `contact.bookingUrl` |
| Trading hours | `contact.hours` |

**The phone number is in two places on purpose.** `phone` is what people read
(`02 9876 5432`). `phoneLink` is what their phone dials, in international
format with no spaces (`+61298765432`). Change both.

### Adding a suburb to the service area

Two steps, both required:

1. Add a line under `serviceArea.suburbs` in `business.yaml`:
   ```yaml
   - { name: Telopea, slug: telopea, postcode: "2117", council: city-of-parramatta }
   ```
   `council` must match one of the `id` values in the `councils` list further
   down the same file.
2. Create the page — see [Add a suburb](#4-add-a-suburb).

---

## 2. Change the cost bands

In `content/business.yaml`, find `costBands`. Each band looks like this:

```yaml
- id: bathroom
  name: Bathroom
  low: 28000
  high: 55000
  typicalWeeks: [5, 8]
  summary: >-
    A full strip out back to frame, rewaterproofed, retiled and refitted.
  movers:
    - title: Moving the toilet or the floor waste
      detail: >-
        Relocating soil drainage means cutting the slab or working under the
        floor.
```

- Write figures as plain numbers with no dollar sign, commas or decimals:
  `28000`, not `$28,000`. The site formats them.
- **All published prices are GST inclusive.** Enter GST inclusive figures.
- `movers` are the variables that push a job up or down the band. This is the
  part owners actually read. Add or remove as many as you like.
- **Change `costBands.reviewed` to today's date whenever you change a figure.**
  That date is published next to the bands, and a stale one is worse than none.

Changing a band updates three things at once: the published cost guide, the
case study pages that reference that band, and the base ranges the cost
estimator works from. You do not need to update them separately.

> **Do not delete a band that a case study or the estimator points at.** The
> build will stop and name the file. Change the figures instead, or update the
> case study's `projectType` first.

---

## 3. Add a project

Copy an existing file in `content/projects/` and rename it. **The filename
becomes the web address**, so `dundas-bathroom.mdx` becomes
`/projects/dundas-bathroom`. Lowercase, hyphens, no spaces.

Then work down the settings at the top. Every case study is built from the same
four beats, and the page layout depends on all four being filled in:

| Field | What goes in it |
| --- | --- |
| `constraint` | The problem the site or the house handed you |
| `decision` | What you chose to do about it, and what the alternatives would have cost |
| `wentWrong` | One honest problem, how you resolved it, and what it cost the client |
| `outcome` | What they ended up with |

`wentWrong` is not optional and it is not a marketing risk. One honest problem
per case study does more work than ten glossy photographs, and leaving it out
is the single most common reason a builder's case study reads as brochure copy.

The settings that have to match something else:

- `suburb` — must match a filename in `content/suburbs/` (without `.mdx`)
- `council` — must match a council `id` in `business.yaml`
- `projectType` — must match a cost band `id` in `business.yaml`
- `testimonial` — must match a filename in `content/testimonials/` (optional)
- every `Shot` field — must match a shot ID in `content/shotlist.md`

Get all of them wrong and the build will tell you exactly which one and what
the valid options are.

### Before and after pairs

```yaml
comparisons:
  - label: The kitchen, looking in from the dining room
    before: dundas-before-01
    after: dundas-after-01
    beforeAlt: The original kitchen closed off by a full height wall
    afterAlt: The same view with the wall removed
    lens: 24mm, f/8
    position: Tripod marked on the dining room floor, lens height 1.5m
    timeOfDay: Both frames 10:40am, overcast
```

`lens`, `position` and `timeOfDay` are **published on the page**, underneath the
comparison. That is deliberate: it is what separates an honest before and after
from the ones where the "before" was shot on a phone in bad light. It also means
those three fields have to be true.

If the pair does not genuinely match — different position, different light,
different lens — leave the comparison out. A mismatched pair is worse than none.

---

## 4. Add a suburb

1. Add the suburb to `serviceArea.suburbs` in `business.yaml` (see above).
2. Copy an existing file in `content/suburbs/` and rename it to match the
   `slug` you used. `telopea.mdx` becomes `/renovations/telopea`.
3. Add a shot for it to `content/shotlist.md` and run `npm run shots`.

**Write something true and specific about the place.** These pages exist to be
found in search, and a page that is a template with the suburb name swapped in
will not be. Each one needs:

- `intro` — what the housing stock here is actually like
- `housingStock` — eras, lot sizes, construction, what has usually failed by now
- `localNotes` — at least one thing that genuinely affects renovating *here*.
  Sewer mains through rear yards in Carlingford. Overland flow in Northmead.
  Untied 1990s slabs in Baulkham Hills. This is the part that earns the ranking.
- `faqs` — at least three questions and answers. These become the FAQ entries
  Google can show directly in search results, so answer the question in the
  first sentence rather than working up to it.

Projects are matched to their suburb page automatically. You do not need to
list them.

---

## 5. Swap in a real photograph

Every image on the site is currently a flat colour placeholder labelled with
the shot it is waiting for. **No stock photography is used anywhere, and none
should be.**

To replace one:

1. Find its ID — it is printed on the placeholder itself, and listed in
   `content/shotlist.md`.
2. Drop the real file into `src/assets/shots/` with the same ID:
   `carlingford-hero.jpg`.
3. Delete the `.svg` with the same name.

That is the whole process. No content file changes. The site resizes it, makes
modern formats, and works out the dimensions so the page does not jump while it
loads.

To brief a photographer, send them `content/shotlist.md` as it is. It has the
ratio, the placement and the brief for every shot, plus the rules for before
and after pairs.

To add a new shot: add a row to the table in `content/shotlist.md`, then run:

```bash
npm run shots
```

---

## 6. Before launch

`content/TODO.md` lists every invented claim currently on the site, grouped by
how much trouble it causes if published — starting with the licence number,
the insurance claims and the association memberships.

To check progress at any time:

```bash
grep -rn "PLACEHOLDER" content/ src/
```

When that comes back empty, the content is ready.

---

## Running it

```bash
npm install       # once
npm run dev       # preview at localhost:4321, updates as you save
npm run build     # production build
```

Two extra commands you will rarely need:

```bash
npm run shots     # regenerate placeholders after editing shotlist.md
npm run fonts     # re-download and re-subset the fonts (needs Python)
```

## What it is built with, and why

| Choice | Reason |
| --- | --- |
| **Astro 7** | Ships almost no JavaScript by default. The brief asked for Astro 5; 7 is the current version and everything the brief relies on is present and faster. Agreed before building. |
| **Content in `/content`, not `/src`** | So the files you edit are separate from the code you do not. |
| **MDX** | Plain text you can edit in any editor, with no CMS to log into, pay for or migrate off. |
| **Tailwind 4, custom tokens only** | Every colour, size and space on the site is defined in one file. None of Tailwind's default palette or type scale is used. |
| **Young Serif + Schibsted Grotesk** | Both open source, both served from our own domain — no Google Fonts request, no third party watching who reads the site. Together they are 56 kB. |
| **React only where needed** | The cost estimator and the before/after slider. Everything else is plain HTML that works with JavaScript turned off. |
