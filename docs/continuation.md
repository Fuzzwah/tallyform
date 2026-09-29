# Continue here

The user wants to experience shipping an independently branded app into the Zepp OS store. This is the new repository; Basket Birdie continues separately.

## Agreed direction

- Standalone repo/product, not a feature of the larger disc-golf app.
- General repetition/practice tracking, not restricted to golf.
- Flexible measure: longer distances, duration, weight and extensible/custom units.
- Preserve the mockup-inspired green value card, distinct outcome cards and make-rate bar as the visual starting point.

## Unresolved decisions

- Final name: **Tallyform** is confirmed as the current product identity; store availability and publisher registration are not verified.
- Success/failure mode, simple count mode, or both. Both was recommended, not yet accepted.
- One adjustable measure per session or several. One for v1 was recommended, not yet accepted.
- Duration setting versus live timer: do not infer a timer from unit support.
- Store regions, pricing, publisher details and account-registered app ID.

## Current code

The app/ directory (app.js, app.json, page/ and assets/) comes from the working putting prototype. The current manifest and watch page use Tallyform / Reps & Practice Tracker, while page/session.js still stores distanceM and boolean made outcomes. Tests use the extracted paths. Dependencies are local and pinned. The public `Fuzzwah/tallyform` repository is configured as `origin`; no source has been pushed or website published. Nothing has been submitted to the Zepp store.

## Next work

Resolve measurement and recording choices, then define standalone requirements. Implement measurement types, conversions and adjustable steps without relabelling historical events. Decide saved-session/history scope. Replace the inherited icon after naming. Test the release candidate on the physical Bip Max before preparing the store package and listing.

See standalone-rep-tracker-brief.md for the measurement proposal and official submission reference. Historical screenshots under evidence/putting-practice are not release marketing assets.
