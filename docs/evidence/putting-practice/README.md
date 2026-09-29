# Historical Putting Practice simulator captures

Captured 2026-09-28 from the official Zepp OS Simulator 2.1.2, selected image Bip Max v1.0.0. Historical app: Putting Practice 0.1.0, code 1, app ID 1126719. Launched using `zeus dev --target "Amazfit Bip Max"` from the pre-extraction workspace.

- `01-button-setup.png`: silver-button setup prompt with existing touch-recorded practice data.
- `02-metric-results.png`: 4 m, five makes and one miss, 83% session success.
- `03-feet-results.png`: the same distance displayed as 13.12 ft; counts preserved after switching units.

These are unmodified emulator-window captures, including its title bar. Native app title is truncated by the system header. Physical silver/red mapping and watch acceptance remain unverified. The screenshots show touch-input results, not proof of physical button behavior.

These captures are historical prototype evidence, not current Tallyform marketing assets.

## Mockup-inspired layout revision

`04-mockup-layout.png` captures the revised native layout: branded heading, bordered green distance card, separate unit selectors, made/missed cards, selected-distance make rate and compact utility footer. Captured after switching back to metres and skipping hardware calibration. The native title bar is hidden on this page to avoid the earlier truncated title. The screenshot shows real preserved simulator counts (5 made, 1 missed), not the sample numbers from the reference image. Seven putting host tests and the Bip Max package build passed after this revision.
