# Design

## Context

The repository currently contains only a native Zepp OS app and a host test suite. `npm run build` produces a Bip Max package, while `zeus dev` refreshes the desktop Zepp simulator. The pinned Zeus CLI exposes no screenshot command. This workstation has the Zepp simulator application and macOS `screencapture`, but the repository has no GitHub Pages site or Actions workflow.

The current watch UI and manifest contain independent prototype strings: `app/page/index.js` renders the page heading, and `app/app.json` supplies app-list and package metadata. Existing screenshots are simulator-window captures with historical provenance; they are not generated website assets.

## Goals / Non-Goals

**Goals:**

- Make Tallyform the current product identity in the manifest, watch UI, and marketing site.
- Generate a static site whose primary demo image is captured from the Bip Max Zepp simulator.
- Make capture state, source revision, app version, target, and build artifact identity reproducible and reviewable.
- Use one generator contract for the local `/generate-website` skill and GitHub Pages automation.
- Block publication when app tests, build, simulator refresh, deterministic state setup, capture, provenance validation, or site generation fails.
- Keep the site independently deployable as static files without browser runtime dependencies.

**Non-Goals:**

- An interactive browser implementation of the watch UI.
- Physical-watch acceptance, Zepp store registration, store submission, or publication claims.
- Generic measurement types, history, timers, or other proposed standalone app capabilities.
- Replacing historical evidence or erasing documentation of Basket Birdie as the source prototype.
- Automatically selecting a verified Zepp app ID or final publisher identity.

## Decisions

### 1. Keep branding changes explicit at each current-product surface

Update the manifest app name, current manifest description, localized app name, and native page heading/subtitle directly in their existing files. Use Tallyform as the canonical product name. Use an activity-neutral descriptor/tagline in current product copy, with the proposed `Reps & Practice Tracker` retained as a reviewable copy decision rather than claiming store approval. Do not rewrite historical origin or evidence prose except where it incorrectly labels a current Tallyform surface.

This avoids introducing a new branding abstraction for four existing strings while keeping the app package and watch UI aligned.

### 2. Separate site source, generated output, and capture metadata

Add a small static site source tree and a generated output directory. The source contains the page structure and styling; generated output contains the current simulator image, a provenance JSON document, and rendered metadata. Generated output is disposable and is uploaded as the Pages artifact rather than treated as hand-authored source.

The original page presented Tallyform copy, the actual screenshot, target/app version, source revision, and capture time together. The approved successor `rework-tallyform-marketing-page` moves the raw screenshot and build details to a separately linked technical page and uses reviewed image-generated Bip Max artwork in the customer-facing hero. Raw evidence must remain unchanged and distinct from artwork; the capture and deployment gates below remain in force.

### 3. Put the shared contract below the workflow skill

Implement a repository-local generator entry point, exposed through an npm script, that performs validation and emits the static site. The `/generate-website` skill and command provide operator guidance and invoke that entry point; they do not contain a second implementation of build, capture, or provenance logic. GitHub Actions invokes the same entry point.

The generator should emit a machine-readable manifest containing:

- source revision;
- app version and code from the manifest;
- Zeus CLI version;
- requested Zeus target and simulator model;
- production package path and digest;
- simulator refresh/capture timestamp;
- screenshot path and digest;
- canonical demo-state identifier.

Generation must validate that all required values refer to the current run before rendering the site.

### 4. Use a prepared macOS GUI runner for simulator capture

The capture job runs on a self-hosted macOS runner with the Zepp simulator, Bip Max device image, local Node dependencies, and permission to capture the simulator window. A normal static Pages runner cannot create the screenshot.

The job performs host tests and the pinned production build first. It then refreshes the simulator from the same checked-out revision using the supported Zeus development flow, exercises the app through visible simulator input, captures the simulator window with macOS tooling, and validates the resulting image and metadata. The production package digest and simulator source revision are both retained so a mismatch fails rather than silently producing a stale image.

The first implementation task must verify whether the installed simulator can be refreshed and controlled reliably in the runner's non-interactive session. If exact package installation into the simulator is supported, use it; otherwise the capture must still be tied to the same checked-out revision and the provenance must distinguish the production package from the simulator refresh.

### 5. Establish the demo state through the app's visible behavior

Before each capture, isolate the simulator from prior local storage by using a clean app state or the app's visible reset path. Do not write a private test-only storage snapshot that bypasses the app. Use visible touch/gesture input to establish the proposed canonical state: 4 m selected, five made attempts, one missed attempt, and the resulting 83% make rate. Verify the rendered values before capturing.

This keeps the website image representative of the actual current UI and prevents prior simulator sessions from changing the marketing result. If the app's setup prompt or simulator interaction model prevents deterministic setup, generation fails and the automation reports the blocker.

### 6. Deploy Pages only from validated main-branch output

The approved successor `rework-tallyform-marketing-page` separates generation, review and publication. Run the shared test/build/capture/provenance/generation chain locally, or manually on a prepared macOS Actions runner. Publish only an explicitly approved sealed artifact through the manual owner-gated Pages workflow on `main`, using an immutable local review commit or successful Actions generation run plus the approved digest. Do not automatically deploy on source pushes or rebuild after sign-off.

Pull requests may run source-level checks, but deployment is restricted to an approved branch. No deployment step may synthesize a placeholder image or reuse a screenshot from another revision when the current generation fails.

### 7. Keep local and CI reports equivalent

The `/generate-website` workflow reports the same fields as CI: generated site directory, screenshot path, source revision, app version, target, and provenance manifest. Missing simulator prerequisites or any validation failure is a non-success result with an actionable message. A successful local run is evidence of generation only, not physical-watch acceptance or store readiness.

## Risks / Trade-offs

- **GUI automation fragility:** Simulator window focus, display scaling, permissions, and persistent emulator state can make captures flaky. Use a dedicated runner session, explicit window identification, reset/setup checks, and fail-closed validation rather than accepting an unknown image.
- **Dev refresh versus production package:** Zeus exposes separate build and dev flows. Keeping both source revision and production package digest in provenance makes the distinction visible and provides a gate for future exact-package simulator installation.
- **Self-hosted runner maintenance:** The simulator and Bip Max image are external prerequisites. Document their versions and keep the workflow from claiming success when the target is absent.
- **Brand copy remains partly provisional:** Tallyform is confirmed, but descriptor/tagline and publisher/store identity are not. Keep those values clearly separate from verified registration metadata.
- **Generated assets can look current while being old:** Pages deployment must be artifact-based and fail closed; provenance shown on the page makes accidental stale publication detectable.
