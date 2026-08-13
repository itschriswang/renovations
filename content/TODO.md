# Before this site goes live

Every item here is invented placeholder content. The site is built so that
fixing them is an edit, never a rebuild. Each item says where it lives.

Nothing on this list is a "nice to have". Publishing a builder's website with an
invented licence number or an unearned membership badge is a regulatory problem,
not a copywriting one.

---

## 1. Blockers — legal, regulatory and factual

These carry real consequences if published wrong.

| # | What | Where | Why it matters |
| --- | --- | --- | --- |
| 1.1 | **Builder's licence number** is `000000C`, a dummy value | `business.yaml` → `credentials.licence.number` | Displaying a false licence number is an offence under NSW home building law. The site links to the public register, so anyone can check it in one click. |
| 1.2 | **ABN** is `00 000 000 000` | `business.yaml` → `identity.abn` | Must match ABN Lookup. |
| 1.3 | **Legal entity name** unconfirmed | `business.yaml` → `identity.legalName`, `site.copyrightHolder` | Must match the entity that actually holds the licence and signs contracts. |
| 1.4 | **HBCF cover** is claimed but not evidenced | `business.yaml` → `credentials.insurance[0]` | Do not claim cover we cannot produce a certificate for. Also confirm the current contract-value threshold at which cover is required — it changes. |
| 1.5 | **$20m public liability** figure not checked against the policy schedule | `business.yaml` → `credentials.insurance[1]` | Quote the real sum insured. |
| 1.6 | **MBA NSW and HIA memberships** unverified, member numbers are `000000` | `business.yaml` → `credentials.memberships` | Both associations restrict use of their logos and name to current financial members. Confirm membership is current, get the member numbers, and get written permission for logo use before the logos go anywhere near the trust strip. |
| 1.7 | **Warranty terms** (6 year structural, 2 year defects) not checked against the contract | `business.yaml` → `credentials.warranty` | These must match the actual contract and the statutory warranty position, not the other way around. |
| 1.8 | **Engineered stone claim** — the site states engineered stone can no longer be supplied or installed in Australia | `business.yaml` → `costBands.bands[kitchen].movers`, `projects/west-ryde-kitchen-and-living.mdx` | This reflects the national prohibition, but check the current SafeWork NSW guidance and wording before publishing, including how it applies to repair and removal of existing benchtops. |
| 1.9 | **All testimonials are invented** | `content/testimonials/*.mdx` | Publishing a fabricated testimonial is misleading conduct under Australian Consumer Law. Every one is flagged `verified: false` and the pre-launch check will fail while any remain. Replace with real, written, permissioned quotes. Never paraphrase or tidy a real review. |
| 1.10 | **Google reviews block** shows rating `0.0` from `0` reviews with no profile URL | `business.yaml` → `reviews` | Decide whether reviews are pulled live or pasted in. If pasted, keep reviewer names and dates exactly as published and keep `lastSynced` current. |

## 2. Blockers — contact and conversion

The site promises a phone call. If these are wrong the promise fails.

| # | What | Where |
| --- | --- | --- |
| 2.1 | **Email** `hello@example.com.au` is a dummy address | `business.yaml` → `contact.email`, `contact.enquiryInbox` |
| 2.2 | **Phone** `02 0000 0000` is a dummy number, used in `tel:` links | `business.yaml` → `contact.phone`, `contact.phoneLink` |
| 2.3 | **Workshop address** is "Address to be confirmed" | `business.yaml` → `contact.address` |
| 2.4 | **Coordinates** are the Northmead suburb centroid, not the premises | `business.yaml` → `contact.geo` — used in LocalBusiness schema |
| 2.5 | **Booking URL** is `#` — no calendar tool chosen or configured | `business.yaml` → `contact.bookingUrl`. Calendar booking is the primary CTA, so this is the single highest-value item on this list. |
| 2.6 | **Response promise** names "Dave Stonelane, Director" calling within one business hour | `business.yaml` → `contact.responsePromise`. Confirm the name, and confirm the team can actually meet a one hour callback window. If they cannot, change the number rather than the intention. |
| 2.7 | **Trading hours** invented | `business.yaml` → `contact.hours` |
| 2.8 | **Northmead workshop visits** — a suburb FAQ invites people to drop in | `suburbs/northmead.mdx` |

## 3. Pricing

All figures are GST inclusive and all of them are invented.

| # | What | Where |
| --- | --- | --- |
| 3.1 | **All seven cost bands** are placeholder figures | `business.yaml` → `costBands.bands` |
| 3.2 | **`costBands.reviewed` date** is `2026-01-01`, invented | `business.yaml`. Update whenever a band changes — the date is published next to the bands. |
| 3.3 | **Typical durations** per band invented | `business.yaml` → `costBands.bands[].typicalWeeks` |
| 3.4 | **Minimum project value** of $60k drives the enquiry qualifier | `business.yaml` → `projectValue.minimum`. Confirm this is the real floor. |
| 3.5 | **Referral copy** for under-$60k enquiries | `business.yaml` → `projectValue.belowMinimumResponse`. Decide whether to name actual referral partners. |
| 3.6 | **Cost breakdown tables** in all three case studies are invented percentages | `projects/*.mdx` |

## 4. Process and approvals

