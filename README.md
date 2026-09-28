# Rep Tracker — working name

Standalone Zepp OS app spun out of Basket Birdie's putting-practice experiment. The final product name is undecided.

**Current implementation:** the putting prototype, with metres/feet, swipe distance adjustment, made/missed outcomes, undo, local session recovery and the mockup-inspired native UI. The screen still says Basket Birdie and the package still says Putting Practice. Generic measurement types and release branding are planned, not implemented.

## Develop

Requires Node >=20.19.0. Dependencies and lockfile are local to this repository; no Basket Birdie checkout is required.

```sh
npm ci
npm test
npm run build
npm run dev
```

`dev` requires the Zepp simulator. `npm run preview` uses the paired-watch developer flow. Watch source is in `app/`; build output is in `app/dist/`. This keeps host tests and planning documents out of the watch package.

## Product and release work

Read [the product brief](docs/standalone-rep-tracker-brief.md) and [continuation notes](docs/continuation.md). The intended product supports configurable distance, duration, weight and custom numeric settings. Recording modes and one-versus-multiple measures per session are still open decisions.

The manifest app ID `1126719` is inherited development metadata, not a verified store registration. Before release, register this product in the publisher's Zepp account and use its assigned ID. The inherited icon and Basket Birdie branding also need replacement.

The prototype has host and simulator evidence, but has not been accepted or published in the Zepp store. Physical button mapping and recovery still require watch validation. See [simulator/watch instructions](docs/zepp-os-simulator-and-watch-validation.md); Basket Birdie paths there are historical. Use this repository's npm commands above.

## Origin

Extracted from the uncommitted putting-tracking workspace on 2026-09-29. The original Basket Birdie checkout is preserved. Only the putting prototype, tests, relevant evidence and planning documents were copied. `docs/prototype-specification` records the original experiment and its remaining device gate, not completion of the generic tracker.
