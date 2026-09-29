# Tallyform website generation

The customer page pitches Tallyform's practice benefits and uses one reviewed, image-generated Bip Max hero. A separate `technical.html` exposes the unchanged simulator screenshot and build provenance. Marketing artwork is illustrative; it is not simulator or physical-watch evidence.

## Required capture environment

Website generation requires a macOS GUI session with:

- Node `>=20.19.0`;
- this repository's local dependencies installed with `npm ci`;
- the pinned Zeus CLI and device types from `package-lock.json`;
- Zepp OS Simulator 2.1.2 or a compatible installed version;
- the Bip Max v1.0.0 simulator image;
- the `Amazfit Bip Max` Zeus target, backed by device source `11206915`;
- permission for the terminal/runner to control the simulator window and capture the display;
- a logged-in simulator account and a simulator control endpoint at `127.0.0.1:7650`;
- a running Bip Max device runtime, normally visible on port `7833` before device capture.

The manifest target design is `432x514`; the simulator or physical runtime geometry may differ. Record the target and runtime geometry in evidence rather than assuming they are interchangeable.

The simulator application is normally installed at:

```text
/Applications/simulator.app
```

The native macOS capture utility is:

```text
/usr/sbin/screencapture
```

A GitHub Actions runner used for deployment MUST be a prepared self-hosted macOS GUI runner with the simulator, device image, account/session state, display permissions, and a stable logged-in user session. A normal static GitHub Pages runner cannot create the simulator image.

## Verify the simulator before generation

From the repository root:

```sh
npm ci
npm run --silent zeus -- status
npm run dev
```

A usable Zeus development session reports a simulator connection to `http://127.0.0.1:7650`, rebuilds the package, refreshes the simulator, and remains watching the current checkout. Stop the development watcher before switching to another preview or physical-watch flow.

The simulator's main window and the Bip Max device window are separate. A visible simulator manager alone is insufficient evidence that the device runtime is running.

Before each run, open the device using the manager's **Emulator** button and open **Tallyform** from its Apps list. Confirm the app, not the watch face, is visible. A connected Zeus log alone does not establish that the app is on screen. Capture cleanup closes the QEMU device window and confirms its **Quit** dialog automatically, including after a capture error; the simulator manager remains open.

## Evidence boundary

A generated screenshot establishes simulator behavior for the recorded revision, app version, target, and state. It does not establish physical-watch acceptance, Zepp store registration, store submission, or publication. Physical-watch tests require the separate validation procedure in `docs/zepp-os-simulator-and-watch-validation.md`.

## Generate locally

After the simulator prerequisites and reviewed hero assets are ready, run:

```sh
npm run generate-website
```

The command runs host tests, creates the Bip Max production package, refreshes the simulator from the current checkout, resets the visible session state, records five made and one missed attempt at 4 m, captures the simulator window, validates capture provenance and the reviewed hero, and writes the static site to `website/dist/`.

The generated output contains:

- `index.html`, the customer-facing page;
- `technical.html`, raw capture and provenance links;
- `styles.css`;
- `hero.png`, approved image-generated artwork;
- `hero-provenance.json`, the approved artwork manifest;
- `screenshot.png`, the unmodified simulator capture;
- `provenance.json`, app build and capture identity.

Missing, altered, unreviewed or UI-stale artwork fails generation before replacing the previous complete output. A raw capture or composition reference is never substituted for the approved hero.

The `/generate-website` skill is an operator-facing wrapper around this same npm command. GitHub Actions uses the same generator contract; it does not maintain a separate website implementation.

## Produce and approve the watch hero

Simulator screenshot capture is available and working. Producing and reviewing the watch-render hero is a separate authoring step using that capture. A missing hero file does not establish that screenshot tools or an image-generation endpoint are unavailable.

Durable inputs are under `website/assets/references/`:

- `tallyform-simulator.png` and `capture-provenance.json`: real capture and its original metadata;
- `bip-max-composition.png`: user-supplied composition reference, not Tallyform artwork;
- `generation-request.json`: prompt, reference digests and visual acceptance checklist;
- `source-inputs.json`: app source fingerprint recorded during reference preparation.

Use an authorized image-capable model/service to produce a single Bip Max watch rendering using these references. Do not use a CSS overlay. Keep Tallyform's text, controls and canonical values intact; remove simulator chrome and all Basket Birdie branding. Inspect hardware, glass perspective, bezel fit and legibility at full resolution and page display sizes, then obtain user approval. Do not mark an asset approved merely because generation returned an image.

Save the reviewed PNG as `website/assets/hero.png` and its manifest as `website/assets/hero.json`. Required manifest fields:

| Field | Meaning |
| --- | --- |
| `referenceCapturePath` | Relative path within assets, such as `references/tallyform-simulator.png` |
| `referenceCaptureSha256` | Actual reference PNG digest |
| `uiSourceFingerprint` | Current `uiSourceFingerprint()` result from the website generator |
| `canonicalDemoState` | Canonical capture state defined by the generator |
| `imageSha256`, `imageWidth`, `imageHeight` | Actual approved PNG identity and dimensions |
| `provider`, `model`, `prompt` | Image-generation origin |
| `referenceSource.capture`, `referenceSource.composition` | Durable reference origins |
| `review.status`, `review.reviewedAt` | `approved` and the actual ISO review timestamp |

The generator validates digests, dimensions, review status and source fingerprint. The fingerprint covers app source paths/bytes, the lockfile and canonical state; generated output and website-only copy changes are excluded. App changes require renewed artwork review. Fresh screenshot byte differences do not invalidate artwork by themselves: the original reference identity is retained independently of each fresh capture.

