# Shot list

This file is the photographer's brief **and** the source of truth for the
placeholder images currently on the site. Every row below generates a flat
colour placeholder at the exact aspect ratio the layout needs, labelled with
the shot it is waiting for.

**No stock photography is used anywhere on this site, and none should be.**

## How to use this file

- **To brief a photographer:** send them this file. The table has everything —
  ratio, where it appears, and what the shot needs to do.
- **To add a shot:** add a row, run `npm run shots`, and a placeholder appears
  at `src/assets/shots/<id>.svg`.
- **To swap in a real photograph:** drop the file into `src/assets/shots/` with
  the same `id` and a real extension (`carlingford-hero.jpg`), then delete the
  `.svg`. Nothing else changes — the build picks it up, resizes it, and serves
  AVIF and WebP automatically.

## Shooting notes that apply to everything

1. **Before and after pairs must match.** Same lens, same tripod position, same
   height, same time of day, same weather. Mark the tripod position on the floor
   at the "before" shoot and photograph the marks. If the pair does not match,
   the comparison slider on the project page reads as a trick and we will not
   publish it.
2. **Shoot the constraint, not just the result.** Every case study is built
   around a problem. A photograph of the awkward corner, the low ceiling or the
   step in the floor is worth more than another wide shot of the finished
   kitchen.
3. **Real houses, real light.** No styling that a family could not live in for a
   week. No fruit bowls placed for the camera. Overcast is fine.
4. **People are welcome.** The owners in their own house, the trades working.
   Get written permission on the day and note it against the shot ID.
5. **Interiors:** available light where possible, bracket for the windows.
   Verticals corrected. No ultra-wide distortion — 24mm equivalent at the widest.
6. **Alt text is written from the shot, not the room.** Each row includes the
   working alt text. Update it if the shot changes.

---

## Table

`Frames` is 1 unless the layout needs a sequence. `Priority 1` shots are needed
for launch; `Priority 2` can follow in a second visit.

