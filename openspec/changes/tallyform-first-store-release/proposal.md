# Proposal

## Why

Tallyform has a published marketing site but remains a distance-only putting prototype, not a store-ready general practice tracker. The agreed first release needs two manual recording modes, configurable measurements, saved summaries and live timing with background countdown alerts, followed by evidenced device and store-release gates.

## What Changes

- Add simple rep counting and success/failure attempts, with undo and explicit mode labels; recording always remains manual.
- Select one measurement type per session: distance, weight, duration-setting or none. Support compatible unit conversion and adjustable values/steps without relabelling recorded events.
- Add finish/save and local saved-session summaries, retaining active-session recovery and protecting data on failed writes.
- Add a session stopwatch alongside any measurement and a per-rep countdown using the duration setting. Provide start/pause/resume and explicit restart/cancel controls; countdown expiry alerts but never records, classifies or automatically starts another rep.
- Require countdown alerts while the display sleeps and after leaving the app. Alarm scheduling, notification delivery, cancellation and device lifecycle behavior are release gates, not foreground-only fallbacks.
- **BREAKING**: Replace the distance-only session schema and putting-specific controls with the generic model. Migrate valid prototype data without changing distances or outcomes; do not silently reset unreadable data.
- Replace inherited icon assets, register the product's real app identity, implement device-appropriate layouts/controls and validate a documented target matrix before submission.
- Aim for broad Zepp OS coverage; do not equate current Bip Max support or an API version with verified support for other models.

### Non-goals and unresolved release decisions

No custom-labelled measurements, simultaneous measurement dimensions, automatic rep detection, workout programming, cloud sync, phone companion or store purchase system. Website domain migration is separate. Pricing, regions, publisher details, registered app ID and exact validated launch device list remain release decisions; do not invent them. This planning change does not authorize account registration, submission or publication by itself.

## Capabilities

### New Capabilities

- `practice-sessions`: two recording modes, single measurement type, adjustments, unit-safe events and undo.
- `session-history`: explicit finish/save, durable summaries, recovery and prototype migration.
- `practice-timers`: session stopwatch, duration countdown, manual recording and background expiry alerts.
- `store-release-readiness`: independent identity, device qualification, release artifacts and evidenced submission/publication.

### Modified Capabilities

None. The durable spec inventory is empty. Completed website changes remain separate; their capture/provenance and approval gates must be preserved when app changes require refreshed marketing assets.

## Impact

- `app/page/session.js`: currently version 1, `distanceM`, boolean `made`, 1000-attempt cap and `putting-session-v1`; becomes the generic domain with explicit migration.
- `app/page/index.js`: currently one fixed rectangular native screen with two colour-named hardware keys; add setup, mode-aware recording, timing, summary/history views and device-appropriate controls.
- `app/app.json`, `app/app.js`, icon assets and new App Service: currently API 4.0/Bip Max only, local-storage permission only; add verified alarm/notification integration and qualified targets.
- Host tests, pinned Zeus build configuration, device evidence and release documentation; no new runtime framework or dependency on another checkout.
- Website capture tooling and reviewed hero depend on app UI identity; update their fixtures/capture flow and obtain new artwork/site approval when the release UI changes. No automatic website publication.
