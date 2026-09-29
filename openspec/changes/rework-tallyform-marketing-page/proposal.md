# Proposal

## Why

The current Tallyform website reads like an engineering evidence report rather than a pitch to prospective users. Screenshot capture already works; the missing work is customer-focused storytelling and a polished Amazfit Bip Max hero showing the actual Tallyform interface.

## What Changes

- Replace the metadata-dominated landing page with a benefits-led hero, a short practice walkthrough, feature sections and useful calls to action.
- Pitch implemented behavior only: distance selection, metres/feet, made/missed recording, selected-distance make rate and undo. Do not advertise planned generic measurements, timers, saved history or unverified physical controls.
- Produce a single image-generated watch hero using the working Tallyform simulator capture and a Bip Max visual reference. Reject browser overlays, misaligned screens, invented UI and Basket Birdie branding.
- Keep the original simulator screenshot and machine-readable provenance as separate technical resources, linked discreetly rather than presented as marketing copy. Generated artwork is not raw simulator or physical-watch evidence.
- Preserve the working capture/build pipeline and static GitHub Pages delivery. Add explicit hero asset review and source association instead of requiring an image-model call on every site build.
- Use a real in-page walkthrough CTA while there is no verified store listing; no fake download, waitlist, pricing or availability claims.

## Capabilities

### New Capabilities

- `tallyform-marketing-website`: Customer-facing Tallyform presentation, reviewed watch hero artwork and separation of marketing from technical evidence.

### Modified Capabilities

None in the main baseline: `openspec list --specs` reports no specs. This deliberately reuses the capability path from the in-flight `tallyform-branding-and-website` change rather than creating a second marketing capability.

## Impact

- Website: `website/template.html`, `website/styles.css`, `website/site.json`, new reviewed hero asset and asset metadata.
- Generator: `tools/website-generator.mjs` and `tools/generate-website.mjs` for hero packaging, source association and technical-resource links; preserve `tools/capture-simulator.mjs` behavior.
- Documentation and verification: `docs/website-generation.md`, website generator contract tests and desktop/mobile browser review.
- No watch app behavior, session storage, registered identity or pricing changes. The user subsequently authorized completing the demo, obtaining sign-off, publishing to `Fuzzwah/tallyform`, and fixing the repeatable generation/review/publication workflow.
- Simulator screenshot capture is available and working. The remaining asset work is producing and reviewing the Tallyform-on-Bip-Max hero from that capture and approved reference imagery; no claim about image-generation endpoint availability is made here.
- The older change requires raw screenshot/build metadata presentation. This successor changes that presentation contract while retaining capture, provenance and deployment gates. At integration/archive, reconcile both changes in predecessor-then-successor order; do not let the predecessor restore the rejected layout. Its outstanding GitHub deployment tasks remain outstanding.
- Generation now produces a review artifact rather than deploying automatically. Publication requires explicit owner confirmation of the reviewed run and content digest and must reuse the same artifact without rebuilding.
