# Tasks

## 1. Tallyform branding cutover

- [x] 1.1 Confirm the activity-neutral descriptor/tagline to accompany the confirmed Tallyform name, record the selected copy in the implementation metadata, and verify it does not claim a verified store identity
- [x] 1.2 Replace current-product Basket Birdie / Putting Practice strings in `app/app.json` and `app/page/index.js` with Tallyform copy, preserving historical origin references; verify current manifest and watch-page surfaces identify Tallyform and run `npm test`
- [x] 1.3 Update README and current-product documentation/evidence labels to distinguish Tallyform from historical prototype material; verify historical Basket Birdie references remain explicitly historical and run `npm run build`

## 2. Simulator capture feasibility and deterministic demo state

- [x] 2.1 Document the required macOS runner, Zepp simulator version, Bip Max device image, display/window-capture permissions, and local CLI prerequisites; verify the runner can launch the target simulator and refresh the current revision
- [x] 2.2 Implement clean-state/reset and visible touch/gesture automation for the proposed canonical 4 m, five-made, one-missed, 83% state without writing a private storage snapshot; verify the expected values are visible before capture and repeated setup produces the same state
- [x] 2.3 Implement simulator-window capture and image validation with explicit target/window identification; verify a generated image is an actual Bip Max simulator capture and fails when the simulator or target is unavailable

## 3. Shared website generator and local workflow

- [x] 3.1 Add the shared website-generation entry point and npm script that validate the app build, source revision, app version, target, screenshot, and provenance; verify host tests cover success, stale/mismatched metadata, and missing-capture failures
- [x] 3.2 Add the static Tallyform marketing site source and generated-output layout with the actual screenshot, accessible text, build metadata, and no browser recreation of the watch UI; verify generated HTML references only the current capture and provenance manifest
- [x] 3.3 Add the `.omp` `/generate-website` command and skill that invoke the shared generator and report site path, screenshot path, revision, version, target, or the blocking prerequisite; verify a prepared macOS run produces the documented output and an unprepared run fails clearly
- [x] 3.4 Document local website generation, simulator prerequisites, canonical demo state, and the boundary between simulator evidence and physical-watch acceptance; verify every documented command uses this repository's npm scripts

## 4. GitHub Pages automation

- [x] 4.1 Add approval-gated GitHub Actions publication with manual triggers, concurrency, least-required Pages permissions, and validated test/build/capture/provenance/generation inputs. The approved successor supports the local sealed artifact or an optional prepared macOS generation runner. Verify an intentional failure blocks deployment: wrong-digest run `36504829759` skipped Pages upload and deployment.
- [x] 4.2 Upload and deploy only the validated static output through GitHub Pages, retaining the last successful site when a current run fails; successful runs `36504702907` and `36505052735` published reviewed artifacts, and all seven final public files matched their sealed bytes, including build/screenshot metadata.
- [x] 4.3 Document runner registration, GitHub Pages configuration, deployment branch policy, and known simulator limitations; verify setup instructions do not claim store publication or physical-watch acceptance

## 5. End-to-end validation

- [x] 5.1 Run `npm test` and `npm run build` from a clean dependency install and verify both pass for the branded app
- [x] 5.2 Run `/generate-website` on the prepared macOS simulator runner and verify the screenshot, provenance, generated site, and reported paths all refer to the same source revision and app build
- [x] 5.3 Perform the separate simulator evidence review and record target/version/state observations; verify no result is presented as physical-watch acceptance, Zepp registration, store submission, or publication
