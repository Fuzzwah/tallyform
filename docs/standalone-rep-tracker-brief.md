# Standalone rep tracker — product and release brief

Draft, 2026-09-29. This records the requested direction and proposed decisions; the standalone app has not yet been implemented or submitted. Basket Birdie remains a separate product.

## Product

A watch-first manual repetition and attempt tracker. Choose a practice setting, adjust its value by swiping, and record each repetition with a physical button or touch. Retain the green/black card layout from the putting prototype, with activity-neutral branding and labels.

Working name recommendation: **Tallyform**, with store descriptor **Reps & Practice Tracker**. This is a candidate, not an approved or reserved name. Preliminary web research did not establish availability. RepMark, Repwise and RepKeeper already have fitness-app uses and are poor candidates for differentiation.

## Measurement model

Separate the activity, recording mode, measurement type, display unit, selected value and adjustment step. The repetition count is an outcome, not the measurement setting itself.

| Type | Initial unit choices | Example setting | Example step |
| --- | --- | --- | --- |
| Distance | cm, m, km, in, ft, yd, mi | 7.5 m putting; 400 m laps | 0.5 m; 100 m |
| Duration | seconds, minutes, hours | 30 s holds | 5 s |
| Weight | g, kg, oz, lb | 20 kg lifts | 2.5 kg |
| Custom numeric | user-defined label, no automatic conversion | level 5; resistance 8 | 1 |
| None | no unit | ordinary rep counting | not applicable |

Use type-specific defaults, bounds and precision rather than the current 1–100 ft range. Allow a convenient configurable step, and preserve the physical quantity when changing compatible units. Unit changes must not round or rewrite old attempts. Store each event's measurement type, canonical value, custom-measure identity if any, and outcome so later UI adjustments cannot relabel history.

Convert only within a measurement type. Metres and feet share a distance dimension; kilograms and minutes do not. Changing type should start a new session or a clearly separated activity, not reinterpret previous records. Keep summaries separated by activity and measurement. Use stable fixed-scale values or documented rounding rules so equivalent unit conversions group correctly.

Duration as a selected practice setting is separate from a stopwatch or countdown. A timer is an additional feature requiring start/pause/resume and sleep behavior; do not imply automatic timing in a release that only records a manually selected duration.

## Decisions awaiting user input

- Recording mode: success/failure attempts only, simple repetitions only, or both? Recommendation: both. In simple mode silver adds a rep and red undoes the last rep; in outcome mode silver logs success and red logs failure. Mode labels and onboarding must make this distinction explicit.
- One measurement per session or several simultaneous measurements? Recommendation: one for the first release. Weight and duration together would require a different setup and results screen.
- Final app name and publishing identity.

## Proposed first store release

- Independent app source, package manifest, pinned development dependencies, lockfile and build/test commands; no `../../node_modules` dependency on Basket Birdie.
- Activity-neutral name, own icon, description and account-registered app ID. Current ID 1126719 is a local development ID whose registration has not been verified.
- Configurable measurement, recording mode once selected, undo, session finish/summary, local saved history and recovery. History is a proposed addition: the prototype currently only retains one session and clears it on reset.
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

The prototype's successful build and simulator screenshots are not store submission or physical acceptance evidence. Account registration and review status have not been checked. This brief does not claim the app is release-ready.
