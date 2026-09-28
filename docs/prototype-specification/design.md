## Context

The existing Phase 0A package targets Bip Max at 432×514 with Zeus 1.9.3 and native JavaScript widgets. Evidence does not map physical button colours to key codes; a silver wake press previously produced no app callback. See proposal.md for motivation.

## Goals / Non-Goals

Goals: a separately buildable, offline manual practice experiment with testable pure logic and physical-button setup. Non-goals: production scorecard integration, historical sessions/export, GPS, motion sensing and guaranteed power-loss durability.

## Decisions

- Separate `experiments/putting-practice` package and app ID; reuse existing icon and build target. No new dependencies.
- Pure immutable session transitions; bounded 1000-attempt array stores distance in metres rounded to four decimals (exact for foot increments), plus outcome. Unit changes only change display; steps add one current unit to physical distance. This avoids silently moving prior attempts between distance groups.
- Vertical [gestures](https://docs.zepp.com/docs/reference/device-app-api/newAPI/interaction/onGesture/) implement scrolling. A crown is not established for this device, so no crown dependency.
- First-run setup learns two distinct key codes using [onKey](https://docs.zepp.com/docs/reference/device-app-api/newAPI/interaction/onKey/); score only CLICK. Consume mapped key events while practicing; keep visible exit and touch fallback. Rebinding is available. Wake-only presses are not attempts unless delivered as clicks to the app.
- [LocalStorage](https://docs.zepp.com/docs/reference/device-app-api/newAPI/storage/localStorage/) with a versioned validated snapshot and readback before updating UI state. This is a lightweight experiment, not the production journal/durability contract. Surface errors; require explicit reset to replace an invalid snapshot.
- Mockup-led native layout: Basket Birdie heading, green distance card with dedicated m/ft selectors, green/red made/missed cards for the selected distance, and make-rate bar. Compact footer keeps undo/reset/key setup/exit reachable. Hide the native title bar while this page is active, restore on teardown. Reset confirmation temporarily repurposes footer buttons and suspends physical scoring. Use native shapes/text, with no raster mockup or fake watch chrome.

## Risks / Trade-offs

- Firmware can reserve keys or deliver different click sequences → first-run calibration, touch fallback and explicit physical tests.
- LocalStorage caching does not prove abrupt-power recovery → document limitation and retain uncompleted device gate.
- App ID is a distinct local development ID, not a claimed registered developer-console identity → account-specific preview may require a registered ID.

## Migration Plan

Build/install the separate experiment. Removing it rolls back this feature without changing the probe. No existing data migration.
