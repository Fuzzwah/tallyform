# Design

## Context

See proposal.md for motivation. The current site uses `website/template.html`, `styles.css` and `site.json`; `tools/website-generator.mjs` renders static output. `tools/generate-website.mjs` runs tests, production build, Zeus refresh and simulator capture. Capture has succeeded repeatedly with Tallyform at 4 m, 5 made, 1 missed and 83%; no replacement capture mechanism is required.

The template currently devotes its lower section and footer to source revision, target, capture time and release disclaimers. `tests/website-generation.test.js` covers missing images, metadata mismatch and rendering using a historical fixture. These tests do not prove that generated watch artwork is accurate. Browser and visual asset review are required.

There is no main spec baseline. The in-flight predecessor `tallyform-branding-and-website` specifies a screenshot-centric presentation and still has unverified GitHub deployment tasks. This design supersedes its customer presentation only, not its evidence or deployment safeguards. Tallyform is confirmed by the user and current README despite stale 'undecided' wording in project configuration.

## Goals / Non-Goals

**Goals:** Keep the boring static generator; clearly separate marketing artwork from raw evidence; make missing or stale artwork an explicit failure; give prospective users a readable, useful page.

**Non-Goals:** Watch behavior or storage changes, a new frontend framework, runtime image generation, CSS screenshot compositing, new signup infrastructure, selecting pricing, asserting store availability or completing the predecessor's external deployment verification.

## Decisions

### 1. Replace the page hierarchy, not just its disclaimer

Use semantic static HTML and the existing dark green palette with more whitespace and a dominant watch image. Keep page copy in the existing template/site metadata convention rather than introducing a CMS.

Proposed copy and order:

1. Header: Tallyform wordmark, How it works and Features anchors.
2. Hero headline: **Stay in the flow. Make every attempt count.**
3. Supporting copy: **Track makes, misses, and your make rate from your wrist. Set your distance, record each attempt, and keep your attention on practice—not your phone.**
4. Primary CTA: **See how it works**, linking to the walkthrough. Plain **In development for Amazfit Bip Max** availability text; no download badge.
5. Benefit sections: **One tap. Back to practice.** (made/missed recording); **Know your numbers.** (selected-distance make rate); **Move the challenge.** (swipe distance and metres/feet); **Mistapped? Undo it.** (last-attempt correction).
6. Walkthrough: Set your distance → record your attempts → check your make rate.
7. Simple footer: Tallyform, page navigation and a discreet **Technical details** link.

Avoid 'track your progress over time', timers, weight settings, saved history, supported physical buttons, invented reviews or efficacy guarantees. These are not established current capabilities. Removing internal jargon does not require inventing a release claim.

### 2. Produce one reviewed hero offline with an image model

Use the existing capture output as the UI reference and the user's example as a composition reference. The example's Basket Birdie UI must not survive. Produce a large three-quarter Bip Max render with restrained studio lighting, a background compatible with the page and a legible Tallyform display. Remove simulator window chrome in the generated result. Do not repair alignment with layered browser elements.

Use an image-capable tool/service during asset authoring, not on every Pages build. Select and verify the actual tool/model before use rather than assuming it is unavailable. Resolve any necessary credentials, billing or reference-image permissions before invoking a paid external service. Simulator capture is already working; the verified outstanding requirement is a produced and reviewed watch-render hero, not a missing screenshot capability. An operator-supplied model-generated result can satisfy the same review contract.

Review the actual output against the capture and Bip Max reference: hardware silhouette/buttons, glass perspective, bezel fit, Tallyform name/descriptor, 4 m, Made 5, Missed 1, 83%, units and utility controls. Inspect full resolution and desktop/mobile placement. A failed candidate is regenerated, not silently accepted. Preserve the original capture separately because even reviewed generative artwork is an illustration, not pixel-exact evidence.

Store the approved single image and small JSON manifest under `website/assets/`. The manifest records model/provider, prompt, reference source and digest, UI source fingerprint, canonical state, artwork digest, review decision and date. Keep reference files durably available; do not point to temporary paste files. Optimize the approved asset for the web while retaining its reviewed master or reproducible export identity. No remote hotlinks.

