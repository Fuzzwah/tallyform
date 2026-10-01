# Tallyform — Reps & Practice Tracker

Standalone Zepp OS app spun out of Basket Birdie's putting-practice experiment. Tallyform is the current product identity; Basket Birdie remains a separate product. The goal is broad support across Zepp OS watches, not a Bip Max-only product; Bip Max is the current build and simulator target, not a verified compatibility list for other models.

**Current source:** the Bip Max native page offers simple repetition and success/failure modes, distance/weight/duration settings and unitless counting, undo, finish/summary, saved history and scoped recovery. Active state and summaries use verified versioned files; valid same-ID `putting-session-v1` snapshots are imported read-only. The stopwatch/countdown model is pure code only; timer controls and background alerts are not integrated. Host tests exercise all modes/types; the simulator exercised outcome/distance migration, save/reopen/history and generic capture. No physical-watch acceptance.

## Develop

Requires Node >=20.19.0. Dependencies and lockfile are local to this repository; no Basket Birdie checkout is required.

```sh
npm ci
npm test
npm run build
npm run dev
```

`dev` requires the Zepp simulator. `npm run preview` uses the paired-watch developer flow. Watch source is in `app/`; build output is in `app/dist/`. This keeps host tests and planning documents out of the watch package.

Website capture now exercises the generic outcome page. The existing approved hero depicts the **old putting UI** and fails the changed-source/artwork provenance gate; obtain a renewed reviewed hero and explicit site approval before regenerating or publishing. See [website generation](docs/website-generation.md).

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

`docs/prototype-specification/` is historical, not the standalone baseline. The
approved `tallyform-first-store-release` change in `openspec/changes/` tracks the
remaining watch, timer, compatibility and publication gates.

## Product and release work

Read [the product brief](docs/standalone-rep-tracker-brief.md) and [continuation notes](docs/continuation.md). Simple/outcome modes and one measurement type per session are implemented in source. Custom numeric measurements and timers are not available in the watch page.

The manifest app ID `1126719` is inherited development metadata, not a verified store registration. Before release, register this product in the publisher's Zepp account and use its assigned ID. The inherited icon still needs replacement; Tallyform is the current product branding.

The new page has host and Bip Max simulator evidence, but no physical-watch acceptance or Zepp store submission. New-session hardware mapping, timer integration and other-model layouts remain open. See the [device-support candidate matrix](docs/device-support-matrix.md) and [simulator/watch instructions](docs/zepp-os-simulator-and-watch-validation.md); matrix candidates are **not** a supported-model list.

## Origin

Extracted from the uncommitted putting-tracking workspace on 2026-09-29. The original Basket Birdie checkout is preserved. Only the putting prototype, tests, relevant evidence and planning documents were copied. `docs/prototype-specification` records the original experiment and its remaining device gate, not completion of the generic tracker.
