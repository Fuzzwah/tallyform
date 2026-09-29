---
name: generate-website
description: Generate the Tallyform marketing website from the current Bip Max Zepp simulator build. Use when the user asks to refresh the GitHub Pages demo or says generate website.
allowed-tools: Bash(npm:*) Bash(node:*) Bash(gh:*)
license: MIT
---

# Generate the Tallyform website

Run this workflow only from the repository root on a prepared macOS GUI session with the Zepp simulator's Bip Max device runtime available.

1. Verify the local simulator connection without exposing credentials:

   ```sh
   npm run --silent zeus -- status
   ```

   Open the Bip Max device using the simulator manager's Emulator button, then open Tallyform from its Apps list. Confirm the app is visible rather than the watch face. The capture step closes the device window and confirms QEMU's Quit dialog automatically; reopen the device before a subsequent run. Leave the simulator manager running.

2. Verify that `website/assets/hero.png` and `hero.json` contain real, reviewed image-generated artwork representing the current app. If absent, use the reference images and prompt under `website/assets/references/` to produce a candidate with an authorized image service, or request the operator-supplied generated image. Review it against the capture and obtain explicit artwork approval; never fabricate approval metadata or substitute a screenshot overlay. Then run the shared generator:

   ```sh
   npm run generate-website
   ```

3. Treat a non-zero result as failure. Do not copy a historical screenshot, create a placeholder, or claim a website refresh when simulator capture or provenance validation fails.

4. On success, seal a new review bundle with `node tools/website-release.mjs seal website/dist /tmp/tallyform-review-<unique-id>`. Record the printed site digest. Serve that bundle's `site/` directory, not the mutable generation directory. Review it in a browser at 375 px and 1440 px, including the hero, keyboard focus, walkthrough CTA and technical links. Show the demo URL and screenshots to the user and request explicit website sign-off. Keep the preview available for review. Any change requires a new bundle and renewed sign-off.

5. Prefer publishing the exact approved local bundle: run `node tools/publish-reviewed-website.mjs <bundle-directory> <approved-digest>` only after explicit user sign-off. It verifies and preserves the bundle on a dedicated review branch, then dispatches the owner-gated Pages workflow with its immutable commit and digest. It does not regenerate or recapture.

6. Alternatively, with a prepared self-hosted simulator runner, manually dispatch `generate-website.yml`. Download and preview that run's `website-review` artifact, verify its digest, and obtain sign-off for those exact bytes. Then dispatch `publish-website.yml` with `generation_run_id`, `approved_sha256` and `confirm_approval=true`. Specify either `review_commit` or `generation_run_id`, never both. Neither route treats generation or hero approval as website sign-off.

7. Observe the deployment result and open the returned live Pages URL. Verify the actual hero, navigation and technical resources; report the URL and verification evidence. Do not claim publication based on dispatch alone. If a runner, Pages configuration, artifact or approval is missing, report that specific prerequisite.

See `docs/website-generation.md` for runner setup, preview commands and publication instructions. Report build/capture provenance separately from the customer demo.

The generator runs host tests, builds the current app, refreshes the simulator from the same checkout, establishes the visible canonical state, captures the simulator window, validates provenance, and renders static output for GitHub Pages. Simulator evidence is not physical-watch acceptance, Zepp registration, store submission, or publication evidence.
