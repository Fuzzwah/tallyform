# Rep Tracker

Standalone Zepp OS app extracted from Basket Birdie. Read README.md and docs/continuation.md before work. The final name is not selected.

- Use native @zos widgets and ES2015-compatible JavaScript. Keep domain logic free of native, Node and browser dependencies.
- Use the pinned local Zeus CLI through npm scripts. Run npm test and npm run build for behavioral or packaging changes.
- Keep this repo independently installable; do not reference the old checkout or share its node_modules.
- Generic measurements, history and new recording modes are proposed, not shipped.
- Host tests and simulator captures do not establish physical watch acceptance. Do not claim submission/publication without evidence.
- Do not silently select a candidate name or invent a registered app ID. Current branding and ID are inherited prototype metadata.

## OpenSpec

- Use OpenSpec for planned feature and behavior changes. Read `openspec/config.yaml` and relevant specs/changes before planning; explore unresolved product decisions rather than silently choosing them.
- Keep proposal/review separate from implementation. Use the generated Oh My Pi workflows in `.omp/`; implement a proposed change only when the user requests it.
- OpenSpec is local, not a required global tool. Replace bare `openspec ...` examples in generated workflows with `npm run openspec -- ...` from the repository root. Use `npm run --silent openspec -- ...` when parsing JSON.
- Keep generated `.omp/` integrations managed by `npm run openspec -- update`; put project-specific context and artifact rules in `openspec/config.yaml`.
- Historical `docs/prototype-specification/` is not the standalone spec baseline. Empty `openspec/specs/` means no baseline has been authored, not that proposed features are approved.
