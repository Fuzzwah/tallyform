# Spec Delta

## Purpose

Present Tallyform to prospective users through accurate benefit-led copy and a polished watch hero, while retaining separately accessible simulator evidence and build provenance.

## ADDED Requirements

### Requirement: Landing page pitches implemented practice benefits

The landing page SHALL identify Tallyform and explain wrist-based made/missed practice tracking through a benefit-led headline, supporting copy, feature sections and a three-step walkthrough. Claims SHALL be limited to implemented distance selection, metres/feet, made/missed recording, selected-distance make rate and undo. It MUST NOT advertise planned measurement types, timers, saved-session history, verified physical button operation or guaranteed improvement.

#### Scenario: Prospective user opens the page
- **WHEN** a visitor opens the landing page
- **THEN** the first section explains the practical value of Tallyform and presents a watch hero
- **AND** subsequent sections explain setting distance, recording attempts and checking make rate without requiring knowledge of the build pipeline

### Requirement: Hero is reviewed image-generated Bip Max artwork

The primary hero SHALL be a single image-generated rendering of an Amazfit Bip Max displaying Tallyform, produced using the working simulator capture as UI reference. It MUST NOT be a browser-layered screenshot, raw simulator window, Basket Birdie illustration or unrelated watch model. The rendered screen SHALL fit the glass perspective and bezel with legible Tallyform branding, intact controls and the source capture's canonical values. A reviewer SHALL reject incorrect text, invented controls, misalignment, excessive distortion or cropped essential content before the asset is eligible for publication.

#### Scenario: Hero passes visual review
- **WHEN** a candidate is compared with the source capture and Bip Max reference at full resolution and at page display size
- **THEN** it shows Tallyform, 4 m, five made, one missed and 83%, without simulator chrome or other app branding
- **AND** the screen follows the watch perspective without floating edges or visible overlap onto the case

#### Scenario: Reviewed artwork is absent
- **WHEN** no watch-render candidate has been produced or no candidate passes review
- **THEN** hero production or review remains unfinished and the redesign is not reported complete
- **AND** no CSS composite or example image is substituted as a successful generated hero

### Requirement: Technical evidence is separate from the customer pitch

The landing page SHALL omit release-gate language, commit hashes, capture timestamps and build-status panels from its main pitch and footer copy. A discreet technical-resource link SHALL make the unchanged raw capture and associated revision, app version, target and provenance available separately. Generated artwork SHALL be identified as illustrative in its accessible description and technical metadata, never as a physical-watch photograph or unmodified simulator evidence.

#### Scenario: Visitor inspects technical resources
- **WHEN** a visitor follows the technical-resource link
- **THEN** the original simulator screenshot and its provenance are available
- **AND** the hero artwork is distinguishable from that original capture

### Requirement: Calls to action are useful and truthful

The primary CTA SHALL navigate to the practice walkthrough while there is no verified store listing. The page MUST NOT present a nonfunctional download button, fabricated waitlist, invented pricing, testimonials or store availability. Any availability statement SHALL use plain customer language rather than engineering release terminology.

#### Scenario: Visitor activates the primary action
- **WHEN** the visitor activates the primary CTA with pointer or keyboard
- **THEN** the page navigates to the walkthrough
- **AND** it does not imply that the app is currently downloadable

### Requirement: Reviewed hero assets stay associated with source UI

Website generation SHALL preserve the working app test/build/capture sequence and publish the raw capture, provenance and approved hero together. Hero metadata SHALL identify the reference capture, represented UI source fingerprint, canonical state, generated asset digest and review status. A missing, modified, unreviewed or UI-stale hero SHALL block replacement of the previous successful output. Routine website-copy changes SHALL NOT require regenerating an otherwise current approved hero.

#### Scenario: UI source changes after hero approval
- **WHEN** website generation detects that the approved hero represents different app UI source
- **THEN** it fails with a request to regenerate and review the hero
- **AND** retains the previous complete website output

#### Scenario: Marketing copy changes without UI changes
- **WHEN** website generation uses unchanged app UI source and an intact reviewed hero
- **THEN** the approved hero is reused with the new page copy and a fresh simulator capture
- **AND** no image-model call is required during the normal static build

### Requirement: Marketing page is responsive and accessible

The static page SHALL present readable copy, an undistorted hero and operable navigation on desktop and mobile without horizontal overflow. It SHALL provide semantic headings, meaningful image alternative text, visible keyboard focus, and readable contrast. All local resources SHALL resolve when served beneath a GitHub Pages repository subpath.

#### Scenario: Mobile and desktop review
- **WHEN** the page is viewed at 375 px and 1440 px viewport widths and navigated by keyboard
- **THEN** the hero and text remain readable without clipping or horizontal scrolling
- **AND** the CTA and technical links work with visible focus and no missing assets

### Requirement: Publication reuses the explicitly approved website

Generation SHALL produce a reviewable artifact without automatically publishing it. The operator SHALL show the actual website demo and obtain explicit user sign-off before dispatching publication. Publication SHALL require owner confirmation, the successful generation run identity and the approved content digest, and SHALL deploy the reviewed files without rebuilding or recapturing.

#### Scenario: Generated site has not been approved
- **WHEN** generation completes without explicit website sign-off
- **THEN** the review artifact is available but the public website is not replaced

#### Scenario: Approved artifact is published
- **WHEN** the owner confirms the reviewed generation run and matching content digest
- **THEN** publication deploys those exact site files without regeneration
- **AND** the operator verifies the returned live URL before reporting delivery

#### Scenario: Reviewed bytes change
- **WHEN** any site file is changed, added, renamed or removed after the approved digest was recorded
- **THEN** publication verification fails before deployment
- **AND** the changed site requires a new review and sign-off
