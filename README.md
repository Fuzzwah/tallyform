# Tallyform — Reps & Practice Tracker

Standalone Zepp OS app spun out of Basket Birdie's putting-practice experiment. Tallyform is the current product identity; Basket Birdie remains a separate product. The goal is broad support across Zepp OS watches, not a Bip Max-only product; Bip Max is the current build and simulator target, not a verified compatibility list for other models.

**Current implementation:** the Tallyform putting prototype, with metres/feet, swipe distance adjustment, made/missed outcomes, undo, local session recovery and the mockup-inspired native UI. Generic measurement types, saved-session history and new recording modes are planned, not implemented.

## Develop

Requires Node >=20.19.0. Dependencies and lockfile are local to this repository; no Basket Birdie checkout is required.

```sh
npm ci
npm test
npm run build
npm run dev
```

`dev` requires the Zepp simulator. `npm run preview` uses the paired-watch developer flow. Watch source is in `app/`; build output is in `app/dist/`. This keeps host tests and planning documents out of the watch package.

To generate the static marketing site, prepare the macOS simulator runner and reviewed Bip Max hero, then run `npm run generate-website`. The current user-supplied hero has a transparent background; the raw simulator capture remains on a separate technical page. Capture closes the device window and confirms QEMU's Quit dialog while leaving the simulator manager open. See [website generation](docs/website-generation.md) for preparation, review/sign-off, provenance, and approval-gated GitHub Pages deployment.

## Spec-driven changes

[OpenSpec](https://github.com/Fission-AI/OpenSpec) is pinned as a local development
dependency and installed by `npm ci`; no global installation is required.
`openspec/config.yaml` supplies project context and artifact rules using the
standard `spec-driven` schema. Oh My Pi skills and commands are in `.omp/`.

Start a new Oh My Pi session in this repository after setup to load the commands:

- `/opsx-explore` — work through unresolved product choices without implementing.
- `/opsx-propose <idea>` — draft a proposal, requirements, design and tasks for review.
- `/opsx-apply <change-name>` — implement an approved change.
- `/opsx-update <change-name>` — revise a change's planning artifacts.
- `/opsx-sync <change-name>` — merge its delta requirements into the main specs.
- `/opsx-archive <change-name>` — archive a completed change and sync its specs.

Slash commands run in Oh My Pi, not in the shell. Use the local CLI in the shell:

```sh
npm run openspec -- list
npm run openspec -- doctor
npm run openspec -- validate --all --strict
npm run openspec -- update
```

Use `npm run --silent openspec -- <arguments>` for clean JSON output. Generated
workflows show bare `openspec` commands; invoke those through this npm script.
OpenSpec supports `OPENSPEC_TELEMETRY=0` to disable its anonymous usage telemetry.

Commit `openspec/` and `.omp/` with the code. Refresh generated integration files
with `update` after upgrading the pinned dependency; do not customize generated
commands or skills directly. Put project-specific guidance in `openspec/config.yaml`
and `AGENTS.md`.

The initial specs and changes directories are intentionally empty. Existing
`docs/prototype-specification/` remains historical evidence, not approved
requirements for the standalone tracker. Use exploration to resolve the choices
in `docs/continuation.md` before proposing those features.

## Product and release work

Read [the product brief](docs/standalone-rep-tracker-brief.md) and [continuation notes](docs/continuation.md). The intended product supports configurable distance, duration, weight and custom numeric settings. Recording modes and one-versus-multiple measures per session are still open decisions.

The manifest app ID `1126719` is inherited development metadata, not a verified store registration. Before release, register this product in the publisher's Zepp account and use its assigned ID. The inherited icon still needs replacement; Tallyform is the current product branding.

The prototype has host and simulator evidence, but has not been accepted or published in the Zepp store. Physical button mapping and recovery still require watch validation. See [simulator/watch instructions](docs/zepp-os-simulator-and-watch-validation.md); Basket Birdie paths there are historical. Use this repository's npm commands above.

## Origin

Extracted from the uncommitted putting-tracking workspace on 2026-09-29. The original Basket Birdie checkout is preserved. Only the putting prototype, tests, relevant evidence and planning documents were copied. `docs/prototype-specification` records the original experiment and its remaining device gate, not completion of the generic tracker.
