# Tasks

## 1. Active practice layout and interaction

- [x] 1.1 Implement an active-only native widget arrangement in `app/page/index.js`: prominent selected-value card with mode/type and selected/all figures, in-card value controls, mode-specific large recording actions, compact Undo/More/Unit, and distinct full-width Finish. Preserve the existing actions and state guards; verify visually in the Bip Max simulator at 432×514 that primary actions are readable and not clipped.
- [x] 1.2 Support outcome, simple and unitless variants plus empty totals, history-unavailable and pending-finish states; update `tests/native-practice.test.js` for consumer-visible taps, counts, unit preservation, finish confirmation/cancel, error feedback, hidden hit targets and option navigation. Verify with `node --test tests/native-practice.test.js`.
- [x] 1.3 Update `docs/continuation.md` with the active-screen behavior, mock-up-versus-native layout limits and unchanged storage/timer gates. Verify the text against the delivered active screen, not the reference artwork.

## 2. Simulator visual evidence and capture workflow

- [x] 2.1 Update `tools/capture-simulator.mjs` and any affected capture-tool tests for the new active-screen control geometry, retaining verification of clean setup and the real `4 m`, `5/6 here`, `83% total` state. Verify the script's test command and run the simulator capture against an installed fresh build; do not replace a real capture with synthetic marketing artwork.
- [x] 2.2 Inspect actual Bip Max simulator screens for both modes across all four measurement types, long converted units and supported value bounds, no-events, confirmation/cancel and options/back; adjust layout/contrast/hit areas where needed and retain captures or explicit observations in `docs/continuation.md`. Verify no control or label is clipped and that input changes the expected session state. Exercise history-unavailable and pending-finish paths in the native-page harness under task 1.2, using injected persisted state. Simulator evidence is not physical-watch acceptance.
- [x] 2.3 Update `docs/website-generation.md` or the existing capture guidance for changed control locations and the stale approved hero's approval gate; verify capture instructions reflect the revised installed app and do not trigger publication.

## 3. Integration checks

- [x] 3.1 Run `npm test` and `npm run build`, then smoke the installed Bip Max app through recording, adjustment, undo, Finish → Cancel, Finish → save, and reopen/history. Confirm preserved event meaning and scoped recovery; report simulator evidence separately from the unperformed physical-watch and store release gates.