| # | What | Where |
| --- | --- | --- |
| 4.1 | **All process stage durations** are indicative and unverified against job records | `business.yaml` → `process.stages` |
| 4.2 | **All council DA and CDC timeframes** are invented | `business.yaml` → `councils[].daWeeks`, `cdcWeeks`. Councils publish determination statistics; use those and note the source and date. |
| 4.3 | **Council notes** — the local planning observations for each of the six LGAs | `business.yaml` → `councils[].notes` |
| 4.4 | **Approvals explainer content** — CDC vs DA thresholds, secondary dwelling rules, setbacks, floor space ratio, site coverage | To be written in build step 3. Every threshold must cite the instrument and the date checked. This is the highest-value page on the site and also the one most likely to be wrong. |
| 4.5 | **Cumberland and Blacktown are listed as councils covered, but no suburb in the service area maps to Cumberland.** | `business.yaml` → `councils`, `serviceArea.suburbs`. Either add the suburbs served in those LGAs or remove the council. As it stands the site claims coverage it cannot demonstrate. |

## 5. Suburb and LGA assignments

Several service-area suburbs straddle two local government areas. Each is
flagged in `business.yaml` and on its own page, but the assignment below is a
best guess, not a checked fact. Verify each against the council boundary viewer.

| # | Suburb | Assigned to | Also partly in |
| --- | --- | --- | --- |
| 5.1 | Eastwood | City of Ryde | City of Parramatta |
| 5.2 | Winston Hills | The Hills Shire | City of Parramatta |
| 5.3 | Kellyville | The Hills Shire | Blacktown City |

Also verify, on every suburb page: the housing stock description, the typical
lot sizes, the era ranges, and any claim about flooding, bushfire prone land,
heritage conservation areas, tree preservation or covenants. Specific claims
are what make these pages worth ranking, and they are also what makes them
wrong if nobody checks them.

## 6. Case studies

All three are entirely invented, including the clients, the problems and the
resolutions.

| # | Project | Where |
| --- | --- | --- |
| 6.1 | Carlingford Brick Veneer — sewer main, pier and beam, piers hitting rock | `projects/carlingford-brick-veneer.mdx` |
| 6.2 | West Ryde Kitchen and Living — load bearing wall, asbestos behind the wall oven | `projects/west-ryde-kitchen-and-living.mdx` |
| 6.3 | Baulkham Hills Second Storey — untied 1998 slab, nine days of rain | `projects/baulkham-hills-second-storey.mdx` |
| 6.4 | The "roughly one job in five" statistic about footing inspections | `projects/baulkham-hills-second-storey.mdx` — replace with a real number or delete the sentence |

Get written permission from the owners before publishing any real project,
including for photographs that show the interior of their home.

## 7. Photography

**No stock photography is to be used on this site under any circumstances.**

Every image is currently a generated temporary image — a scene drawn from the
site's own material palette at the exact ratio the layout needs, captioned with
the shot it is waiting for. There are **65 temporary images across 50 briefed
shots**. Browse them all at `/shots`.

They are drawn rather than sourced deliberately: a real photograph of another
person's house on a builder's website reads as a claim about work we did, which
is a misrepresentation risk even while it is only standing in.

- The full brief is `content/shotlist.md` — send that file to the photographer as is.
- 26 shots are marked Priority 1 and are needed for launch.
- The homepage hero needs a **16 frame locked-off sequence** shot over roughly
  40 minutes as the light falls. It cannot be assembled from separate visits.
- **Before and after pairs must match**: same lens, same tripod position, same
  height, same time of day. The lens, position and time are published on the
  page next to the comparison, so they have to be true. If a pair does not
  match, do not publish the comparison.
- `team-director` appears on the enquiry confirmation page, next to the
  promise that this person will ring you. It needs to look like the person who
  will actually call.

To swap a placeholder for a real photograph: drop the file into
`src/assets/shots/` using the same shot ID and a real extension, then delete the
`.svg`. Nothing in any content file changes.

**Note on performance testing:** the temporary images are drawn SVGs averaging
under 2 kB each. Real photography is far heavier, so the LCP and total-weight
numbers will move once real images land. Re-run the performance pass after the
first real shoot rather than trusting the placeholder numbers.

## 8. Gated asset

| # | What | Where |
| --- | --- | --- |
| 8.1 | **The renovation planning checklist PDF does not exist.** It is the only gated asset on the site and the enquiry flow points at it. | `business.yaml` → `gatedAsset.file` → `/downloads/stonelane-renovation-planning-checklist.pdf` |
| 8.2 | Confirm the checklist is genuinely six pages and that a version without branding exists for printing | `business.yaml` → `gatedAsset` |

## 9. Domain and deployment

| # | What | Where |
| --- | --- | --- |
| 9.1 | **Domain** `stonelane.example.com.au` is not registered | `business.yaml` → `site.url`. Feeds canonical URLs, the sitemap, OG tags and schema. |
| 9.2 | Founded year (`1000`) and team size (`00`) are dummy values | `business.yaml` → `identity.established`, `identity.teamSize` |

---

## How to check your progress

Search the whole repository for the word `PLACEHOLDER`. Every unverified claim
is marked with it, in YAML comments and in MDX comments alike:

```bash
grep -rn "PLACEHOLDER" content/ src/
```

When that search returns nothing and every testimonial reads `verified: true`,
the content side of this site is ready to launch.