The normal website build consumes local assets; it does not call an image model or need image-service credentials. The user supplied the current hero. Its untouched master is `references/hero-supplied.png`; `hero.png` is the transparent RGBA export requested by the user. Background and strap-gap whites were removed without changing the screen text or compositing another screen. Export identity and processing are recorded in `hero.json`. The original model/provider/prompt were not supplied and are explicitly recorded as undisclosed, not invented.

## Current redesign verification

The complete generator passed with the supplied transparent hero: 39 host tests, production build, simulator capture, asset validation and website packaging. After capture, automation confirmed QEMU's Quit dialog; the QEMU process was absent and the simulator manager remained running.

The complete sealed site was reviewed at 1440 px and 375 px beneath `/site/`: transparent hero loaded with the original aspect ratio, no horizontal overflow, working walkthrough CTA and technical-page raw capture. Keyboard focus was checked in the earlier complete-site review. The review server is `http://127.0.0.1:4175/site/`; bundle `/tmp/tallyform-review-transparent-1790641589499`, site digest `f704362ac1695f788c47df0a01167b8e0d21b14aebe3a70aa0d6ecc7b43d3379`. Website sign-off and public deployment remain pending.


## GitHub Pages deployment

The public repository is `Fuzzwah/tallyform`. Local generation and publication require no GitHub-hosted simulator runner. Optional manual workflow `generate-website.yml` uses a prepared self-hosted macOS runner labeled `macOS` and `zepp-simulator`, builds through the existing generator, and uploads a review-only artifact retained for 30 days. Generation does not run automatically on source pushes and has no Pages deployment permission.

`tools/website-release.mjs` seals the generated site into a new directory containing `site/` and `review.json`. Its SHA-256 covers every file's relative path and bytes. It rejects incomplete sites, symlinks, overlapping paths and an existing bundle destination. Changes, additions or deletions after review fail verification.

### Review the exact artifact

For a local preview after successful generation:

```sh
node tools/website-release.mjs seal website/dist /tmp/tallyform-review-UNIQUE
python3 -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tallyform-review-UNIQUE/site
```

Open `http://127.0.0.1:4173/`. Review the hero and page at 375 px and 1440 px, keyboard focus, walkthrough CTA and technical resources. Show the demo to the user and obtain explicit approval; hero approval alone does not approve the website.

For publication, download the GitHub generation artifact into a new directory and preview **those exact bytes**:

```sh
gh run download RUN_ID --repo Fuzzwah/tallyform --name website-review --dir /tmp/tallyform-actions-review-UNIQUE
node tools/website-release.mjs verify /tmp/tallyform-actions-review-UNIQUE APPROVED_SHA256
python3 -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tallyform-actions-review-UNIQUE/site
```

Use the digest reported in the generation run summary and `review.json`. A regenerated capture may differ from an earlier local preview, so local sign-off does not automatically approve the Actions artifact. Any site edit requires a new artifact and renewed approval. Expired artifacts must be regenerated and reviewed again.

### Publish only after sign-off

Configure Pages source as **GitHub Actions**, with the `github-pages` environment restricted to `main`. Only the repository owner can run the publication job; for this personal repository that is `Fuzzwah`. The manual confirmation records the owner's approval, while the digest binds it to the reviewed content. Do not dispatch on behalf of the user before their explicit sign-off.

For an approved **local** review bundle, publish those exact bytes without a new Actions capture:

```sh
node tools/publish-reviewed-website.mjs /tmp/tallyform-review-UNIQUE APPROVED_SHA256
```

This command requires explicit user sign-off before invocation. It verifies the bundle, preserves `site/` and `review.json` on a dedicated `website-review/` branch, and dispatches publication with the immutable commit and digest. The workflow downloads that commit, verifies all site bytes again, and deploys without regeneration. Source/workflow changes must first be available on `main`; GitHub CLI and Git push authentication must be configured. Keep the review commit for provenance and rollback.

The following alternative is for a separately reviewed Actions-generation artifact:

```sh
gh workflow run publish-website.yml --repo Fuzzwah/tallyform --ref main \
  -f generation_run_id=RUN_ID \
  -f approved_sha256=APPROVED_SHA256 \
  -f confirm_approval=true
```

The publication workflow requires a successful generation run on `main`, downloads its review artifact, verifies the approved digest, and uploads only its `site/` contents to Pages. **It never rebuilds or recaptures.** Publication runs are serialized rather than cancelled midway. A failed pre-publication check leaves the existing site unchanged. The deployment job checks HTTP reachability; the operator must also open the returned URL and review the actual page and resources before reporting successful delivery.

### Verification and outstanding setup

The release CLI was exercised with a throwaway bundle: sealing and verification returned the same digest, and changing the reviewed HTML caused exit code 1. All 39 host tests and the Bip Max production build passed. This proves local identity enforcement, not a successful GitHub Actions run or live deployment.

The repository has been created and configured as the local remote; no source has been pushed and no website has been published. GitHub's runners API returned zero registered runners. Runner registration, Pages setup and hosted workflow execution remain to be completed during delivery. Both workflow files passed YAML parsing and the updated OpenSpec change passed strict validation; this is not hosted execution evidence. The user-supplied hero is now integrated, with the requested transparent background, and the complete demo awaits explicit sign-off. Simulator evidence does not establish physical-watch acceptance or Zepp store publication.
