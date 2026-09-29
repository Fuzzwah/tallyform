# Tasks

## 1. Customer-facing page

- [x] 1.1 Rework `website/template.html` and `website/site.json` around the design's benefits-led headline, implemented feature benefits and three-step walkthrough; remove release-gate copy and build panels from the customer page and review claims against current app behavior.
- [x] 1.2 Rework `website/styles.css` for a dominant single watch hero, readable feature sections and responsive mobile layout; implement semantic navigation, visible focus and the working walkthrough CTA without a fake store/download action.

## 2. Image-generated Bip Max hero

- [x] 2.1 Prepare durable copies of the working Tallyform simulator capture and authorized Bip Max composition reference; record reference identity and UI source inputs without replacing or reimplementing capture.
- [x] 2.2 Obtain the Tallyform-on-Bip-Max hero using the user-approved supplied-artwork route. Preserve the original attachment and record unknown model/provider/prompt honestly; no CSS overlay.
- [ ] 2.3 Review generated candidates against source UI and hardware at full resolution and intended page sizes; obtain user approval of bezel/perspective alignment, exact text and canonical values before storing the optimized single hero asset and review manifest.

## 3. Asset contract and technical resources

- [x] 3.1 Extend the existing website generator with deterministic app-source fingerprinting and hero manifest/digest/review validation; reject missing, altered, unreviewed or stale assets before replacing current output while permitting unchanged UI artwork across marketing-copy changes.
- [x] 3.2 Package the reviewed hero and add a separate static technical page with original screenshot, build provenance and artwork provenance; keep relative links working beneath a Pages repository subpath and preserve the existing capture/build sequence.
- [x] 3.3 Add behavior tests for rejected hero states, accepted unchanged UI and preservation of the last complete output on validation failure; remove incidental copy/wiring assertions instead of pinning new copy.

## 4. End-to-end acceptance

- [x] 4.1 Run `npm test` and `npm run build`, then `npm run generate-website` on the prepared simulator; verify the complete generated output includes the supplied hero and independently identified raw capture without calling an image model during normal generation.
- [x] 4.2 Serve the generated site under a repository subpath and inspect it in a real browser at 375 px and 1440 px; exercise keyboard navigation, walkthrough and technical-resource links, check contrast/overflow/assets, and show the final hero and customer page to the user for visual review.
- [x] 4.3 Update `docs/website-generation.md` with artwork production/review, invalidation and technical-resource behavior; retain physical-watch/store boundaries in engineering documentation rather than marketing copy, and record actual verification without claiming publication.
- [x] 4.4 Reconcile this successor's presentation requirements with the pending `tallyform-branding-and-website` change before spec sync/archive; preserve its capture/provenance gates and leave its unverified GitHub deployment tasks open.

## Apply status

The user supplied the hero and requested transparent background removal. The original attachment is preserved; the RGBA export is packaged with honest provenance (generation model/provider/prompt not disclosed). Complete generation and desktop/mobile browser review passed. Final artwork/page sign-off and public deployment remain pending. Simulator cleanup now confirms QEMU's Quit dialog; the successful end-to-end run left QEMU absent and the simulator manager open.

## 5. Approved delivery and repeatable publication

- [x] 5.1 Create the user-selected `Fuzzwah/tallyform` repository and configure the local remote without claiming website publication.
- [x] 5.2 Separate review-artifact generation from manual owner-approved publication; bind approval to run ID and site digest and deploy without regeneration.
- [x] 5.3 Exercise artifact verification and tamper rejection locally; run host tests and watch build; document the operator preview/sign-off workflow.
- [ ] 5.4 Receive the user-supplied model-generated hero, complete artwork review, generate and show the actual website demo, and obtain explicit website sign-off.
- [ ] 5.5 Verify hosted generation and approval-gated publication, inspect the public URL, and report actual delivery.

Local release verification: 39 host tests and the watch build passed. A throwaway CLI smoke sealed and verified identical bytes and rejected modified HTML. No hosted workflow or final website deployment has been executed. The repository exists but has not received a source push.

## 6. User-requested preview corrections

- [x] 6.1 Remove the hero's outer white background and white strap gaps while preserving the watch UI and original supplied master; inspect the transparent export on desktop and mobile.
- [x] 6.2 Close the simulator device window after capture, confirm the QEMU Quit dialog without user interaction, and exercise the actual generator to verify the manager remains open.
