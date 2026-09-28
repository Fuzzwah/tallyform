## Why

Putting practice needs quick manual made/missed recording at a chosen distance. A separate Bip Max test app lets the owner try this interaction without changing the deployment probe or the planned round scorecard.

## What Changes

- Add a standalone putting test package with vertical swipe distance selection and metres/feet options.
- Map silver to made and red to missed through first-run button setup, with touch alternatives.
- Show selected-distance and session totals, undo, confirmed reset, and local session recovery.
- Add host tests, build command and a physical-watch acceptance checklist.

## Capabilities

### New Capabilities
- `putting-practice`: Experimental manual putting session and watch controls.

### Modified Capabilities
None.

## Impact

Experimental phase only, independent of production phase gates. Reuses Zeus and native widgets; no new dependencies, GPS, sensors, cloud or round integration. Physical key delivery, wake behavior, layout and persistence still require Bip Max validation. New package lives under `experiments/putting-practice` with its own app identity and local storage.
