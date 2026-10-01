# Standalone rep tracker — product and release brief

Draft, 2026-09-29. This records the requested direction and proposed decisions; the Tallyform app has not yet been submitted. Basket Birdie remains a separate product.

## Product

A watch-first manual repetition and attempt tracker. Choose one practice setting per session, adjust its value by touch or swipe and record through touch. Imported legacy key mappings remain usable; new-session physical mapping awaits device-specific validation. The native page retains a green/black value card.

Product name: **Tallyform**, with store descriptor **Reps & Practice Tracker**. The name is confirmed for this repository; store availability and publisher registration have not been verified. RepMark, Repwise and RepKeeper already have fitness-app uses and are poor candidates for differentiation.

## Measurement model

Separate the activity, recording mode, measurement type, display unit, selected value and adjustment step. The repetition count is an outcome, not the measurement setting itself.

| Type | Initial unit choices | Example setting | Example step |
| --- | --- | --- | --- |
| Distance | cm, m, km, in, ft, yd, mi | 7.5 m putting; 400 m laps | 0.5 m; 100 m |
| Duration | seconds, minutes, hours | 30 s holds | 5 s |
| Weight | g, kg, oz, lb | 20 kg lifts | 2.5 kg |
| Custom numeric | user-defined label, no automatic conversion | level 5; resistance 8 | 1 |
| None | no unit | ordinary rep counting | not applicable |

Use type-specific defaults, bounds and precision rather than the inherited 1–100 ft range. Allow a configurable step and preserve the physical quantity when changing compatible units. Fix one measurement type per session; store each event's immutable canonical value and mode-specific kind so later UI adjustments cannot relabel history. Custom numeric identity is a separate, unimplemented proposal.

Convert only within a measurement type. Metres and feet share a distance dimension; kilograms and minutes do not. Changing type should start a new session or a clearly separated activity, not reinterpret previous records. Keep summaries separated by activity and measurement. Use stable fixed-scale values or documented rounding rules so equivalent unit conversions group correctly.

Duration as a selected practice setting is separate from a stopwatch or countdown. A timer is an additional feature requiring start/pause/resume and sleep behavior; do not imply automatic timing in a release that only records a manually selected duration.

## Implemented measurement contract and native source

`app/page/measurements.js`, `app/page/session.js` and the Bip Max native page implement the following bounds, fixed-type sessions, simple/outcome modes and versioned active/history files. This is source and simulator evidence, **not** physical-watch or store acceptance.

| Type | Display units | Selected-value bounds | Canonical resolution | Step bounds / initial setting |
| --- | --- | --- | --- | --- |
| Distance | cm, m, km, in, ft, yd, mi | 0.001 m–100 km | integer micrometres (1 µm) | 1 µm–100 km; initially 5 m with a 1 m step |
| Weight | g, kg, oz, lb | 0.001 g–1000 kg | integer nanograms (1 ng) | 1 ng–1000 kg; initially 1 kg with a 0.1 kg step |
| Duration setting | s, min, h | 1 s–24 h | integer milliseconds (1 ms) | 1 ms–24 h; initially 60 s with a 1 s step |
| None | none | no selected value | `null` | no step; simple/outcome events carry no fabricated quantity |

Unit factors are exact integers: 1 ft = 304,800 µm; 1 oz = 28,349,523,125 ng; 1 lb = 453,592,370,000 ng. Input is rounded **once** to the nearest canonical integer; intermediate multiplication must remain within JavaScript's safe-integer magnitude, and invalid/overflowing/out-of-bound values or steps are rejected rather than clamped. Compatible unit changes only change presentation: selected and recorded canonical values and the physical step do not change. A displayed decimal is not used to reconstruct an event. Durations here are manually selected practice values; the independent stopwatch/countdown feature remains gated by background alert qualification.

## Selected and unresolved decisions

- Both simple repetitions and success/failure attempts are implemented. The mode and single measurement type are fixed at session start; imported legacy sessions use outcome/distance. New-session hardware mapping and physical input checks remain open.
- One measurement type per session is implemented. Custom numeric settings are not implemented; duration is a selected value, not a running timer.
- Store regions, pricing, publisher details and account-registered app ID remain unresolved.

## Data compatibility and limits

The native foreground page stores active practice v2 and summary history v1 in separate verified files. A finish saves one stable-ID summary before clearing the active record; a failed clear freezes recording until cleanup can be retried. History holds at most 100 summaries and each session at most 1000 events. Full capacity rejects new records or a further summary without evicting saved data. Discard clears only active state; deletion of a summary requires confirmation. Corrupt or unsupported storage stays intact for recovery rather than being reset.

A valid `putting-session-v1` snapshot imports only within the **same app ID/storage identity**. Legacy distances, event order, outcomes and configured keys survive; start/stopwatch times remain unknown. The legacy key is never rewritten or erased, and an empty committed active record prevents reimport after finish/discard. The inherited ID `1126719` is development metadata, not verified publisher registration. Back up development data and verify same-ID upgrades before an authorized ID cutover; no cross-ID transfer is implemented.

## Proposed first store release

- Independent app source, package manifest, pinned development dependencies, lockfile and build/test commands; no `../../node_modules` dependency on Basket Birdie.
- Activity-neutral name, own icon, description and account-registered app ID. Current ID 1126719 is a local development ID whose registration has not been verified.
- Configurable measurements, fixed recording mode, undo, verified active save, finish/summary, bounded saved history and recovery are implemented in native source. Host/simulator checks do not establish physical acceptance.
- Offline manual recording, touch fallback and device-appropriate physical controls. Button colours must not be the only instructions across models.
- Start with the Bip Max target that can be physically tested. Do not advertise untested targets.
- Recommend free initial release to focus on the submission experience; pricing remains a user decision.

## Path to publication

Official reference checked 2026-09-29: https://docs.zepp.com/docs/distribute/

1. Resolve name and product decisions, then specify and implement the standalone release.
2. Register a separate Mini Program in the Zepp Developer Console using the publisher's account; use its assigned app ID in the manifest.
3. Validate measurement arithmetic, saved history, migrations, counters and corrections on the host. Run the actual release candidate on the Bip Max, including physical input, sleep/wake, exit/reopen, layout and storage recovery.
4. Build the ZAB, prepare accurate screenshots, icon, description and the console's required listing/contact/privacy information. Record release version, build provenance, tested targets and known limitations.
5. Upload the release package and listing, submit for review, respond to review findings, and verify the published app is discoverable and installable in the intended store region.

The native source's successful build and simulator capture are not store submission or physical acceptance evidence. Publisher registration and review status have not been verified; this brief does not claim release readiness.
