# Zepp OS simulator and physical-watch validation guide

This document records the repeatable setup, commands, observations, and limits from a Zepp OS validation session. It is intended as a handoff for agents working on other Zepp OS apps.

It is not a claim that every Zepp OS app, simulator model, firmware, or macOS release behaves identically. Treat every runtime result as model- and firmware-specific evidence.

## 1. Validation boundary

Use three separate evidence classes:

1. **Host evidence** — Zeus builds, host tests, package metadata, and CLI behavior.
2. **Simulator evidence** — the Zepp OS desktop simulator and its emulated device runtime.
3. **Physical-watch evidence** — the actual watch model, firmware, API, display geometry, battery state, permissions, and user input.

A simulator build or simulator smoke test does not close a physical-device acceptance gate. A physical result on one model does not qualify another model.

The session used an Amazfit Bip Max with:

- device source: `11206915`
- physical display reported by the watch: `390x450`
- physical keys: `2`
- Zepp OS: `6`
- firmware: `3.17.0.4`
- API: `4.4`

The project manifest targeted the Bip Max through the `PikeW` platform and device source `11206915`, with a `432x514` design target. Always record both the manifest target geometry and the runtime-reported geometry; they may differ.

## 2. Host and Zeus CLI setup

The project used a local, pinned Zeus installation rather than relying on a global binary:

```text
@zeppos/zeus-cli 1.9.3
@zeppos/device-types 4.0.0
Node v22.23.2
npm v12.0.2
```

The local executable was:

```text
node_modules/.bin/zeus
```

Check the CLI and account state without exposing credentials:

```bash
node_modules/.bin/zeus --version
node_modules/.bin/zeus status
```

A healthy logged-in status includes:

```text
login status: logged
simulator connect status: connected
simulator host: 127.0.0.1
simulator port: 7650
```

The status command reads local CLI state. It does not prove that a device runtime is actually running until the simulator or watch connection is exercised.

## 3. Official simulator download

The current official download page is:

<https://docs.zepp.com/docs/guides/tools/simulator/download/>

For an Intel Mac on macOS 14 or later, use the Intel package. The session host was an Intel 2019 MacBook Pro running macOS 15.7.4, so the Intel package was selected.

The official simulator v2 setup guide is:

<https://docs.zepp.com/docs/guides/tools/simulator/>

The older v1 setup guide is separate:

<https://docs.zepp.com/docs/guides/tools/simulator/setup/>

Do not apply the v1 Tunnelblick/tun-tap procedure automatically to v2. v2 is intended to simplify installation and uses the bundled emulator path. The v1 guide still matters when an older simulator is deliberately being used.

Typical installation sequence:

1. Download the official Intel `.dmg`.
2. Mount it with Finder or `hdiutil`.
3. Copy `simulator.app` to `/Applications`.
4. Launch the simulator.
5. Sign in when the simulator first opens.
6. Open **Device Simulator Download Management**.
7. Download the device model and firmware version required by the app.
8. Select the downloaded model and open **Device Simulator**.

The simulator main window can be launched directly when automation or a supervisor needs a stable executable:

```text
/Applications/simulator.app/Contents/MacOS/simulator
```

## 4. macOS QEMU permission failure

On this host, the newly installed simulator initially failed to start the device runtime. Its log showed:

```text
chmod: Unable to change file mode on qemu_mac/qemu-system-arm: Operation not permitted
./start_qemu.sh: line 122: ./qemu_mac/qemu-system-arm: Permission denied
```

The embedded QEMU binary had mode `-rw-r--r--` and a `com.apple.provenance` extended attribute. Both the simulator script and a direct shell `chmod` were denied by macOS. Running `sudo chmod` was not used as a blind workaround.

A working repair was:

1. Copy the complete app bundle to a temporary location.
2. Copy the QEMU binary out to a normal writable temporary path.
3. Set the executable bit on that temporary copy.
4. Remove the non-executable QEMU file from the temporary app bundle.
5. Copy the executable temporary copy back into the bundle.
6. Replace the newly installed app with the repaired copy.
7. Verify the nested code signature.

The essential operations were equivalent to:

