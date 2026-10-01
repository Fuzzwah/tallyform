# Rep Tracker

Standalone Zepp OS app extracted from Basket Birdie. Read README.md and docs/continuation.md before work. Tallyform is the current working name; publisher-registered identity is unverified.

- Use native @zos widgets and ES2015-compatible JavaScript. Keep domain logic free of native, Node and browser dependencies.
- Use the pinned local Zeus CLI through npm scripts. Run npm test and npm run build for behavioral or packaging changes.
- Keep this repo independently installable; do not reference the old checkout or share its node_modules.
- Generic modes, fixed-type measurements, versioned active/history storage and same-ID read-only legacy import are implemented in source; native timer integration and physical acceptance are not.
- Host tests and simulator captures do not establish physical watch acceptance. Do not claim submission/publication without evidence.
- Do not invent a registered app ID. Current branding is a working identity and the manifest ID is inherited development metadata.

## Bip Max simulator: direct launch (macOS)

- The installed Zepp OS Simulator app (`/Applications/simulator.app`) is still needed as the Zeus CLI bridge on `127.0.0.1:7650`; the watch itself is QEMU on port `7833`. Use the manager to download/select **Bip Max v1.0.0** once, but **do not automate a click on its Emulator button**. `npm run build` only packages; `npm run dev` builds/deploys and watches source, and needs the manager bridge. `npm run preview` is the separate paired-watch flow.
- Open the manager with `open -a /Applications/simulator.app` if it is not already running. It may auto-start the selected watch. First check `lsof -nP -iTCP:7650 -iTCP:7833 -sTCP:LISTEN`: if QEMU already owns `7833`, **reuse it**, never start a second QEMU against the same `norflash.bin` or host port. `7650` should belong to `simulator`.
- To start the selected watch **without** the Emulator button, run these commands in a separate terminal. The selected image ID is the `platform` field in the manager's local config; do not hard-code a device-image hash. `start_qemu.sh` must run with the bundled `firmware/` directory as its working directory, and `ZEPP_FW_DIR=...` must be a **script argument** (merely exporting it is overwritten by the script):

  ```sh
  FW_ID="$(node -p 'JSON.parse(require("node:fs").readFileSync(process.env.HOME + "/Library/Application Support/simulator/config.json", "utf8")).platform')"
  FW_DIR="$HOME/.zepp/emulator_cache/$FW_ID"
  test -f "$FW_DIR/main.elf" && test -f "$FW_DIR/norflash.bin"
  cd /Applications/simulator.app/Contents/Resources/firmware
  bash ./start_qemu.sh "ZEPP_FW_DIR=$FW_DIR"
  ```

- Keep that foreground process running. The bundled script starts `./qemu_mac/qemu-system-arm` with the selected `main.elf`, writable `norflash.bin`, a Cocoa window and `hostfwd=tcp::7833-:7833`. Verify both listeners with the `lsof` command above; a connected Zeus message alone does not prove the watch window is displaying the app. Back in the **repository root**, run `npm run dev` in another terminal; expect `simulator connected`, `rebuild done`, and `refreshing simulator`.
- Direct QEMU boot may show the **watch face**, not Tallyform; the manager's Apps row is not a reliable launcher for a directly booted QEMU. Focus the `Zepp OS Simulator` watch window, press **Home** (Mac `fn`+`←`) for the watch app list, navigate with `↑`/`↓` to **Tallyform** (not **Tallyform Alarm Probe**), then press **Enter**. Official simulator keys: Home = app list/watch face, Delete = Back, End (`fn`+`→`) = shortcut, arrows = navigation. For scripted Home on this Mac, `osascript -e 'tell application "System Events" to tell process "qemu-system-arm" to set frontmost to true' -e 'tell application "System Events" to key code 115'` worked; key codes `126`/`125` are Up/Down and `36` is Enter. List ordering is not stable: inspect before selecting. If QEMU captures the pointer, `ctrl`+`option`+`g` releases it.
- For visual proof, `swift tools/simulator-window.swift` identifies the live QEMU window; `node tools/capture-simulator.mjs --output /tmp/tallyform-screen.png` requires clean outcome/distance setup, verifies the real `4 m`, `5/6 here`, `83% total` state, and **closes QEMU** afterward. It does not discard an active session. Do not mistake simulator captures for physical-watch or store acceptance. For normal shutdown, close the watch window and confirm Quit if prompted, then ensure port `7833` is free. **Do not** use `start_qemu.sh stop`: it forcibly kills every `qemu-system-arm` process.
- Verified locally: the direct script opened a 432×542 QEMU window and listener on `7833` while the manager served `7650`; `npm run dev` connected, built and refreshed, and Home → watch app list → Tallyform opened the app's `New practice` screen. This is a local simulator run, not a claim that the direct launcher is a documented upstream interface.

## OpenSpec

- Use OpenSpec for planned feature and behavior changes. Read `openspec/config.yaml` and relevant specs/changes before planning; explore unresolved product decisions rather than silently choosing them.
- Keep proposal/review separate from implementation. Use the generated Oh My Pi workflows in `.omp/`; implement a proposed change only when the user requests it.
- OpenSpec is local, not a required global tool. Replace bare `openspec ...` examples in generated workflows with `npm run openspec -- ...` from the repository root. Use `npm run --silent openspec -- ...` when parsing JSON.
- Keep generated `.omp/` integrations managed by `npm run openspec -- update`; put project-specific context and artifact rules in `openspec/config.yaml`.
- Historical `docs/prototype-specification/` is not the standalone spec baseline. Empty `openspec/specs/` means no baseline has been authored, not that proposed features are approved.