| ID | Ratio | Frames | Used on | Shot brief | Alt text | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| home-hero-sequence | 21:9 | 16 | Homepage hero, scroll-driven sequence | A single rear extension photographed from one fixed tripod position as the light falls, from late afternoon to dusk with the interior lights coming on. 16 frames, locked off, no camera movement between frames. Interval shoot over roughly 40 minutes. | A rear extension at dusk, interior lights on, opening onto a back garden | 1 |
| home-differentiator | 4:5 | 1 | Homepage, fixed price section | A quote document on a site table with a tape measure and a pencil. Close, shallow depth of field, no branding legible. Shot on an actual job. | A fixed price quote on a site table beside a tape measure | 1 |
| home-process | 16:9 | 1 | Homepage, process timeline | A site meeting in progress on a half-built extension. Builder and owners, plans on a trestle, frame visible behind. | Builder and owners reviewing plans on site during framing | 1 |
| home-approvals | 3:2 | 1 | Homepage, approvals explainer entry | A survey plan and a council notice on a kitchen bench in a house that has not been renovated yet. Ordinary, un-styled. | A survey plan and council paperwork on a kitchen bench | 1 |
| home-trust | 3:2 | 1 | Homepage, trust strip background | The workshop at Northmead. Wide, tidy but working, tools racked. Morning light. | The Stonelane workshop at Northmead with tools racked along the wall | 2 |
| carlingford-hero | 3:2 | 1 | Carlingford project page hero | The finished rear extension from the garden, late afternoon. Show the join between the original brick veneer and the new work. | A brick veneer house with a new rear extension seen from the back garden | 1 |
| carlingford-before-01 | 4:3 | 1 | Carlingford, comparison slider 1, before | The original kitchen from the doorway. Tripod marked. Midday, blinds up. | The original 1970s kitchen with a closed-in wall to the dining room | 1 |
| carlingford-after-01 | 4:3 | 1 | Carlingford, comparison slider 1, after | Identical position, lens and time of day to before-01. | The same view after the dividing wall was removed and the kitchen rebuilt | 1 |
| carlingford-before-02 | 4:3 | 1 | Carlingford, comparison slider 2, before | The back of the house from the garden, showing the original aluminium sliding door and the step down. | The rear of the house before work, with an aluminium slider and a concrete step | 1 |
| carlingford-after-02 | 4:3 | 1 | Carlingford, comparison slider 2, after | Identical position, lens and time of day to before-02. | The same rear elevation after the extension was built | 1 |
| carlingford-constraint | 4:5 | 1 | Carlingford, the constraint section | The sewer main location marked out on the ground in spray paint before excavation. This is the shot that explains the whole job. | Sewer main location marked in spray paint across the rear yard | 1 |
| carlingford-detail | 1:1 | 1 | Carlingford, detail | The junction where the new slab meets the original timber floor, finished. Close, raking light. | The finished floor junction where the new slab meets the original timber floor | 2 |
| carlingford-process | 3:2 | 1 | Carlingford, what went wrong | The pier and beam subfloor under construction over the sewer easement. | Pier and beam subfloor construction spanning the sewer easement | 2 |
| west-ryde-hero | 3:2 | 1 | West Ryde project page hero | The finished kitchen and living area from the far corner, showing the full run and the beam. Late morning. | A reconfigured kitchen and living area with a steel beam spanning the opening | 1 |
| west-ryde-before-01 | 4:3 | 1 | West Ryde, comparison slider 1, before | The kitchen from the living room doorway, wall still in place. | The original galley kitchen closed off from the living room by a load bearing wall | 1 |
| west-ryde-after-01 | 4:3 | 1 | West Ryde, comparison slider 1, after | Identical position, lens and time of day to before-01. | The same view opened up, with the kitchen island where the wall stood | 1 |
| west-ryde-before-02 | 4:3 | 1 | West Ryde, comparison slider 2, before | The dining area looking back toward the kitchen, original ceiling and light fitting. | The dining area before work, with a low ceiling and a central light fitting | 1 |
| west-ryde-after-02 | 4:3 | 1 | West Ryde, comparison slider 2, after | Identical position, lens and time of day to before-02. | The same dining area after the ceiling was raised and relined | 1 |
| west-ryde-constraint | 4:5 | 1 | West Ryde, the constraint section | The asbestos sample being taken from the eaves lining, licensed removalist in PPE. | A licensed removalist taking an asbestos sample from the eaves lining | 1 |
| west-ryde-detail | 1:1 | 1 | West Ryde, detail | The benchtop edge and the join to the splashback. Close, raking light. | The finished benchtop edge and its join to the splashback | 2 |
| west-ryde-process | 3:2 | 1 | West Ryde, what went wrong | The temporary propping in place while the beam was installed. | Temporary propping supporting the ceiling while the steel beam is installed | 2 |
| baulkham-hills-hero | 3:2 | 1 | Baulkham Hills project page hero | The finished house from the street, showing the second storey sitting on the original ground floor. Late afternoon, front light. | A 1980s brick veneer house from the street with a new second storey | 1 |
| baulkham-hills-before-01 | 4:3 | 1 | Baulkham Hills, comparison slider 1, before | The front elevation from the footpath, tripod position marked in the driveway. | The original single storey brick veneer house from the footpath | 1 |
| baulkham-hills-after-01 | 4:3 | 1 | Baulkham Hills, comparison slider 1, after | Identical position, lens and time of day to before-01. Same season if possible — the street trees change the frame. | The same house after the second storey addition was completed | 1 |
| baulkham-hills-before-02 | 4:3 | 1 | Baulkham Hills, comparison slider 2, before | The entry hall looking toward the back of the house, before the stair was built. | The entry hall before the new stair was built | 1 |
| baulkham-hills-after-02 | 4:3 | 1 | Baulkham Hills, comparison slider 2, after | Identical position, lens and time of day to before-02. | The same entry hall with the new stair rising to the first floor | 1 |
| baulkham-hills-constraint | 4:5 | 1 | Baulkham Hills, the constraint section | The exposed original footing during the engineer's inspection, tape in frame for scale. | An exposed original strip footing during the structural engineer's inspection | 1 |
| baulkham-hills-detail | 1:1 | 1 | Baulkham Hills, detail | The stair balustrade junction at the landing. Close. | The stair balustrade meeting the landing at the top of the new stair | 2 |
| baulkham-hills-process | 3:2 | 1 | Baulkham Hills, what went wrong | The house under temporary roofing with scaffold up, taken during the wet week. | The house under temporary roofing and scaffold during framing | 2 |
| suburb-ryde | 16:9 | 1 | Ryde suburb page | A residential street in Ryde, brick veneer stock, no house identifiable as a client's without permission. | A residential street of brick veneer houses in Ryde | 2 |
| suburb-west-ryde | 16:9 | 1 | West Ryde suburb page | As above, West Ryde. | A residential street of brick veneer houses in West Ryde | 2 |
| suburb-eastwood | 16:9 | 1 | Eastwood suburb page | As above, Eastwood. | A residential street in Eastwood | 2 |
| suburb-epping | 16:9 | 1 | Epping suburb page | As above, Epping. | A residential street in Epping | 2 |
| suburb-carlingford | 16:9 | 1 | Carlingford suburb page | As above, Carlingford. | A residential street in Carlingford | 2 |
| suburb-dundas | 16:9 | 1 | Dundas suburb page | As above, Dundas. | A residential street in Dundas | 2 |
| suburb-pennant-hills | 16:9 | 1 | Pennant Hills suburb page | As above, Pennant Hills. Tree cover is the local character. | A tree-lined residential street in Pennant Hills | 2 |
| suburb-baulkham-hills | 16:9 | 1 | Baulkham Hills suburb page | As above, Baulkham Hills. | A residential street in Baulkham Hills | 2 |
| suburb-winston-hills | 16:9 | 1 | Winston Hills suburb page | As above, Winston Hills. | A residential street in Winston Hills | 2 |
| suburb-northmead | 16:9 | 1 | Northmead suburb page | As above, Northmead. | A residential street in Northmead | 2 |
| suburb-castle-hill | 16:9 | 1 | Castle Hill suburb page | As above, Castle Hill. | A residential street in Castle Hill | 2 |
| suburb-kellyville | 16:9 | 1 | Kellyville suburb page | As above, Kellyville. Larger lots, newer project homes. | A residential street of project homes in Kellyville | 2 |
| suburb-parramatta | 16:9 | 1 | Parramatta suburb page | As above, Parramatta. | A residential street in Parramatta | 2 |
| team-director | 4:5 | 1 | About page, and the confirmation page | The director, on site, working. Not a studio headshot and not arms folded in front of a ute. This photograph appears on the page that tells someone who is about to ring them, so it needs to look like the person who will actually call. | Dave Stonelane on site during a second storey framing stage | 1 |
| team-group | 3:2 | 1 | About page | The team at the workshop. Everyone who works on the tools. Morning. | The Stonelane team outside the Northmead workshop | 2 |
| about-workshop-detail | 1:1 | 1 | About page, detail | Something specific and true about how the business works — the job board, the selections samples wall, the set-out table. | The selections sample wall in the Northmead workshop | 2 |
| costs-opener | 3:2 | 1 | Cost guide page header | A partly demolished bathroom with the frame exposed, showing what is actually behind the tiles. This page argues that price depends on what is behind the walls, so show it. | A stripped bathroom with the wall frame and old waterproofing exposed | 1 |
| approvals-opener | 3:2 | 1 | Approvals explainer page header | A standard suburban lot photographed from the street with the side setbacks visible. Ordinary house, ordinary block. | A standard suburban lot showing the side setbacks either side of the house | 1 |
| estimator-opener | 4:5 | 1 | Cost estimator page | A set-out on a slab, chalk lines and dimensions, before framing starts. | Chalk set-out lines and dimensions marked on a new slab | 2 |
| checklist-cover | 4:5 | 1 | Planning checklist landing page | The printed checklist on a kitchen table, marked up in pen by an actual owner. | The printed planning checklist on a kitchen table, marked up in pen | 1 |
| contact-map | 16:9 | 1 | Contact page | The workshop entrance, so people can find it. | The entrance to the Stonelane workshop at Northmead | 2 |