```bash
# Use the actual mounted volume and app paths for the downloaded version.
ditto "/Volumes/simulator 2.1.2/simulator.app" /tmp/simulator-fixed.app

cp /tmp/simulator-fixed.app/Contents/Resources/firmware/qemu_mac/qemu-system-arm \
  /tmp/qemu-system-arm
chmod +x /tmp/qemu-system-arm

rm /tmp/simulator-fixed.app/Contents/Resources/firmware/qemu_mac/qemu-system-arm
cp /tmp/qemu-system-arm \
  /tmp/simulator-fixed.app/Contents/Resources/firmware/qemu_mac/qemu-system-arm

codesign --verify --deep --strict /tmp/simulator-fixed.app
```

Only after the verification succeeds should the repaired app replace the freshly installed simulator app. Preserve an existing working installation rather than deleting an unknown application.

After launch, verify the QEMU payload and runtime sockets:

```bash
stat -f '%Sp %N' \
  /Applications/simulator.app/Contents/Resources/firmware/qemu_mac/qemu-system-arm

lsof -nP -iTCP:7650 -sTCP:LISTEN
lsof -nP -iTCP:7833 -sTCP:LISTEN
```

The session produced:

- simulator control API: `*:7650`
- device QEMU runtime: `*:7833`
- QEMU process: `qemu-system-arm`

The device runtime process command included:

```text
start_qemu.sh ZEPP_FW_DIR="/Users/.../.zepp/emulator_cache/<device-id>"
```

## 5. Sign-in and device-model selection

The simulator first opened a Zepp Account login page. The simulator account login is separate from simply having a local Zeus CLI installation; an agent should not attempt to extract or print passwords or tokens.

After login, the model manager showed both Bip Max and Bip 6 images. The session selected:

```text
Bip Max v1.0.0
```

The simulator configuration recorded the Bip Max image as downloaded and selected. The actual emulator cache was under:

```text
~/.zepp/emulator_cache/<device-id>
```

The main simulator UI and the QEMU device window are separate surfaces. Seeing the main simulator window does not prove that the device emulator is open. Confirm the QEMU process and port 7833 before running a device preview.

## 6. Zeus simulator development mode

Run the development preview from the app directory:

```bash
cd /path/to/project
/path/to/node_modules/.bin/zeus dev --target "Amazfit Bip Max"
```

For this repository, the command was:

```bash
cd /Users/fuzzwah/Projects/zepp-disc-golf-app/experiments/phase0a-probe
../../node_modules/.bin/zeus dev --target "Amazfit Bip Max"
```

Important details:

- The accepted target string was `Amazfit Bip Max`.
- The manifest key `432x514-amazfit-bip-max` is not the CLI target name and produced a warning.
- The first run prompted for the simulator host. Accepting the default `127.0.0.1` was correct.
- Zeus connected directly to `http://127.0.0.1:7650`.

A successful development log contained:

```text
connecting to simulator on http://127.0.0.1:7650 ...
simulator connected
rebuilding...
rebuild done
refreshing simulator...
watching the changes in this project...
```

`zeus bridge` is not required for this direct local `zeus dev` flow. Running `zeus bridge` before a simulator or online app is available produces:

```text
No connectable online App or Simulator.
```

That message means the bridge had no endpoint; it is not evidence that the CLI installation is broken.

## 7. Physical-watch preview deployment

Stop the simulator development watcher before switching to a physical watch so logs and target selection cannot be confused.

Build the app with official Zeus tooling:

```bash
npm run build:diagnostic
```

Generate a watch preview QR code:

```bash
cd /path/to/project
/path/to/node_modules/.bin/zeus preview --target "Amazfit Bip Max"
```

The QR output is labeled with the target and package version, for example:

```text
[Amazfit Bip Max] Basket Birdie-1.0.20
```

Scan the QR code through the Zepp app’s developer/preview flow, install the package, and open it on the watch. A physical user may need to perform the phone/watch pairing or QR scan; an agent should report that as an explicit external step rather than marking deployment complete prematurely.

Battery guidance:

- Around 65% was adequate for the short diagnostic probes in this session.
- Start endurance tests at least 80%, as required by the power gate.
- A storage probe is short but should still be run only when the watch is stable and not displaying a low-battery warning.

## 8. Diagnostic probe design

The probe used only a small set of native APIs:

```text
@zos/ui
@zos/device
@zos/display
@zos/settings
@zos/sensor
@zos/interaction
@zos/router
@zos/utils
```

It records:

- runtime device identity
- screen geometry and key count
- OS, firmware, and API values
- page init/destroy counts
- screen-off/screen-on counts
- wake, destroy, reopen, and idle timing fields
- two-generation persistence revisions
- disposable capacity-probe results

