# Spec Delta

## Purpose

Make the active watch session readable and operable at a glance by prioritizing its selected setting, live counts and recording actions without changing the meaning of saved practice data.

## ADDED Requirements

### Requirement: Setting and counts have a clear active-screen hierarchy
The active practice screen SHALL make the current mode and measurement type identifiable, present the selected setting as the primary visual value when a measurement exists, and distinguish totals for that selected value from whole-session totals. Outcome mode SHALL display a success fraction for the selected value and a whole-session success percentage when defined. Simple mode SHALL display rep counts without a success/failure classification or percentage. Empty outcome totals SHALL NOT be represented as a zero-percent success rate.

#### Scenario: Outcome events at two distances
- **WHEN** an outcome session has five successes and one failure at 4 m and other events at a different selected distance
- **THEN** the 4 m screen visibly distinguishes `5/6` at the selected value from the success percentage over all session events

#### Scenario: Simple session without successes
- **WHEN** a user opens an active simple-count session with a measurement
- **THEN** the screen emphasizes its selected value and rep counts without Success, Failure or a percentage

#### Scenario: Empty outcome session
- **WHEN** an outcome session has no events
- **THEN** the screen shows no invented success percentage, while recording controls remain available

### Requirement: Recording and measurement actions match the session
The active screen SHALL offer large, distinct, labelled recording controls appropriate to the fixed session mode. Success and Failure SHALL be distinguishable by text and non-colour visual cues as well as styling; simple mode SHALL offer Record rep instead of outcome controls. For distance, weight and duration-setting sessions, the user SHALL be able to adjust the selected value and change compatible units without rewriting earlier events. A unitless session SHALL NOT show a fabricated quantity, value-adjustment action or Unit action.

#### Scenario: Outcome recording by touch
- **WHEN** a user taps Success and then Failure on the active outcome screen
- **THEN** one event of each kind is recorded at the setting selected at each tap and the displayed totals update

#### Scenario: Simple counting by touch
- **WHEN** a user taps Record rep in simple mode
- **THEN** one rep is recorded and neither Success nor Failure appears as an available recording action

#### Scenario: Unitless action set
- **WHEN** a user opens an active session with no measurement
- **THEN** the screen shows counts and relevant recording/undo actions but no quantity, Unit action or value adjustment

#### Scenario: Compatible unit change
- **WHEN** the user records at a selected distance, changes its display unit and adjusts the next selected value
- **THEN** the original event retains its canonical distance and the current setting is clearly labelled with its current unit

### Requirement: Prominent finish with safe secondary navigation
Finish SHALL be visually distinct from routine recording controls and SHALL open the existing confirmation before saving. Undo, Unit where applicable, and an entry to the existing session options SHALL remain reachable from the active screen. The options view SHALL retain step size where applicable, History when available, confirmed Discard, Back and Exit; a header settings shortcut, if displayed, SHALL open that same options view. When a summary is already committed but active cleanup is pending, the screen SHALL not offer recording or adjustment and SHALL expose the existing completion action. When history is unavailable, Finish SHALL not imply that saving is possible.

#### Scenario: Finish is cancelled
- **WHEN** a user taps Finish and then Cancel
- **THEN** the active session and its recorded events remain available, with no summary created

#### Scenario: Save cleanup is pending
- **WHEN** a verified summary exists for the active session but clearing active state has not completed
- **THEN** the screen offers completion of that finish without offering Success, Failure, Record rep, Undo or value adjustment

#### Scenario: History is unavailable
- **WHEN** active recording is usable but summary history requires recovery
- **THEN** the screen identifies that finish is blocked and does not present an actionable Finish control

### Requirement: Usable watch-sized presentation
The active-screen layout SHALL keep essential text and enabled touch actions within the declared Bip Max design area, without overlapping, clipping, or reducing labels to colour or icons alone. Primary actions SHALL have usable touch targets and remain understandable without reproducing the mock-up's glow, gradients or precise pixel scale. Feedback for an invalid adjustment or failed save SHALL be visible without reporting an event or save that did not occur.

#### Scenario: Long measurement label
- **WHEN** a supported value and unit require more text than the mock-up's `4 m` example
- **THEN** the selected quantity remains readable without covering another action or hiding its unit

#### Scenario: Failed adjustment
- **WHEN** adjustment crosses a supported bound or a save cannot be verified
- **THEN** the user sees an indication and the screen does not claim a new recorded event or a completed save
