# Proposal

## Why

The current Bip Max active screen puts the selected value in a small card and treats recording, value adjustment, and Finish as nearly equal grid actions. The supplied mock-up gives the watch's primary task—glancing at a setting and recording an event—a clearer visual hierarchy, but its 1145×1374 composition cannot be copied literally into a 432×514 native layout.

## What Changes

- Redesign the **active practice screen** around the supplied [outcome/distance visual target](mockup-active-outcome.png): dominant selected value, in-card adjustment controls and selected-versus-whole-session figures; conspicuous, separately labelled recording actions; compact secondary actions; and a prominent full-width Finish action.
- Adapt that hierarchy to **both existing modes and all four existing measurement types**. Simple mode retains Record rep and no invented outcome rate; unitless mode has no value adjustment or Unit action. Existing bounds, event snapshots, unit conversion, undo, confirmed finish and storage/recovery behavior remain unchanged.
- Keep every existing active-session path reachable: Unit where relevant; More for step size, history, discard, Back and Exit; and the current finish confirmation. Treat the mock-up's gear as an optional visual entry into the existing options view, **not** a second settings flow.
- Implement the target using native Zepp OS widgets and resources with readable contrast, practical touch targets and input isolation. Visual glow/gradients are reference styling, not a demand for an exact bitmap recreation or a new UI framework. No breaking data/API change is proposed.
- Replace stale active-screen assumptions in capture guidance and tests; new simulator captures are technical evidence only. Existing reviewed website artwork depicts an older UI and requires separate renewal and approval before publication.

## Capabilities

### New Capabilities

- `active-practice-screen`: Watch-sized, mode- and measurement-aware presentation and touch interaction for the active session, including visual priority and action availability.

### Modified Capabilities

None. `openspec/specs/` has no authored baseline. The in-progress `tallyform-first-store-release` change already specifies session semantics and later multi-target/physical gates; this change adds a focused presentation contract without replacing or marking those gates complete.

## Impact

Primary implementation surface is `app/page/index.js` and its native widget/assets layout, with active-screen behavior covered by `tests/native-practice.test.js`. Measurement and persistence modules stay semantically unchanged. Simulator capture automation and current-product guidance may need adjustment if control positions or labels change; the historical approved website hero is not automatically updated or republished. Bip Max is the only declared target; round and smaller-device layouts, new hardware mapping, native timers/background alerts and store identity remain separate release work.
