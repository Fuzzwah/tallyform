# Tasks

## 1. Qualify the background alarm path

- [x] 1.1 Add a minimal native alarm-triggered App Service using the documented one-shot alarm and notification permissions; build with `npm run build` and demonstrate expiry notification on the physical Bip Max with the app closed and separately with the screen asleep. Record package/firmware identity and observations, not a simulator-only success claim.
- [ ] 1.2 Exercise callback parameters, committed shared-state reads, stale-token cancellation, foreground notification delivery, permission/scheduling failure and duplicate-delivery handling within the service's 600 ms limit. Verify receipt handling respects screen-on filesystem restrictions; document the selected mechanism in the design and watch-validation notes. Stop timer integration if these mandatory behaviors cannot be met; do not substitute foreground-only alerts.
- [x] 1.3 Inventory broad-support candidate models from pinned device metadata and official API information; deliver a matrix of geometry, inputs, minimum APIs and background alert capability with candidates clearly distinguished from qualified targets. Record why excluded candidates fail, without silently narrowing the product to Bip Max.

## 2. Generic session domain and measurement behavior

- [x] 2.1 Extend the pure session domain for explicit simple/outcome modes, one fixed measurement type and immutable-value events; verify tests for recording, empty rates, undo, selected-value versus session totals and prevention of type/mode reinterpretation.
- [x] 2.2 Implement distance/weight/duration conversion, unitless sessions and configurable steps using bounded canonical integers; verify exact 10 ft/3.048 m grouping, pound/ounce conversion, round trips, boundary values, intermediate overflow rejection and no historical relabelling. Document actual units, bounds and precision in the product brief.
- [x] 2.3 Replace putting-only capacity/reset semantics with a bounded session that can finish/save; verify full-capacity attempts preserve all existing events and controls do not create fabricated outcomes. Run `npm test` and `npm run build` and exercise domain transitions with a throwaway smoke driver; record results in continuation notes.

## 3. Persistence, migration and summaries

- [x] 3.1 Implement verified versioned persistence for active state and independently recoverable summary history, using the shared-read mechanism qualified in group 1. Verify failed/torn writes, corrupt records and unknown versions retain the previous committed data and do not display false success.
- [x] 3.2 Implement idempotent import of valid `putting-session-v1` data with exact event distances/order/outcomes, usable controls and unknown legacy timestamps; test interrupted and repeated migration. Document the same-app-identity boundary and preserve development data before a registered-ID cutover; verify no old write path remains.
- [x] 3.3 Implement summary construction, stable-ID finish commits, history capacity and confirmed deletion; test grouped summaries, empty timed sessions, retry after summary commit, restart recovery and capacity without silent eviction. Verify active discard cannot erase saved history.
- [x] 3.4 Document finish/recovery/deletion and storage limits in the product notes; run `npm test` and `npm run build` and exercise a native save/reopen/history smoke with the current target, recording host versus device evidence separately.

## 4. Timers and native background integration

- [x] 4.1 Implement injected-clock stopwatch and countdown transitions; verify paused intervals, independent concurrent timers, duration snapshotting, explicit restart/cancel, nonnegative recovery and detected clock discontinuity behavior in deterministic host tests.
- [ ] 4.2 Integrate qualified alarm scheduling with pending/armed intents, alarm handles and fresh run tokens; test scheduling rejection, persistence failure after scheduling, cancellation failure, resume supersession and recovery of interrupted intents. Verify UI never claims background protection on failed scheduling.
- [ ] 4.3 Complete the short App Service notification path and cancellation/expiry reconciliation without modifying events/history; test stale callbacks and foreground/background overlap. Physically observe exactly one normal-run alert and no alert for a successfully cancelled run; document any platform crash-delivery limits rather than asserting atomic exactly-once delivery.
- [ ] 4.4 Integrate finish/discard with timer cancellation and frozen stopwatch summaries; test retry after partial finish and verify failed finish retains events while showing actual stopped/running timer state.
- [ ] 4.5 Document timer lifecycle, notification settings and restart limitations; run `npm test` and `npm run build`, then exercise sleep, exit, expiry, pause/resume, cancellation and reopening on the actual watch. Confirm all timer/notification interactions leave counts unchanged in both modes.

## 5. Native user flow and multi-target layouts

- [ ] 5.1 Implement native session setup and mode-aware active recording, retaining the green-card visual language and separate timing controls; exercise both modes across all four measurement types in the simulator and verify unitless UI has no artificial quantity.
- [ ] 5.2 Implement finish/summary, history/detail, deletion and scoped recovery screens; verify actual save/reopen/delete/cancel interactions and readable unknown-date or uncertain-timing states. Capture the resulting native surfaces.
- [ ] 5.3 Replace colour-only hardware assumptions with device-appropriate mappings and complete touch fallback; test that setup, confirmations and non-click key events never record, and physically exercise controls plus system exit/navigation on the Bip Max.
- [ ] 5.4 Implement candidate-family layouts and target configuration from the matrix, including round/rectangular safe areas where applicable; build each declared target using the pinned local Zeus CLI and inspect actual simulator surfaces for clipped text, inaccessible controls and input collisions. Do not mark a family physically qualified from screenshots alone.
- [ ] 5.5 Update feature instructions and reconcile now-resolved product decisions in README, continuation notes, the product brief and OpenSpec project context; remove obsolete putting-specific descriptions only from current-product surfaces. Run `npm test` and `npm run build` and record integrated UI smoke results.

## 6. Identity, physical acceptance and candidate evidence

- [ ] 6.1 Obtain publisher-authorized registration and the actual app ID, resolve pricing/regions/contact/privacy inputs and obtain approval for a Tallyform icon. Update manifest/localized identity and target icon assets only from verified inputs; verify package identity and icon on the watch/app list. Keep this task blocked while required owner inputs are absent.
- [ ] 6.2 Perform independent installation with `npm ci`, run `npm test` and `npm run build`, and build each declared target; record candidate revision/version, package digests and target matrix. Verify a clean install and an applicable same-ID upgrade without relabelling data.
- [ ] 6.3 Physically accept the release candidate on Bip Max and every additionally claimed device family: both modes, unit changes, touch/buttons, finish/history, storage recovery, stopwatch continuity, countdown sleep/exit alerts, cancellation and notification settings. Record exact model/firmware/package and unresolved differences; leave untested models as candidates.
- [ ] 6.4 Refresh affected website capture flow and contract tests for the actual release UI, run the real generator, prepare renewed artwork if its source fingerprint changed and obtain explicit site approval before publication. Verify raw capture/provenance and reviewed artwork are distinct; do not publish merely because generation passed.
- [ ] 6.5 Prepare the store ZAB, real candidate screenshots, description, approved icon and required privacy/contact materials; document limitations and qualified targets in release notes. Verify every listing feature is implemented and every compatibility claim has corresponding matrix evidence.

## 7. Authorized submission and publication

- [ ] 7.1 Present the exact candidate package, listing, pricing/regions and acceptance evidence for owner authorization; verify the approval identifies the artifacts to submit and do not infer approval from implementation completion.
- [ ] 7.2 Submit the authorized package/listing through the publisher's Zepp account and record the submission identifier/status; address review findings with renewed checks for affected behavior and explicit candidate identity. Do not mark this complete without an actual submission result.
- [ ] 7.3 After store acceptance, verify discoverability and installation in an intended region and exercise the installed app's core recording/timer flow; record evidence separately from review acceptance before reporting store publication.
