# Proposal

## Why

The extracted watch prototype still presents itself as Basket Birdie / Putting Practice, so it cannot serve as the independently branded Tallyform product. The project also has no reproducible marketing surface: a GitHub Pages demo must show an actual Zepp simulator capture from the same app build, rather than a hand-maintained or browser-recreated mockup.

## What Changes

- Replace current product-facing prototype branding with the confirmed public name **Tallyform**.
- Remove Basket Birdie and Putting Practice from current app-list, manifest, watch-screen, and marketing copy while retaining historical origin references in documentation.
- Add a static GitHub Pages marketing website with an actual Bip Max simulator screenshot retained as technical evidence. The approved successor `rework-tallyform-marketing-page` governs the customer-facing presentation and separate illustrative watch hero.
- Add a `/generate-website` workflow skill that invokes a shared, reproducible generator rather than maintaining a separate browser implementation of the watch UI.
- Build and capture the demo from the same source revision and app version, with deterministic simulator state and provenance metadata.
- Add automation that publishes the generated website to GitHub Pages after a successful app build and screenshot capture.
- Keep the inherited app ID explicitly marked as development metadata; this change does not claim Zepp registration, physical-watch acceptance, store submission, or publication.

## Capabilities

### New Capabilities

- `tallyform-marketing-website`: Generate and publish a static marketing page containing the canonical Tallyform branding, an actual simulator screenshot, and build provenance tied to the screenshot.

### Modified Capabilities

- None. The repository has no approved standalone OpenSpec capability baseline; the historical putting-practice specification is not modified or treated as the product contract.

## Impact

- Watch source and manifest: `app/page/index.js`, `app/app.json`, and related current-product copy.
- Documentation and evidence labels that describe the current product, while preserving historical origin/evidence context.
- New website source and generated assets, likely under a dedicated site directory.
- New reusable website-generation/capture tooling and `.omp` `/generate-website` skill integration.
- New GitHub Actions automation and GitHub Pages deployment configuration.
- macOS runner requirements: the Zepp simulator, Bip Max target, display/window capture, and a stable scripted demo state.
- Existing host test and Zeus build commands remain required; simulator capture is separate from physical-watch validation.

The canonical demo state is proposed to be a deterministic seeded practice session based on the existing evidence (4 m, five made, one missed). The exact descriptor/tagline remains reviewable; Tallyform is the confirmed product name.
