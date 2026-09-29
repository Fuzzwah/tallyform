# Design

## Context

See proposal.md for motivation. Inspection found one native page, pure session transitions and synchronous LocalStorage verification. Version 1 stores distances rounded to 0.0001 m and boolean outcomes; no history or timers exist. The page assumes a rectangular 432-wide design and two colour-labelled keys. The manifest declares API 4.0, one Bip Max deviceSource and local storage only. Existing host tests exercise conversion, bounded events, undo, invalid snapshots, failed saves and native input through a VM harness.

The durable spec inventory is empty; completed website changes are not a generic tracker baseline. Earlier project notes/config still call some now-confirmed decisions unresolved: this proposal uses the conversation's confirmed Tallyform identity, two modes, one measurement, history and both live timers with manual recording/background alerts. Update those notes during implementation, not during this planning-only change.

## Goals / Non-Goals

**Goals:** keep domain transitions native-independent; preserve data meaning; keep background work short; separate evidence levels; qualify as many compatible watch families as practical without weakening the timer contract.

**Non-Goals:** continuous background polling, a second UI framework, cloud storage, backward-writing the old schema, or treating API documentation as proof of watch behavior.

## Decisions

### 1. Extend the pure domain and keep native effects at the boundary

Retain `app/page/session.js` as the session transition entry point. Extract focused measurement, timer and persistence helpers when responsibilities require them, rather than creating a generic state framework. Native pages dispatch actions and render only committed state. Inject clock values into timer transitions; host tests must not depend on real time. Keep alarm scheduling, notifications, filesystem/storage and device inputs in adapters.

Proposed session shape: schema version, stable session ID, optional start time, mode, measurement configuration, ordered immutable-value events, stopwatch state and countdown state. A simple event has a rep kind, not `made: true`; outcome events have success/failure. Configuration uses one type with a selected canonical value, display unit and step. Events snapshot canonical quantity; changing unit never reconstructs events from rounded labels. Mode/type changes require resolving the current session.

### 2. Exact bounded quantities, not floating display values

Use integer canonical units and rational unit factors: distance in micrometres, weight in nanograms, duration in milliseconds. These exactly represent the prototype precision, imperial distance factors and pound/ounce factors while remaining within safe integers for chosen bounds (1000 kg is 10^15 nanograms). Round user input once at the documented canonical boundary, not on every display conversion. Reject overflow/non-finite inputs before transition, including intermediate multiplication overflow. Group on canonical values.

Proposed engineering defaults for review: distance 0.001 m to 100 km, weight 0.001 g to 1000 kg, duration 1 second to 24 hours; steps use compatible displayed units, are positive and cannot exceed the type range. Preserve 1000 active events as the existing memory bound, but offer finish/save instead of forcing reset. These bounds are proposed defaults, not previously agreed product choices; display them and cover edges in tests. Unitless events have no quantity. The first release does not expose custom unit labels.

### 3. Durable active state and bounded summary history

Use a versioned repository with independently recoverable active state and saved summaries. Native filesystem-backed, read-verified generation records are proposed for shared access with the App Service; keep LocalStorage only as the legacy import source. Commit new generations before replacing pointers, preserve a last verified generation, and validate on load. Do not treat a successful API return alone as power-loss durability evidence.

Summaries retain aggregate groups and stopwatch time, not an unbounded archive of every event. Proposed capacity is 100 summaries with explicit deletion and no automatic eviction. Finish uses the stable session ID as its idempotency key: cancel the countdown, freeze timing, write/verify the summary, then clear the active record. A crash after summary commit but before active clear must not duplicate it. If finishing fails after timer cancellation, retain events and explicitly show the stopped timer rather than pretending it still runs. Delete confirmations affect only the selected history entry.

### 4. Independent stopwatch and countdown state machines

Stopwatch: idle -> running <-> paused -> finished. Store accumulated elapsed time and an anchor for a running segment. Countdown: idle -> running <-> paused -> expired; cancel returns to idle. Start snapshots the duration and assigns a fresh run token. There is one countdown per active duration session. The stopwatch can run concurrently and does not count as another measurement.

Use timestamps to reconstruct progress instead of counting UI ticks. Refresh visible timer text only while needed. Persist controls, not every tick. Foreground rendering can observe expiry but must not send a second alert; the alarm service owns expiry notifications. No timer transition dispatches recording or undo. A manual record does not start/restart the countdown. Completed countdowns wait for explicit next start.

Persist sufficient wall-clock/deadline state for app-exit recovery; use a verified monotonic source for live elapsed calculations when available. Record detectable discontinuities and show uncertainty after an inconsistent restart/timebase rather than inventing continuity. Reboot persistence is a best-effort recovery mechanism, not a promise of an alert while the watch is powered off. Normal sleep and app exit are mandatory supported paths.

### 5. One-shot OS alarm wakes a short App Service

Use `@zos/alarm` to schedule the next countdown expiry with a one-shot service URL, absolute deadline, persistent storage and session/run token. Declare `device:os.alarm` and `device:os.notification` permissions and the App Service module in target manifests. A zero alarm ID is failure. The service sends a system notification with the supported attention signal and a non-recording action. A zero notification ID is a delivery failure, not successful alert evidence.

This is selected over a continuously running service: the official guide recommends single execution, limits it to 600 ms, disallows ordinary global timers there, and documents continuous-service permission/conflict overhead. No busy loop or per-second background callback is required. The service must finish promptly and use no native widgets.

