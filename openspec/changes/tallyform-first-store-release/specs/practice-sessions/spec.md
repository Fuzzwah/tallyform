# Spec Delta

## Purpose

Provide activity-neutral manual practice recording with explicit outcome modes and one measurement dimension per session, preserving the meaning of every recorded event.

## ADDED Requirements

### Requirement: Explicit recording modes
The app SHALL offer simple counting and success/failure modes at session creation. It SHALL show the active mode and corresponding actions. Only explicit user recording actions SHALL add events; undo SHALL remove the most recent event without changing current settings. Simple mode SHALL show rep count without a success percentage; outcome mode SHALL show successes, failures and success percentage, with no percentage for an empty group.

#### Scenario: Simple counting and correction
- **WHEN** the user records three reps and undoes once in simple mode
- **THEN** the session contains two reps and no invented success/failure classifications

#### Scenario: Outcome recording
- **WHEN** the user records two successes and one failure in outcome mode
- **THEN** the session reports three attempts, two successes, one failure and 67 percent success

### Requirement: One measurement dimension per session
The app SHALL offer distance, weight, duration-setting and no measurement. Mode and measurement type SHALL remain fixed once a session starts; changing either SHALL require finishing/saving or explicitly discarding that session. Selected value, compatible display unit and adjustment step SHALL remain adjustable. Unitless sessions SHALL have no artificial measurement value.

#### Scenario: Prevent reinterpretation
- **WHEN** a user with recorded weight reps requests a distance session
- **THEN** the app requires resolving the existing session and does not reinterpret its weight values as distances

#### Scenario: Unitless practice
- **WHEN** the user starts a unitless session
- **THEN** recording and undo work without a measurement selector or fabricated distance

### Requirement: Unit-safe measurement adjustments
Distance SHALL support cm, m, km, in, ft, yd and mi; weight SHALL support g, kg, oz and lb; duration SHALL support seconds, minutes and hours. Compatible unit changes SHALL preserve quantity and recorded grouping. Each event SHALL retain its measurement value at recording time. The app SHALL reject non-finite, non-positive or out-of-range values/steps and display its supported limits. It SHALL support longer distances than the prototype's 30.48 m maximum.

#### Scenario: Conversion does not rewrite records
- **WHEN** a user records at 10 ft, changes display to metres, then adjusts the selected value
- **THEN** the original event remains at exactly 3.048 m and is not relabelled with the new selected value

#### Scenario: Selected and whole-session summaries
- **WHEN** a session contains events at two different values
- **THEN** the user can distinguish selected-value totals from whole-session totals and converting units does not split equivalent quantities

#### Scenario: Invalid adjustment
- **WHEN** an adjustment would exceed the displayed bound or has an invalid step
- **THEN** no invalid value or event is stored and the user receives a boundary or validation indication

### Requirement: Device-appropriate manual controls
Recording, undo and essential navigation SHALL be available by touch on every supported target. Hardware controls SHALL use model-appropriate labels and explicit mode mappings rather than requiring silver/red buttons. Non-click key events SHALL NOT duplicate recordings; setup and destructive confirmations SHALL NOT record events. A session capacity limit SHALL reject extra events without deleting existing ones and allow finish/save.

#### Scenario: Touch-only operation
- **WHEN** no usable hardware recording buttons are configured
- **THEN** the user can complete either recording mode using touch

#### Scenario: Input isolation
- **WHEN** a key is pressed during setup or a destructive confirmation
- **THEN** it does not add an event to the session
