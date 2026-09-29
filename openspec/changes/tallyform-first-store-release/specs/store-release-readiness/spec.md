# Spec Delta

## Purpose

Gate Tallyform's first store release on independent product identity, verified watch behavior and traceable submission evidence rather than treating a successful build or website as publication.

## ADDED Requirements

### Requirement: Independent registered identity
The release package SHALL use Tallyform branding, its own approved icon and an app ID assigned to this product in the publisher's Zepp account. Inherited prototype metadata SHALL NOT be represented as verified registration. Pricing, regions and publisher/contact/privacy details SHALL be explicitly resolved before submission.

#### Scenario: Registration is unverified
- **WHEN** the package still uses an ID without product-specific registration evidence
- **THEN** submission readiness remains blocked even if the package builds

### Requirement: Evidence-based broad device support
The project SHALL evaluate broad Zepp OS support using a target matrix identifying model, firmware/API level, display geometry, input mapping and alarm/notification capability. Every declared target SHALL have a successful package build and layout/input validation. Physical evidence SHALL cover background countdown delivery, cancellation, sleep/wake and recovery for each claimed device family, with model differences recorded. Untested candidates SHALL remain distinct from supported targets; missing background alerts SHALL block qualification, not silently remove the feature.

#### Scenario: Additional model is proposed
- **WHEN** a second model shares an API version but has different screen geometry or buttons
- **THEN** it is not advertised as compatible until its target checks and applicable physical family evidence are recorded

#### Scenario: Bip Max acceptance
- **WHEN** the release candidate is tested on the physical Bip Max
- **THEN** evidence records the exact version/firmware and outcomes for both modes, touch/buttons, unit changes, history, timers, screen sleep, app exit/reopen and background alert cancellation

### Requirement: Reproducible release package and truthful listing
The release SHALL be independently installable using pinned repository dependencies and build commands. Release evidence SHALL identify source revision, app version, package digest, targets and known limitations. Store screenshots SHALL show the actual candidate; illustrative marketing artwork SHALL NOT substitute for device evidence. App-source changes SHALL refresh affected website capture/provenance and reviewed artwork before new website publication, retaining explicit website approval.

#### Scenario: Candidate differs from screenshots
- **WHEN** the app UI changes after screenshots or marketing artwork were approved
- **THEN** those assets are not presented as current candidate evidence without regeneration and the applicable review

### Requirement: Submission and publication have separate gates
The release process SHALL distinguish host checks, simulator checks, physical acceptance, owner-authorized submission, store review and verified public installation. A submission SHALL record its package/listing identity and result. Publication SHALL be claimed only after store availability and installation in an intended region are observed.

#### Scenario: Build passes but no submission exists
- **WHEN** host tests, builds and simulator checks pass without a store submission
- **THEN** the status reports those checks only, not store acceptance or publication

#### Scenario: Review accepted
- **WHEN** the store reports review acceptance
- **THEN** the release process still verifies discoverability and installation before reporting the app as shipped to users
