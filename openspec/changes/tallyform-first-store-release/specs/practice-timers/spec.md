# Spec Delta

## Purpose

Support manual practice with an independent session stopwatch and duration-based per-rep countdown that alerts during sleep or outside the app without recording outcomes automatically.

## ADDED Requirements

### Requirement: Session stopwatch
Every measurement type and recording mode SHALL support a session stopwatch with explicit start, pause and resume. Running elapsed time SHALL continue across screen sleep and leaving/reopening the app; paused time SHALL not accumulate. The stopwatch SHALL NOT consume a second measurement slot or record events. Finish SHALL freeze elapsed time for the saved summary.

#### Scenario: Paused time excluded
- **WHEN** the stopwatch runs for 20 seconds, is paused for 10 seconds and runs for another 5 seconds
- **THEN** it reports 25 seconds elapsed

#### Scenario: Exit while running
- **WHEN** the user leaves the app for 30 seconds with the stopwatch running
- **THEN** reopening includes those 30 seconds without relying on visible screen refreshes

### Requirement: Duration countdown lifecycle
Duration sessions SHALL support one per-rep countdown at a time with start, pause, resume and cancel. A run SHALL snapshot the selected duration. Adjustments to the session's duration setting SHALL apply to the next run, not retime a running or paused countdown. Expiry SHALL leave an explicit expired state until dismissal or a new explicit start. Restart SHALL require explicit user action. Stopwatch and countdown controls SHALL be independent.

#### Scenario: Change next duration
- **WHEN** a 30-second countdown is running and the selected duration becomes 45 seconds
- **THEN** the current run expires on its original schedule and the next explicit start uses 45 seconds

#### Scenario: Pause and resume
- **WHEN** a 30-second countdown runs for 10 seconds, pauses for 15 seconds and resumes
- **THEN** it has 20 seconds remaining on resume and no alert fires at the obsolete original deadline

### Requirement: Background expiry alerts
On every release-qualified target, a running countdown SHALL produce a watch notification and the supported attention signal at expiry while the display is asleep or after leaving Tallyform, without requiring a phone or reopening the app. The app SHALL respect system notification policies and disclose settings that suppress attention signals. A supported target SHALL be physically verified with normal alert settings; foreground-only behavior SHALL NOT count as satisfying this requirement.

#### Scenario: Countdown finishes outside the app
- **WHEN** the user starts a countdown and exits to the watch face with alerts enabled
- **THEN** the watch alerts at expiry and reopening shows the expired countdown with unchanged rep/outcome counts

#### Scenario: Countdown finishes during sleep
- **WHEN** the display sleeps before the running countdown expires
- **THEN** the watch delivers the expiry alert without the user waking or reopening Tallyform

### Requirement: Recording remains manual
Timer start, pause, resume, cancellation, expiry, notification interaction and dismissal SHALL NOT add, undo or classify a rep or attempt. Manual recording SHALL remain available independently of countdown state and SHALL NOT implicitly restart the countdown.

#### Scenario: Expiry in either recording mode
- **WHEN** a countdown expires in simple or outcome mode
- **THEN** counts remain unchanged until the user explicitly records a rep or outcome

### Requirement: Cancellation and failures are visible and safe
Pause, cancel, discard and finish SHALL invalidate the current countdown alert. Obsolete callbacks SHALL not alert for a superseded run. If background scheduling or required permission fails, the app SHALL show that the countdown did not start with background protection; it SHALL NOT silently substitute foreground-only timing. Failed cancellation SHALL be reported rather than falsely promising that no alert remains. Duplicate delivery or foreground/background overlap SHALL not intentionally generate multiple alerts for one run.

#### Scenario: Superseded alarm
- **WHEN** a cancelled countdown's delayed callback arrives after another countdown starts
- **THEN** it does not alert, modify the new run or record any event

#### Scenario: Alarm creation rejected
- **WHEN** the operating system rejects scheduling a countdown
- **THEN** the app reports the failure and does not show a successfully running background countdown

### Requirement: Recovery reconciles timing
Reopening SHALL reconstruct running, paused, cancelled or expired timers from committed state. Time reconciliation SHALL never display negative remaining or elapsed time. After a restart or detected clock discontinuity, the app SHALL disclose interrupted or uncertain timing rather than silently claim uninterrupted accurate timing. It SHALL NOT replay an acknowledged expiry or manufacture repetitions.

#### Scenario: Reopen after expiry
- **WHEN** a countdown expires outside the app and the user later reopens it
- **THEN** the countdown is expired, not restarted, and event totals are unchanged

#### Scenario: Uncertain clock recovery
- **WHEN** recovery detects an inconsistent timebase
- **THEN** the app reports timing uncertainty and requires explicit resumption or restart rather than displaying fabricated accurate timing