Automatic wake relaunch is intentionally disabled in the safety build. The probe records wake behavior without forcing itself back onto the screen after a wake event.

Persistence used two files, alternating slots and validating the complete envelope after each write. The capacity probe used 16 KiB disposable files and a configured 8 MiB ceiling. It cleaned only its own `phase0a-capacity-*` files.

### Touch regions

The safety build uses explicit native buttons:

```text
top-left:        EXIT
top-middle-left: SAVE
top-middle-right: OFF
top-right:       IDLE
```
On the physical Bip Max, the system title bar occupies the top of the page. The safety build starts the action bar at `y=72` and the status text at `y=128` so button labels remain visible below that title bar.

The status area is display-only. Status taps are recorded but do not trigger persistence or capacity tests. The capacity probe is intentionally disabled in the physical safety build because its synchronous disposable-file loop can block the watch runtime; run that probe in the simulator until an incremental implementation is available.

Physical-button events are recorded and passed through to the watch’s normal behavior. They do not arm a trial or get consumed by the probe. Use the visible **EXIT** button or the normal swipe-back gesture to leave the probe.

Use the visual regions, not literal pixel measurements from a camera image. The design target and physical runtime geometry may differ.
### Physical safety smoke test

The refreshed `1.0.21` / code `22` preview was installed on the physical Bip Max. The action buttons rendered below the system title bar, and tapping **EXIT** returned to the app list. This closes the prior action-bar placement and exit-path issue for this build.

The hardened preview was then exercised for one persistence round-trip: `SAVE` advanced the revision and changed the slot, **EXIT** returned to the app list, and reopening the app recovered the same revision/slot. This is one successful physical recovery path, not the full restart matrix.

The same `SAVE` → `EXIT` → reopen cycle was then completed 10 consecutive times on the physical Bip Max. All 10 cycles recovered the expected saved state without a reboot or visible interaction failure.

The first diagnostic layout rendered too many lines for the physical `390x450` display. Capacity output was below the visible area even when the probe result existed. The fix was to render `capacityLines` and `persistenceLines` near the top of the status text. The diagnostic build code was later bumped to `22` for subsequent provenance; the physical capacity screenshot in this report is from code `21`. This is a general lesson: diagnostic output must be compact and prioritize the result being measured.

## 9. Simulator observations

The Bip Max simulator successfully:

- launched the app through Zeus development mode
- accepted a package refresh
- displayed `Basket Birdie` in the app list
- connected on port 7650
- started QEMU on port 7833
- ran the two-generation persistence probe
- reached the configured 8 MiB disposable-write ceiling
- reloaded the app and recovered the latest persistence revision
- recorded a natural-timeout wake without an app relaunch

Measured simulator probe results:

```text
capacity:       8,388,608 bytes
files:          512
capacity error: none
persistence:    revision 3
valid files:    2
invalid files:  0
idle wake:      24,078ms
```

The simulator’s own device-info output reported OS/API values that did not match the physical watch. Therefore, simulator identity is not a substitute for a physical runtime identity capture.

## 10. Physical Bip Max observations

### Runtime identity

The physical watch displayed:

```text
deviceSource: 11206915
display:       390x450
keys:          2
OS:            6
firmware:      3.17.0.4
API:           4.4
```

This is the required model/firmware evidence for this Bip Max session.

### Persistence

The watch showed revisions advancing while slots alternated between `0` and `1`. After exiting and reopening the app, the diagnostic screen showed:

```text
life i=10 d=9
persist rev=26 slot=1
```

The revision survived the app exit/reopen cycle. This is evidence for one recovery path, not the full recovery gate.

### Screen and natural timeout

A real-watch timeout run showed screen-off and screen-on counts increasing and the app returning to the diagnostic page. The watch remained alive; no idle destruction or relaunch was shown in that run.

The timing fields did not agree with the manually observed interval. One run reported values such as:

```text
idle off=32615ms
idle w=1714ms
off=494ms
idle i=none
idle k=none
idle o=none
```

The user had waited approximately 11 seconds after the display went dark. The result therefore supports the qualitative behavior—screen off, wake, app retained—but does not support an exact timing claim. Treat passive screen callbacks and derived timing fields as potentially unreliable while the app is suspended. Use independent wall-clock notes and repeated runs.

