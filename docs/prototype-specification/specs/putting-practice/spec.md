## Purpose

Provide an experimental watch app for manually recording putting practice outcomes at selected distances.

## ADDED Requirements

### Requirement: PP-01 Select practice distance
In the experimental phase, the app SHALL default to 5 metres, offer metres and feet, and use vertical swipes to increase/decrease distance by 1 current unit within 0.3048–30.48 metres. Switching units SHALL preserve the physical distance and existing results. Distances SHALL be stored in metres.

#### Scenario: Change units
- **WHEN** a user switches a 10-foot distance to metres
- **THEN** the distance is 3.048 metres, displayed rounded, and existing attempts remain at the original physical distance

#### Scenario: Scroll distance
- **WHEN** a user swipes up or down
- **THEN** the selected distance changes by one current unit, clamped to the supported bounds, without logging a putt

### Requirement: PP-02 Record outcomes
In the experimental phase, the app SHALL offer first-run silver/red key setup and remapping. A silver click SHALL add one made putt; a red click SHALL add one missed putt. Press, release, hold and double-click notifications SHALL NOT independently add attempts. Setup SHALL NOT log attempts. Touch made/missed controls SHALL remain available. The app SHALL show made/missed totals for the selected distance and session, attempts and success percentage (unavailable for zero attempts).

#### Scenario: Record a miss
- **WHEN** the configured red key delivers a click at 5 metres
- **THEN** exactly one miss is added at 5 metres and the totals update

#### Scenario: Setup duplicate key
- **WHEN** the same key is supplied for both colours
- **THEN** setup requests a distinct red key without logging an attempt

### Requirement: PP-03 Correct and recover a session
In the experimental phase, the app SHALL provide one-action undo of the last attempt, confirmed session reset, and local session/settings recovery. It SHALL reject attempts beyond 1000 with a visible message. Invalid saved data or storage errors SHALL be visible, and failed saves SHALL NOT acknowledge a successful mutation. Reset SHALL preserve distance, units and key mapping. An on-screen exit SHALL remain available.

#### Scenario: Undo after changing distance
- **WHEN** the user records a made putt, changes distance, then selects undo
- **THEN** the original attempt is removed without affecting any other results

#### Scenario: Reopen
- **WHEN** the app opens with a valid saved session
- **THEN** it restores distance, units, mapping and attempts

#### Scenario: Reset confirmation
- **WHEN** the user cancels reset
- **THEN** all attempts remain unchanged
