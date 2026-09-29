# Spec Delta

## Purpose

Provide a consistently branded Tallyform product surface and a reproducible static marketing website whose demo image is an actual capture of the app running in the Zepp Bip Max simulator.

## ADDED Requirements

### Requirement: Current product surfaces use Tallyform branding

The current app manifest, app-list identity, watch page heading, and marketing website MUST identify the product as Tallyform. They MUST NOT present Basket Birdie or Putting Practice as the current product name. Historical documentation MAY retain those names when explicitly describing the source prototype or an older build.

#### Scenario: A fresh app build is inspected

- **WHEN** a current build is installed or its manifest and primary watch page are inspected
- **THEN** the visible product identity is Tallyform
- **AND** no current-product surface uses Basket Birdie or Putting Practice as its product name

### Requirement: The website demo is an actual simulator capture

The published website MUST make a screenshot captured from the Zepp simulator running the Bip Max target available on a separately accessible technical page. It MUST NOT substitute generated artwork, a browser recreation, a hand-drawn mockup, or stale historical evidence for that raw capture. The customer-facing hero is governed by the approved successor `rework-tallyform-marketing-page`; its illustrative artwork is separate from simulator evidence.

#### Scenario: A website generation run succeeds

- **WHEN** the website generator completes successfully
- **THEN** the generated demo asset is a simulator screenshot from the build produced by that run
- **AND** the website references that generated asset

#### Scenario: Simulator capture is unavailable

- **WHEN** the target simulator cannot be launched, refreshed, or captured
- **THEN** website generation fails
- **AND** the publishing workflow does not deploy a website claiming a newly generated demo

### Requirement: Screenshot provenance matches the app build

Each generated demo MUST have machine-readable provenance containing at least the source revision, app version, Zeus target, simulator target, and capture timestamp. The website's separately accessible technical resources MUST expose the revision and app-version identity associated with the raw screenshot; these details need not appear in the customer-facing pitch.

#### Scenario: A generated asset is reviewed

- **WHEN** a reviewer opens the website or its generated metadata
- **THEN** they can identify the source revision and app version used for the screenshot
- **AND** those values match the app build artifact from the same generation run

#### Scenario: A stale or mismatched asset is detected

- **WHEN** the screenshot provenance does not match the current build revision, app version, or target
- **THEN** generation or publication fails rather than silently reusing the mismatched asset

### Requirement: The canonical demo state is deterministic

The generator MUST establish a repeatable simulator state before capture. The initial proposed marketing state is the existing evidence state: 4 m selected, five made attempts, one missed attempt, and the resulting 83% make rate. The state setup MUST be isolated from prior simulator storage and MUST fail if the expected state cannot be established.

#### Scenario: Generation runs twice from the same revision

- **WHEN** the generator runs twice for the same app revision and target
- **THEN** both runs establish the same canonical state before capture
- **AND** the screenshots represent the same app state apart from permitted simulator/window metadata

### Requirement: GitHub Pages publishes only validated output

The GitHub Pages deployment MUST publish a static website only after the app tests, app build, simulator capture, provenance validation, and website generation succeed for the same source revision. A failed or superseded generation MUST NOT replace the last successfully published website with partial output.

#### Scenario: A complete main-branch generation succeeds

- **WHEN** the required checks and capture complete for a source revision
- **THEN** the generated static site and matching screenshot are eligible for review and approval-gated GitHub Pages publication under the successor `rework-tallyform-marketing-page`, not automatically deployed
- **AND** the site metadata identifies that source revision

#### Scenario: The app build or capture fails

- **WHEN** any required test, build, simulator, capture, or provenance step fails
- **THEN** the Pages deployment is blocked
- **AND** no incomplete generated site is published

### Requirement: `/generate-website` produces the same validated output locally

The `/generate-website` skill MUST guide an operator through the same build, deterministic simulator setup, screenshot capture, provenance validation, and static-site generation contract used by automation. It MUST report the generated site path, screenshot path, source revision, app version, and target, or report the blocking failure without claiming success.

#### Scenario: An operator invokes the skill on a prepared macOS runner

- **WHEN** the required simulator and target are available
- **THEN** the skill generates the validated website and provenance output using the current revision
- **AND** its reported result is suitable for local review before Pages deployment

#### Scenario: An operator invokes the skill without simulator prerequisites

- **WHEN** the simulator or target prerequisite is missing
- **THEN** the skill identifies the missing prerequisite and stops
- **AND** it does not create a misleading placeholder screenshot or successful website result
