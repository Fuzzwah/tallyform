# Device-support candidate matrix

Inventory dated 2026-09-29. **Only Amazfit Bip Max is currently declared in `app/app.json`; no model is yet release-qualified.** This is a candidate inventory, not a compatibility list or a decision to remove countdown alerts. The physical Bip Max (firmware `3.17.0.4`, owner report) delivered the minimal alarm probe after app exit and during sleep, but shared-state/receipt behavior and the release app remain unqualified. See [continuation notes](continuation.md).

Sources: pinned local Zeus CLI `1.9.3` and its cached `~/.zepp/.zeus_devices` inventory (cache version `1.9.3`, 101 entries, SHA-256 `9d02324c0b6a868dec811fc777cdb876ecd3e5c5a76a1e5c606db47ec0c05fb8`); [official device list](https://docs.zepp.com/docs/reference/related-resources/device-list/) for published screen sizes, API levels and **physical key counts**; [alarm `set`](https://docs.zepp.com/docs/reference/device-app-api/newAPI/alarm/set/), [App Service](https://docs.zepp.com/docs/guides/framework/device/app-service/) and [notification `notify`](https://docs.zepp.com/docs/reference/device-app-api/newAPI/notification/notify/) for background-alert API contracts. A representative `deviceSource` below is for inventory only; regional/NFC variants have distinct sources and must be checked before packaging. Published API versions are latest listed, **not** proof of an individual watch's installed firmware.

## Gates and input policy

- One-shot alarm → App Service → system notification is documented from **API 3.0** with `device:os.alarm` and `device:os.notification`. The current app manifest requires **API 4.0**, so API 3.x devices are not currently installable targets even if those three primitives exist. Do not lower the manifest minimum without checking *every* app API, rebuilding each target and qualifying actual devices. API 1.x/2.x devices lack the required documented background path; they are excluded unless the product contract is explicitly changed.
- Every row with API ≥4 below has **documented primitive availability only**, not proven countdown delivery, notification settings, vibration, permission behavior or state sharing. The App Service has a 600 ms single-execution limit; filesystem writes in it are restricted while the screen is on. The Bip Max receipt gate is still open. No other family has a physical alarm result.
- Screen geometry and **number** of physical keys come from the official device list. Proposed input is touch-first with a complete on-screen fallback, plus optional mapped key actions after native key-event and system-navigation checks. A key count is **not** a colour label, event mapping or proof that touch/key interactions work. Round screens require a separately inspected safe-area layout; smaller rectangles require a separate fit check.
- A candidate becomes declared only after its target manifest/build, native layout and input checks; it becomes release-qualified only after physical family evidence for recording, timer expiry in sleep/after exit, cancellation and recovery. The same API level or screen size cannot stand in for this evidence.

## API 4+ candidates (eligible for a future manifest target, not qualified)

`Shape / px / keys` uses the official physical key count; all input mappings remain untested. “Alarm” is **API-doc candidate** for every row, except the noted Bip Max minimal physical probe. Regional variants and other deviceSource values remain unverified.

| Model | Representative source | Latest API (official; cache if different) | Shape / px / keys | Input and alarm evidence / disposition |
| --- | ---: | --- | --- | --- |
| Amazfit Bip Max | `11206915` | 4.4 | rounded rectangle 432×514 / 2 | Current build target; touch + 2 keys to qualify; **minimal physical alert only**, not release-qualified. |
| Amazfit Bip 6 | `9765121` | 4.2 | rounded rectangle 390×450 / 2 | Touch + 2 keys TBD; API-doc alarm only. |
| Amazfit Active 2 (Square) | `10223875` | 4.2 | rounded rectangle 390×450 / 2 | Touch + 2 keys TBD; API-doc alarm only. NFC sources differ. |
| Amazfit Active 2 (Round) | `8913155` | 4.2 | round 466×466 / 2 | Round safe area, touch + 2 keys TBD; API-doc alarm only. NFC sources differ. |
| Amazfit Balance 2 | `9568513` | 4.2 | round 480×480 / 2 | Round safe area, touch + 2 keys TBD; API-doc alarm only. |
| Amazfit Active Max | `10813697` | 4.2 | round 480×480 / 2 | Round safe area, touch + 2 keys TBD; API-doc alarm only. |
| Amazfit T-Rex 3 | `8716545` | 4.0 (cache 4.4) | round 480×480 / 4 | Four keys require device-specific mapping; API-doc alarm only. Resolve published/cache firmware discrepancy on the device. |
| Amazfit T-Rex 3 Pro (44 mm) | `10682625` | 4.2 (cache 4.4) | round 466×466 / 4 | Round safe area + four keys TBD; API-doc alarm only. |
| Amazfit T-Rex 3 Pro (48 mm) | `10551553` | 4.2 (cache 4.4) | round 480×480 / 4 | Round safe area + four keys TBD; API-doc alarm only. |
| Amazfit T-Rex Ultra 2 | `10879233` | 4.2 (cache 4.4) | round 480×480 / 4 | Round safe area + four keys TBD; API-doc alarm only. |
| Amazfit Active 3 Premium | `10944769` | 4.2 (cache 4.3) | round 466×466 / 4 | Round safe area + four keys TBD; API-doc alarm only. |
| Amazfit Cheetah 2 Pro | `11010305` | 4.3 | round 466×466 / 4 | Round safe area + four keys TBD; API-doc alarm only. |
| Amazfit Balance 3 | `11141377` | 4.4 | round 480×480 / 5 | Five keys require mapping; API-doc alarm only. |
| Amazfit Balance Ultra | `11075841` | 4.4 | round 480×480 / 5 | Five keys require mapping; API-doc alarm only. |
| Amazfit Cheetah 2 Ultra | **source conflict** | 4.3 (cache 4.4) | round 480×480 / 4 | **Hold:** official sources `9961728/9961729` conflict with cache `9978112/9978113`; reconcile identity before any target build. API-doc alarm only. |

The cache additionally names Balance 2 XT, Balance 3 Ti, GTR 4 Limited Edition, Cheetah Pro Kelvin Kiptum, Bip 5 Core and `Rome`. Do not merge these into named products merely because geometry or source ranges look similar: some are regional/NFC/product variants, and `Rome` is an internal name. Resolve model identity and official key counts before declaring them.

## API 3.x exploration backlog (not compatible with the current API 4.0 manifest)

These have documented alarm/App Service/notification API-level eligibility, **not** demonstrated background delivery. Their smaller/round screens and varying key counts require separate layout and control work; lowering the minimum API is a separate compatibility decision, not an automatic broad-support claim.

| Model or family | Representative source | Latest official API | Shape / px / keys | Input and blocker |
| --- | ---: | ---: | --- | --- |
| Bip 5 Unity | `8782081` | 3.0 | rounded rectangle 320×380 / 1 | Touch fallback + single key TBD; current min API 4.0. |
| Active | `8323329` | 3.6 | rounded rectangle 390×450 / 1 | Touch fallback + single key TBD; current min API 4.0. |
| Active Edge | `8388865` | 3.5 (cache 3.6) | round 360×360 / 4 | Tightest round candidate, four keys TBD; current min API 4.0. |
| Balance | `8519937` | 3.7 | round 480×480 / 2 | Touch fallback + 2 keys TBD; current min API 4.0. |
| Cheetah (Square) | `8257793` | 3.6 (cache 3.7) | rounded rectangle 390×450 / 3 | Touch fallback + 3 keys TBD; current min API 4.0. |
| Cheetah (Round) / T-Rex Ultra | `8192257` / `6553857` | 3.6 (cache 3.7) | round 454×454 / 2 or 4 | Distinct key maps, same geometry; current min API 4.0. |
| Cheetah Pro | `8126721` | 3.6 (cache 3.7) | round 480×480 / 2 | Touch fallback + 2 keys TBD; current min API 4.0. |
| GTR 4 / GTS 4 | `7930113` / `7995649` | 3.6 (cache 3.5) | round 466×466 / 2; rectangle 390×450 / 1 | Two layouts and key maps; current min API 4.0. |
| Falcon | `415` | 3.6 (cache 3.7) | round 416×416 / 4 | Round safe area + four keys TBD; current min API 4.0. |

## Exclusions and evidence status

- **API 2.x and earlier:** Bip 5 (not Bip 5 Unity), GTR Mini, T-Rex 2, older GTR 3/GTS 3 and GTS 4 mini cannot satisfy the documented API 3.0 App Service/alarm/notification chain on their listed API levels. Do not ship a foreground-only countdown in their place. Hardware support would require a different approved contract and physical evidence.
- **Non-Zepp OS:** older GTR 2/Zepp E/T-Rex Pro in the official non-Zepp OS table are outside this app runtime.
- **Unknown or conflicting metadata:** do not guess a source, firmware version, key count or regional identity. Cache/official discrepancies above are research issues, not declarations of incompatibility or of support.
- **Evidence ladder:** inventory (this document) → target build and simulator layout/input → physical family acceptance on the exact package/firmware → release listing. Only the first rung is addressed here; the existing Bip Max prototype build and basic alarm report are separate partial evidence. Keep additional families labelled **candidate** until every rung is met.