Repeated `IDLE` runs on the hardened `1.0.21` / code `22` preview measured approximately 16 seconds from arming the trial to screen-off, consistently across the observed runs. This establishes a repeatable device behavior for this build; it is still an approximate wall-clock observation rather than a platform timing guarantee.

On the fourth observed hardened-build run, waiting longer and tapping to wake returned to the normal watch face rather than reopening Basket Birdie. This is expected with automatic wake relaunch disabled; it confirms the safety build does not force the probe back onto the screen. It should be recorded as watch-face return, not app-resume behavior.

When the screen was tapped immediately after screen-off on another hardened-build run, the Basket Birdie page returned. Wake therefore has timing-dependent behavior: prompt tap resumes the app, while a longer delay can return to the normal watch face when relaunch is disabled.

### Physical capacity lower bound

The physical Bip Max eventually displayed:

```text
capacity >=8MiB
capacity limit 8MiB files=512
```

No storage error was reported. This establishes a lower bound of 8 MiB for the disposable probe on that watch/firmware state. It does not establish the full app quota or the safe maximum for a production round/history model.

The capacity screenshot was from the `1.0.20` / code `21` diagnostic package. The repository manifest was later bumped to `1.0.21` / code `22` while making the capacity output ordering explicit. Keep package version, source revision, and screenshot provenance aligned in future reports.

## 11. What these results do and do not prove

The session established:

- the Intel Mac can run the official Zepp OS simulator after the QEMU permission repair
- Zeus local development mode connects to the simulator on port 7650
- Zeus can build and generate a physical Bip Max preview QR
- the physical Bip Max identity is source `11206915`, OS 6, firmware `3.17.0.4`, API 4.4
- two-generation persistence writes and one exit/reopen recovery path work in the probe
- the physical watch can write at least 8 MiB of disposable data under the probe
- the app stays alive through the observed wake/timeout runs

The session did not establish:

- full storage quota or production-safe round/history capacity
- abrupt power-loss recovery
- the required 20 exit/timeout and 10 controlled-restart recovery matrix
- four-hour battery/resource budgets
- sensor delivery quality, IMU units, clipping, or detector accuracy
- GPS quality or stale-fix policy
- full UI usability across users, wrists, lighting, and damp fingers
- export checksum/retry/privacy behavior
- an 18-hole scorecard field-round result

## 12. Recommended reusable validation sequence

For another Zepp OS app, use this order:

1. Record host OS, CPU architecture, Node, npm, Zeus CLI, and package versions.
2. Confirm Zeus account status without exposing tokens.
3. Install the official simulator package matching host architecture.
4. Download the exact device model/firmware in the simulator.
5. Confirm the simulator control endpoint and QEMU device endpoint.
6. Build with the exact target string accepted by Zeus.
7. Run `zeus dev` and capture `simulator connected`, `rebuild done`, and `refreshing simulator`.
8. Run a simulator smoke test, but label all results simulator-only.
9. Stop simulator development mode before switching to a physical watch.
10. Generate a `zeus preview` QR for the exact physical target.
11. Capture physical runtime identity before interpreting behavior.
12. Run persistence writes, then exit/reopen and capture recovery.
13. Run screen-off and natural-timeout trials with independent wall-clock notes.
14. Run capacity only after confirming the probe writes temporary files and cleans only its own files.
15. Keep screenshots/logs tied to package version, code, app ID, device source, firmware, API, battery, and test steps.
16. Compare simulator and physical results explicitly; never silently merge them.
17. Leave unsupported or unrun acceptance gates marked as unknown.

## 13. Minimal evidence template

```text
App/package:
App ID:
Version/name and code:
Zeus CLI version:
Host OS/architecture:
Target string:
Manifest deviceSource/design target:
Runtime deviceSource/display/keys:
OS/firmware/API:
Battery at start/end:
Permissions:
Simulator or physical watch:
Exact command or touch/key sequence:
Observed output:
Screenshot/log paths:
What the result establishes:
What remains unknown:
```

## 14. Primary references

- [Zepp OS Simulator download](https://docs.zepp.com/docs/guides/tools/simulator/download/)
- [Zepp OS Simulator usage](https://docs.zepp.com/docs/guides/tools/simulator/)
- [Legacy v1 simulator installation](https://docs.zepp.com/docs/guides/tools/simulator/setup/)
- [Zepp OS developer documentation](https://docs.zepp.com/)