### 3. Preserve capture provenance independently of artwork identity

Keep the raw `screenshot.png` and `provenance.json` generated by the existing pipeline. Add a static `technical.html` containing the raw capture, source/app/target details and artwork provenance; move evidence-boundary language there and into development docs. Link it unobtrusively from the footer. Hero alt text describes an illustrative Bip Max render displaying Tallyform.

Bind hero approval to a deterministic content fingerprint of sorted relative paths and bytes of app source/assets (excluding generated build output), the app manifest, pinned toolchain lockfile and canonical demo-state definition. Do not use HEAD alone: local app changes are currently uncommitted, and marketing-only commits should not invalidate unchanged UI artwork. A conservative source fingerprint may require review after invisible app changes; this is preferable to publishing a stale UI hero.

Do not require every fresh raw screenshot to have the identical file digest as the reference: window-title changes and PNG encoding can vary without UI changes. Preserve the original reference digest, compare the represented source fingerprint and canonical state, and retain the fresh capture's independent identity.

### 4. Extend the existing generator rather than fork it

Validate required hero manifest fields, review status, actual image digest and source fingerprint before replacing output. Copy hero, raw capture, metadata, CSS and both HTML pages into the staged output. Missing/unreviewed/modified/stale hero is an actionable error, never a raw-screenshot or old-image success fallback. Keep the previous complete output intact on failure.

Render previews of copy/layout from existing captures for development without claiming a new capture or rewriting their provenance. Run the complete `npm run generate-website` path for final acceptance. The static build must not depend on live image-service availability once approved artwork exists.

### 5. Verify behavior and appearance separately

Add deterministic contract tests for missing hero, digest mismatch, unreviewed status, stale UI fingerprint, accepted unchanged UI and retaining previous output after failure. Remove incidental copy/wiring assertions rather than pinning new wording. No test can certify visual fidelity; use browser review at 375 px and 1440 px, keyboard traversal, CTA/technical links and a repository-subpath preview. Observe the final generated hero at actual size, not only a thumbnail.

## Risks / Trade-offs

- Image generation may alter text or hardware → explicit reference comparison and user review; no claimed success until an acceptable asset exists.
- Reviewed watch artwork not yet produced → keep asset production and review open; preserve the working simulator capture and do not infer endpoint unavailability from the missing hero file.
- Old and new pending specs conflict → reconcile predecessor presentation requirements before sync/archive, preserving raw evidence access and build gates; do not blindly merge both sets.
- Render rights or external service cost unclear → use approved references and obtain necessary authorization before asset production.
- Hero dominates narrow screens or becomes unreadable → responsive layout, intrinsic image dimensions, keyboard/contrast review and full-size mobile inspection.
- Stale source identity → content fingerprint independent of git commit and screenshot encoding; never label generated artwork as a raw capture.

## Migration Plan

Implement on the current website source after approval. Keep the last successful generated site until the reviewed hero and new output pass all checks. Deploy through the existing Pages workflow only after local validation; no public deployment is claimed here. Roll back the website artifact as a unit if visual review fails, without changing watch data or the capture pipeline. Reconcile the in-flight predecessor and this successor before archiving either into a combined baseline.

## Approved delivery extension

The user requested two end-to-end outcomes: show and approve the current demo before publishing it, and make that process repeatable. They selected a supplied model-generated hero and the public `Fuzzwah/tallyform` repository. Hero production remains pending until the supplied image is available; no approval is inferred.

Split generation from publication. Generation uploads a review bundle containing the complete site and a SHA-256 identity covering sorted relative file paths and bytes. The operator previews this exact bundle and obtains explicit website sign-off. A separate manual publication workflow accepts the generation run ID, approved digest and confirmation from the personal repository owner. It verifies the source run and downloaded bytes, then deploys them without building or capturing again. Changes require renewed review; expired artifacts require regeneration and review. Hosted workflow and public URL verification remain separate from local tests and CLI smoke evidence.
