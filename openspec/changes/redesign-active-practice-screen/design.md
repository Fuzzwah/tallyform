# Design

## Context

See [proposal.md](proposal.md) and [the active-screen delta](specs/active-practice-screen/spec.md). `app/page/index.js` currently creates one 432×514 widget layout for every view: two brand lines, a 384×110 value card, a status line and eight 186×48 buttons in a two-column grid. `render()` composes labelled actions, `press()` dispatches by slot, and key/gesture handlers already guard view and committed state. A single `ui.widget.BUTTON` colour assignment currently depends on slot rather than action, so the new visual priority needs an active-specific layout, not merely reordered labels. The [reference mock-up](mockup-active-outcome.png) is illustrative at 1145×1374; it is not a simulator or physical-watch capture.

## Goals / Non-Goals

**Goals:** Preserve the existing page's state transitions and native event handlers; present its active data and actions with the visual hierarchy in the reference; fit and exercise the declared Bip Max target, including long units, simple and unitless states, errors and pending finishes.

**Non-Goals:** New recording/timer/storage semantics, additional device targets, pixel-for-pixel glow/gradient reproduction, an alternate settings page, changed hardware mappings, or alteration/publication of the independently approved website hero.

## Decisions

### 1. Two native widget arrangements, one action dispatcher

Keep the existing setup/confirmation/history/recovery widgets and their layout, and add an active-only set of text, card shapes and buttons. In `render()`, hide the inactive arrangement before populating the visible one; the active branch computes existing `practiceTotals`, uses the existing `formatValue`, and binds buttons through the same slot/action dispatch path as today. Avoid a second page or a separate copy of session state. Dedicated active recording/action widgets allow position, width, colour and labels to reflect their action rather than old slot positions. Alternatively, repositioning all shared widgets on each render would disturb unrelated confirmation and history screens and increase stale hit-area risk. Maintain button visibility and click dispatch together so invisible controls cannot be tapped.

### 2. Responsive hierarchy within existing design width

Use `px()` coordinates in the 432×514 design area with horizontal insets and distinct bands: brand/header; dominant green value card (mode/type, selected quantity, in-card adjustment affordances, selected and total figures); recording row; compact Undo/More/Unit row; full-width Finish band. Preserve margins to the screen edge and room for action labels. For the card, place step controls within its bounds but choose spacing/arrangement by actual simulator render rather than scaling the mock-up's tall centered arrows literally. Use the existing formatting/precision and accommodate the widest supported displayed values/units using measured text, smaller typography or a deliberate short supported format—not truncation that hides a unit or a change to the canonical value. Render label+shape cues for Success/Failure in addition to colour; plain native rounded rectangles and stable contrast replace literal gradients/glow. Do not overlay decorative artwork on touch targets. The mock-up's gear may open the existing options view only if the header leaves a usable target; More remains the guaranteed path. An image of the entire mock-up is rejected because the app must expose real native controls and live data.

### 3. Derive variants from current state; never invent actions

Build the active configuration from `active.mode`, `active.measurement.type`, `practiceTotals(active, m.selected)`, `practiceTotals(active)`, `historyIssue` and whether history already contains the active ID. Outcome/measurement shows a selected-value success fraction and whole-session percent (dash for empty percent); simple/measurement shows selected and total rep counts; unitless shows mode and counts rather than a synthetic `0` quantity. Omit adjustment and Unit entirely for `none`. Reserve the optional Unit slot without compressing essential controls in unitless mode. `Finish` routes to existing confirmation, unless history is unavailable, in which case a legible blocked status replaces it; pending finish exposes only `Complete finish` (or Exit if history cannot be read) and no recording/measurement hit targets. `More` retains the existing options screen for step size, history, confirmed discard, Back and Exit. Avoid hard-coded outcomes, per-mode storage paths, or duplicated save logic.

### 4. Error and input states are first-class layouts

Reserve a legible message area by substituting the secondary brand line/status area when an error occurs, without covering the value or controls. Keep existing `committed()` recovery and write verification, `finish()` semantics, and `handleKey`/`handleGesture` guards. One touch action maps to one existing transition; confirmation and setup remain isolated from recording. A status-only layer must not make blocked Finish look tappable. An alternative transient toast risks hiding the reason a finish is blocked or a save was not verified.

## Risks / Trade-offs

- **[Small watch versus tall artwork]** → Prioritize value, record, Undo, More and Finish at readable sizes; review actual simulator captures at the declared resolution and adapt spacing before accepting the layout. A 432×514 simulator still cannot qualify a reported smaller or physical screen.
- **[Many native widgets, stale hit targets after view changes]** → Centralize visibility/action assignment, clear old slot actions each render, and exercise active → confirmation → active, options and recovery transitions in the host native-page harness and simulator.
- **[Value overflow in weight/duration/feet or maximal settings]** → Exercise real maximum display strings and unit changes; reserve card width or adapt text size without changing conversion/rounding.
- **[New screenshot diverges from reviewed marketing asset]** → Refresh development capture automation for the new control geometry; retain the existing website hero untouched until separately reviewed and approved.
- **[Visual verification scope]** → Host page tests prove state/action mapping; simulator screenshots prove layout only in that emulator. Physical Bip Max and release qualification remain gated by the release change.

## Migration Plan

No data migration or new dependency: preserve the active/history schemas and legacy importer. Roll forward by switching only the active view; rollback can restore the prior native layout without reinterpreting stored events. Do not republish website assets or mark the parent release's multi-target/physical gates complete as part of this change.