Alarm start is an effect transaction: persist a pending run intent; schedule; persist the returned handle/armed state; then acknowledge success in UI. If scheduling or the final commit fails, invalidate the token and cancel any created alarm, reporting cleanup failures. Reconcile interrupted pending intents on launch. Before pause/cancel/finish/discard, invalidate the token durably and cancel the scheduled alarm; failures remain visible. Resume schedules a new token/deadline so stale callbacks cannot act on it.

The service reads the current committed token and deadline rather than trusting callback parameters alone. It never writes session events or history. Use one notification owner and per-run delivery bookkeeping where supported to prevent repeated alerts in normal operation; do not claim atomic exactly-once delivery across a crash between a notification side effect and its receipt. Notification dismissal never records an event.

**Specific platform qualification gate:** demonstrate shared committed-state reads, callback parameter delivery, stale-token suppression, notification delivery while another app is foreground, and delivery bookkeeping within 600 ms on the physical Bip Max. The service guide restricts filesystem writes to screen-off/AOD; therefore service-side receipt writes cannot be assumed safe with the screen on. Keep session mutations foreground-owned and verify a permitted receipt mechanism or OS one-shot semantics before accepting duplicate-delivery handling. If the chosen primitive cannot meet the contract, report the evidence and revise the design rather than shipping a foreground-only substitute. This gate precedes full timer integration.

Sources inspected for this plan:
- [App Service lifecycle, restrictions and permissions](https://docs.zepp.com/docs/guides/framework/device/app-service/)
- [Alarm scheduling, persistent alarms and failure IDs](https://docs.zepp.com/docs/reference/device-app-api/newAPI/alarm/set/)
- [Notification delivery and vibration limitations](https://docs.zepp.com/docs/reference/device-app-api/newAPI/notification/notify/)

All three facilities are documented from API level 3.0, but the existing package targets 4.0. Do not lower the manifest minimum until all used APIs, packaging and actual devices have been checked. Notification attention behavior depends on motor support and watch notification policies; do not bypass DND or promise identical vibration effects across models.

### 6. Native screen flow and controls

Use native setup -> active practice -> finish/summary and history -> summary detail views. Keep the green value-card and distinct action-card visual language. Simple mode shows Record rep plus Undo; outcome mode shows Success and Failure plus Undo. Label the actual model's buttons or use neutral configured action labels; touch remains sufficient. Avoid intercepting system navigation unnecessarily.

Timer controls must be separate from scoring and visible mode labels. Duration sessions show the next setting and current countdown snapshot distinctly. Use scrolling or secondary native views rather than shrinking all setup/history/timer controls into the prototype's footer. Derive layouts from qualified geometry/safe areas and test rectangular and round candidates before adding them to the supported list.

### 7. Compatibility and release are evidence gates

Inventory candidate models from the pinned device types and current Zepp compatibility documentation, grouped by geometry, input and timer/notification capability. Record candidates, builds, simulator observations and physical family evidence separately. Do not preselect a new model list or narrow the broad-support goal to Bip Max only. Models unable to meet background alert requirements cannot be advertised as qualified.

Create an approved Tallyform icon and use the publisher-assigned identity only after registration. Store pricing/regions and required legal/contact details are owner inputs at the release gate. Build from pinned dependencies; preserve package digest, source/version and target evidence. Refresh website capture automation and reviewed UI artwork when the app UI changes; retain the existing explicit publication approval gate.

## Risks / Trade-offs

- Background notification delivery differs by firmware and settings -> physical expiry/cancel tests during sleep and app exit; block unsupported targets.
- Cross-process state or filesystem limitations -> early, narrowly scoped alarm-service qualification before UI integration; no unsupported storage assumptions.
- Alarm side effects cannot share a transaction with storage -> pending intents, unique tokens, reconciliation and visible cleanup failures.
- Wall-clock changes and device shutdown -> distinguish normal app-exit continuity from uncertain restart recovery; never use negative or fabricated elapsed time.
- Fixed storage limits -> bounded active events and aggregate history, explicit capacity messaging/deletion rather than silent loss.
- New registered app ID can change storage sandbox -> test migration with the same identity; retain/export original development data before changing identity. Do not promise inaccessible cross-ID automatic import.
- Background alerts exclude older devices without required primitives -> document why candidates fail qualification; changing the agreed behavior requires user approval.

## Migration Plan

1. Complete the alarm/service qualification on the current target before claiming timer feasibility.
2. Implement versioned domain/persistence and import valid `putting-session-v1` data. Convert `round(distanceM * 1000000)` exactly, retain event order/outcomes and usable keys, mark unknown dates/times unknown. Reopening prefers verified new data and never reimports it.
3. Keep legacy bytes until the new representation is verified. Preserve corrupt/unknown data and require scoped explicit recovery. Migrate all current callers; no old write path or compatibility alias remains.
4. Add UI and qualified target packaging, then run host checks and simulator scenarios; perform physical acceptance on the candidate.
5. Update user/release documentation and approved marketing evidence. Register identity and prepare the store candidate with explicit owner decisions.
6. Submit only with owner authorization; track review and verify store installation separately.

Rollback: retain recoverable pre-migration data but never point old code at the new schema. Do not automatically downgrade after new sessions have been recorded; preserve the new dataset and use a forward repair. A failed or unqualified release is withheld rather than published with missing timer behavior.

## Open Questions

Release-only inputs: publisher registration/assigned ID, approved icon artwork, pricing, regions, contact/privacy details, and which candidate families have accessible physical validation hardware. These do not change the capability contracts; absence blocks the relevant release gate. Platform qualification results determine supported targets, not whether background alerts remain required.
