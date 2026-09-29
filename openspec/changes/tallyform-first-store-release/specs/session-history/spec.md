# Spec Delta

## Purpose

Retain active practice safely and let users finish, browse and remove local session summaries without losing historical measurement meaning or prototype data.

## ADDED Requirements

### Requirement: Explicit finish and durable summaries
The app SHALL let the user finish and save a session, including an empty timed session. The saved summary SHALL contain session identity, mode, measurement type, total counts, per-value groups, compatible unit presentation and session stopwatch elapsed time. Outcome summaries SHALL include success/failure totals and rates; simple summaries SHALL not invent rates. Unknown legacy dates SHALL be labelled unknown. Finishing SHALL stop the stopwatch and cancel any active countdown before reporting completion. Repeated finish actions SHALL NOT create duplicate summaries.

#### Scenario: Save a mixed-value session
- **WHEN** the user finishes an outcome session with events at two weights
- **THEN** one summary preserves both groups, their counts and the whole-session totals, and can be opened after restarting the app

#### Scenario: Save fails
- **WHEN** summary persistence fails during finish
- **THEN** the active events remain recoverable, no success is reported and a retry does not create duplicate history

### Requirement: Browse and explicitly delete history
The app SHALL provide a local history list and summary detail. New sessions and active-session discard SHALL NOT delete saved summaries. Deleting a saved summary SHALL require confirmation. At storage capacity the app SHALL explain the limit and allow explicit deletion, not silently evict history.

#### Scenario: Cancel deletion
- **WHEN** the user opens a saved summary's delete confirmation and cancels
- **THEN** the summary remains unchanged

#### Scenario: Capacity reached
- **WHEN** another summary cannot be saved within storage limits
- **THEN** existing summaries and active events are retained and the user can free space explicitly

### Requirement: Recover committed state without false success
The app SHALL persist successful recording, correction, configuration and timer control actions and recover them on reopening. A failed persistence operation SHALL NOT be presented as a successful mutation. Corrupt or unsupported data SHALL be preserved and require explicit user-authorized recovery rather than automatic reset; recovery of one data area SHALL NOT silently erase unrelated history.

#### Scenario: Failed recording write
- **WHEN** storage fails while recording a rep
- **THEN** the displayed count does not claim the rep was committed and the previously committed session remains available

#### Scenario: Corrupt active record
- **WHEN** the active session cannot be decoded
- **THEN** the app reports the recovery problem and does not overwrite it merely by launching or erase valid saved summaries

### Requirement: Preserve prototype session meaning during migration
A valid prototype session SHALL migrate to distance-based success/failure practice, preserving event order, exact distances, outcomes, selected unit/value and usable control settings. Missing timestamps and stopwatch values SHALL remain unknown rather than fabricated. Migration SHALL be repeatable without duplicating events. The source data SHALL remain recoverable until the new representation is verified.

#### Scenario: Metres and feet prototype migration
- **WHEN** a valid prototype session with a 3.048 m event and feet display is first opened by the new version
- **THEN** it becomes a distance outcome session with the same event, displayed as 10 ft, without a fabricated original start time

#### Scenario: Interrupted migration
- **WHEN** migration is interrupted before the new state is committed
- **THEN** reopening can recover the original session without losing or duplicating attempts
